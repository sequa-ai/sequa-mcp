import type * as http from 'node:http'

import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import { auth, UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { OAuthClientInformation } from '@modelcontextprotocol/sdk/shared/auth.js'
import type { OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { Request, Response } from 'express'
import express from 'express'

import type { ConfigRepository } from './config-repository.js'
import type { InvalidateCredentialsScope } from './node-oauth-client-provider.js'
import { NodeOauthClientProvider } from './node-oauth-client-provider.js'
import { debugLog, log, setupShutdownHook, sleep } from './utils.js'

interface LockData {
  pid: number
  expiresAt: Date
}

enum TransportType {
  StreamableHTTP = 'streamable-http',
  SSE = 'sse',
}

export class AuthCoordinator {
  private server: http.Server | undefined = undefined

  constructor(private readonly configRepository: ConfigRepository) {}

  public async startCallbackServer() {
    return new Promise<() => unknown>(async (resolve, reject) => {
      const app = express()

      app.get('/auth/callback', async (req: Request, res: Response) => {
        const sendResponse = (status: number, message: string) => {
          res.status(status).send(`<h1>${message}</h1><p>You can now close this window</p>`)
        }

        try {
          const code = req.query.code
          const state = req.query.state

          if (typeof code !== 'string') {
            return sendResponse(400, 'Invalid authorization code')
          }

          if (typeof state !== 'string') {
            return sendResponse(400, 'Invalid state parameter')
          }

          if (decodeURIComponent(state) !== this.getServerUrl().toString()) {
            return sendResponse(400, 'Wrong authorization server')
          }

          sendResponse(200, 'Authorization Completed')

          log('Authorization code received')

          await auth(this.getAuthProvider(), {
            serverUrl: this.configRepository.getServerUrl(),
            authorizationCode: code,
          })

          log('Authentication completed successfully')
        } catch (error) {
          log('Error handling auth callback:', error)

          return sendResponse(500, 'Internal Server Error')
        }
      })

      const serverPort = await this.configRepository.readConfig<number>('auth-server-port')
      this.server = app.listen(serverPort || 0, (err) => {
        if (err) {
          if ((err as any).code === 'EADDRINUSE') {
            log(`Authentication server port ${serverPort} is already in use. Probably mcp proxy is already running.`)

            return resolve(() => {})
          } else {
            log('Error starting authentication server:', err)

            return reject(err)
          }
        }

        const address = this.server?.address()

        if (!address || typeof address === 'string') {
          log('Failed to start authentication server: Port is not available')

          return reject(new Error('Authentication server address is not available'))
        }

        log(`Authentication server started successfully on http://localhost:${address.port}`)

        return resolve(() => {
          if (this.server) {
            this.server.close()
            this.server = undefined
          }
        })
      })
    })
  }

  public async initRemoteTransport(apiKey?: string): Promise<Transport> {
    let lockFileCreated = false
    setupShutdownHook(async () => {
      if (lockFileCreated) {
        await this.configRepository.deleteConfig('lock')
      }
    })

    const availableTransports = Object.values(TransportType)
    let currentTransportIndex = 0

    while (true) {
      const lockData = await this.configRepository.readConfig<LockData>('lock')
      if (!lockData || (lockData.expiresAt < new Date() && lockData.pid !== process.pid)) {
        log('Test remote authentication')

        await this.configRepository.writeConfig<LockData>('lock', {
          pid: process.pid,
          expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        })
        lockFileCreated = true

        try {
          const testTransport = this.createRemoteTransport(availableTransports[currentTransportIndex], apiKey)
          const testClient = new Client(
            { name: 'sequa-mcp-authentication-test', version: '1.0.0' },
            { capabilities: {} },
          )
          await testClient.connect(testTransport)
          await testClient.close()

          lockFileCreated = false
          await this.configRepository.deleteConfig('lock')

          break
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            continue
          }

          lockFileCreated = false
          await this.configRepository.deleteConfig('lock')

          if (currentTransportIndex < availableTransports.length - 1) {
            debugLog(`Error with transport ${availableTransports[currentTransportIndex]}:`, error)
            currentTransportIndex++
            log(`Switching to next transport: ${availableTransports[currentTransportIndex]}`)

            continue
          }

          throw error
        }
      }

      debugLog('Waiting for tokens...')

      await sleep(2000)
    }

    return this.createRemoteTransport(availableTransports[currentTransportIndex], apiKey)
  }

  public getServerUrl(): URL {
    return this.configRepository.getServerUrl()
  }

  public getCallbackPort(): number {
    const address = this.server?.address()

    if (!address || typeof address === 'string') {
      throw new Error('Redirect URL cannot be retrieved before server is started')
    }

    return address.port
  }

  public getRedirectUrl(): string {
    return `http://localhost:${this.getCallbackPort()}/auth/callback`
  }

  public async getClientInformation(): Promise<OAuthClientInformation | undefined> {
    return await this.configRepository.readConfig<OAuthClientInformation>('client-information')
  }

  public async saveClientInformation(clientInformation: OAuthClientInformation): Promise<void> {
    await this.configRepository.writeConfig<number>('auth-server-port', this.getCallbackPort())
    await this.configRepository.writeConfig<OAuthClientInformation>('client-information', clientInformation)
  }

  public async getTokens(): Promise<OAuthTokens | undefined> {
    return await this.configRepository.readConfig<OAuthTokens>('tokens')
  }

  public async saveTokens(tokens: OAuthTokens): Promise<void> {
    await this.configRepository.writeConfig<OAuthTokens>('tokens', tokens)

    await this.configRepository.deleteConfig('lock')
    await this.configRepository.deleteConfig('code-verifier')
  }

  public async getCodeVerifier(): Promise<string | undefined> {
    return await this.configRepository.readConfig<string>('code-verifier')
  }

  public async saveCodeVerifier(codeVerifier: string): Promise<void> {
    await this.configRepository.writeConfig<string>('code-verifier', codeVerifier)
  }

  private createRemoteTransport(type: TransportType, apiKey?: string): Transport {
    const customFetch = (url: string | URL, init?: RequestInit) => {
      if (apiKey) {
        const headers = new Headers(init?.headers)
        headers.set('X-Api-Key', apiKey)

        return fetch(url, init ? { ...init, headers } : { headers })
      }

      return fetch(url, init)
    }

    if (type === TransportType.StreamableHTTP) {
      return new StreamableHTTPClientTransport(this.configRepository.getServerUrl(), {
        authProvider: this.getAuthProvider(),
        fetch: customFetch,
      })
    } else if (type === TransportType.SSE) {
      return new SSEClientTransport(this.configRepository.getServerUrl(), {
        authProvider: this.getAuthProvider(),
        fetch: customFetch,
      })
    }

    throw new Error(`Unsupported transport type: ${type}`)
  }

  private getAuthProvider(): OAuthClientProvider {
    return new NodeOauthClientProvider(this)
  }

  async invalidateCredentials(scope: InvalidateCredentialsScope) {
    if (scope === 'all' || scope === 'client') {
      await this.configRepository.deleteConfig('client-information')
    }

    if (scope === 'all' || scope === 'tokens') {
      await this.configRepository.deleteConfig('tokens')
    }

    if (scope === 'all' || scope === 'verifier') {
      await this.configRepository.deleteConfig('code-verifier')
    }
  }
}
