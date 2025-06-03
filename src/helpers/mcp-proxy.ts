import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

import { getTimestamp, log } from './utils.js'

export class McpProxy {
  public static async createProxy(transportToClient: Transport, transportToServer: Transport) {
    const proxy = new McpProxy(transportToClient, transportToServer)
    await proxy.initialize()

    return proxy
  }

  private running = true

  constructor(
    private readonly transportToClient: Transport,
    private readonly transportToServer: Transport,
  ) {}

  public async initialize() {
    this.transportToClient.onmessage = this.handleClientMessage.bind(this)
    this.transportToServer.onmessage = this.handleServerMessage.bind(this)

    this.transportToClient.onclose = this.handleClientClose.bind(this)
    this.transportToServer.onclose = this.handleServerClose.bind(this)

    this.transportToClient.onerror = this.handleClientError.bind(this)
    this.transportToServer.onerror = this.handleServerError.bind(this)
  }

  private async handleClientMessage(message: any) {
    if (!this.running) {
      return
    }

    try {
      log(`[${getTimestamp()}] Client -> Server: ${JSON.stringify(message)}`)

      await this.transportToServer.send(message).catch((error) => {
        log('Error forwarding message to server:', error)
        this.handleServerError(error instanceof Error ? error : new Error(String(error)))
      })
    } catch (error) {
      await this.handleClientError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private async handleServerMessage(message: any) {
    if (!this.running) {
      return
    }

    try {
      log(`[${getTimestamp()}] Server -> Client: ${JSON.stringify(message)}`)

      await this.transportToClient.send(message).catch((error) => {
        log('Error forwarding message to client:', error)
        this.handleClientError(error instanceof Error ? error : new Error(String(error)))
      })
    } catch (error) {
      await this.handleServerError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private async handleClientClose() {
    if (!this.running) {
      return
    }

    log('Client connection closed')
    await this.shutdown()
  }

  private async handleServerClose() {
    if (!this.running) {
      return
    }

    log('Server connection closed')
    await this.shutdown()
  }

  private async handleClientError(error: Error) {
    if (!this.running) {
      return
    }

    log('Client error received', error)
    await this.shutdown()
  }

  private async handleServerError(error: Error) {
    if (!this.running) {
      return
    }

    log('Server error received', error)
    await this.shutdown()
  }

  private async shutdown(): Promise<void> {
    if (this.running) {
      this.running = false

      await this.safeClose(this.transportToClient)
      await this.safeClose(this.transportToServer)
    }
  }

  private async safeClose(transport: Transport): Promise<void> {
    try {
      await transport.close()
    } catch {}
  }
}
