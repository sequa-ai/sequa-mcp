import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'

import { fatalLog, getTimestamp, log, sleep } from './utils.js'

export class McpProxy {
  public static async createProxy(
    localTransport: Transport,
    connectToRemote: () => Promise<Transport>,
    onShutdown: () => void,
  ) {
    const proxy = new McpProxy(localTransport, connectToRemote, onShutdown)
    await proxy.initialize()

    return proxy
  }

  private running = true
  private currentRemote: Transport | undefined = undefined

  private initMessage: any | undefined = undefined

  constructor(
    private readonly localTransport: Transport,
    private readonly connectToRemote: () => Promise<Transport>,
    private readonly onShutdown: () => void,
  ) {}

  public async initialize() {
    this.running = true
    await this.initializeRemote()
  }

  private async initializeRemote() {
    if (!this.running) {
      return
    }

    if (this.currentRemote) {
      log('Reconnecting to remote')

      this.currentRemote.onmessage = undefined
      this.currentRemote.onclose = undefined
      this.currentRemote.onerror = undefined
    }

    let retryCount = 0
    while (true) {
      try {
        this.currentRemote = await this.connectToRemote()
        await this.currentRemote.start()

        if (this.initMessage) {
          await this.currentRemote.send(this.initMessage)
        }

        break
      } catch (error) {
        if (retryCount > 3) {
          await this.shutdown()

          throw error
        }

        retryCount++
        fatalLog('Error connecting to remote:', error)

        await sleep(2000)
      }
    }

    this.localTransport.onmessage = this.handleClientMessage.bind(this)
    this.currentRemote.onmessage = this.handleServerMessage.bind(this)

    this.localTransport.onclose = this.handleClientClose.bind(this)
    this.currentRemote.onclose = this.handleServerClose.bind(this)

    this.localTransport.onerror = this.handleClientError.bind(this)
    this.currentRemote.onerror = this.handleServerError.bind(this)
  }

  private async handleClientMessage(message: any) {
    if (isInitializeRequest(message)) {
      this.initMessage = message
    }

    if (!this.currentRemote) {
      throw new Error('Remote transport is not initialized')
    }

    try {
      log(`[${getTimestamp()}] Client -> Server: ${JSON.stringify(message)}`)

      await this.currentRemote.send(message)
    } catch (error) {
      log('Error forwarding message to server:', error)

      const maxAttempts = 3
      for (let i = 0; i < maxAttempts; i++) {
        try {
          log(`Retrying to send message ${i + 1}/${maxAttempts}`)

          await this.initializeRemote()
          await this.currentRemote.send(message)

          break
        } catch (error) {
          fatalLog(`Error sending retry message`, error)

          await sleep(2000)
        }
      }
    }
  }

  private async handleServerMessage(message: any) {
    try {
      log(`[${getTimestamp()}] Server -> Client: ${JSON.stringify(message)}`)

      await this.localTransport.send(message)
    } catch (error) {
      log('Error forwarding message to client:', error)

      void this.shutdown()
    }
  }

  private async handleClientClose() {
    log('Client connection closed')
    await this.shutdown()
  }

  private async handleServerClose() {
    log('Server connection closed')
    await this.initializeRemote()
  }

  private async handleClientError(error: Error) {
    log('Client error received', error)
    await this.shutdown()
  }

  private async handleServerError(error: Error) {
    log('Server error received', error)
  }

  private async shutdown(): Promise<void> {
    if (this.running) {
      this.running = false

      await this.safeClose(this.currentRemote)
      await this.safeClose(this.localTransport)

      this.onShutdown()
    }
  }

  private async safeClose(transport: Transport | undefined): Promise<void> {
    if (!transport) {
      return
    }

    try {
      await transport.close()
    } catch {}
  }
}
