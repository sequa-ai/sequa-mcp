import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

import { getTimestamp, log } from './utils.js'

export class McpProxy {
  public static async createProxy(transportToClient: Transport, transportToServer: Transport) {
    const proxy = new McpProxy(transportToClient, transportToServer)
    await proxy.initialize()

    return proxy
  }

  private transportToClient: Transport
  private transportToServer: Transport
  private clientClosed: boolean = false
  private serverClosed: boolean = false
  private clientErrored: boolean = false
  private serverErrored: boolean = false

  constructor(transportToClient: Transport, transportToServer: Transport) {
    this.transportToClient = transportToClient
    this.transportToServer = transportToServer
  }

  public async initialize() {
    this.transportToClient.onmessage = this.handleClientMessage.bind(this)
    this.transportToServer.onmessage = this.handleServerMessage.bind(this)

    this.transportToClient.onclose = this.handleClientClose.bind(this)
    this.transportToServer.onclose = this.handleServerClose.bind(this)

    this.transportToClient.onerror = this.handleClientError.bind(this)
    this.transportToServer.onerror = this.handleServerError.bind(this)
  }

  private handleClientMessage(message: any) {
    try {
      if (this.serverClosed || this.serverErrored) {
        log('Server connection closed or errored, cannot forward client message')
        return
      }

      log(`[${getTimestamp()}] Client -> Server: ${JSON.stringify(message)}`)

      this.transportToServer.send(message).catch((error) => {
        log('Error forwarding message to server', error)
      })
    } catch (error) {
      log('Error handling client message:', error)
    }
  }

  private handleServerMessage(message: any) {
    try {
      if (this.clientClosed || this.clientErrored) {
        log('Client connection closed or errored, cannot forward server message')
        return
      }

      log(`[${getTimestamp()}] Server -> Client: ${JSON.stringify(message)}`)

      this.transportToClient.send(message).catch((error) => {
        log('Error forwarding message to client', error)
      })
    } catch (error) {
      log('Error handling server message:', error)
    }
  }

  private handleClientClose() {
    this.clientClosed = true
    log('Client connection closed')

    if (!this.serverClosed && !this.serverErrored) {
      this.transportToServer.close().catch((error) => {
        log('Error closing server connection', error)
      })
    }
  }

  private handleServerClose() {
    this.serverClosed = true
    log('Server connection closed')

    if (!this.clientClosed && !this.clientErrored) {
      this.transportToClient.close().catch((error) => {
        log('Error closing client connection', error)
      })
    }
  }

  private handleClientError(error: Error) {
    this.clientErrored = true
    log('Client connection error:', error)

    if (!this.serverClosed && !this.serverErrored) {
      this.transportToServer.close().catch(() => {})
    }
  }

  private handleServerError(error: Error) {
    this.serverErrored = true
    log('Server connection error:', error)

    if (!this.clientClosed && !this.clientErrored) {
      this.transportToClient.close().catch(() => {})
    }
  }
}
