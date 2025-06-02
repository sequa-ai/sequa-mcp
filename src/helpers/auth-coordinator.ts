import type * as http from 'node:http'

import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { OAuthClientInformation } from '@modelcontextprotocol/sdk/shared/auth.js'
import type { OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js'
import type { Request, Response } from 'express'
import express from 'express'

import type { ConfigRepository } from './config-repository.js'
import { NodeOauthClientProvider } from './node-oauth-client-provider.js'
import { debugLog, log } from './utils.js'

interface LockData {
  pid: number
  expiresAt: Date
}

export class AuthCoordinator {
  private server: http.Server | undefined = undefined

  constructor(private readonly configRepository: ConfigRepository) {}

  public async startCallbackServer() {
    return new Promise<() => unknown>((resolve, reject) => {
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

          const transport = this.createRemoteTransport()
          await transport.finishAuth(code)

          log('Authentication completed successfully')
        } catch (error) {
          log('Error handling auth callback:', error)

          return sendResponse(500, 'Internal Server Error')
        }
      })

      this.server = app.listen(0, (err) => {
        if (err) {
          log('Error starting authentication server:', err)

          return reject(err)
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

  public async initRemoteTransport() {
    while (true) {
      if (await this.getTokens()) {
        break
      }

      const lockData = await this.configRepository.readConfig<LockData>('lock')
      if (!lockData || (lockData.expiresAt < new Date() && lockData.pid !== process.pid)) {
        log('No lock found, initiating authentication')

        await this.configRepository.writeConfig<LockData>('lock', {
          pid: process.pid,
          expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        })

        try {
          const testTransport = this.createRemoteTransport()
          const testClient = new Client({ name: 'authentication-test', version: '1.0.0' }, { capabilities: {} })
          await testClient.connect(testTransport)

          break
        } catch (error) {
          if (error instanceof UnauthorizedError) {
            continue
          }

          log('Error initiating authentication:', error)
        }
      }

      debugLog('Waiting for tokens...')

      await new Promise((res) => setTimeout(res, 2000))
    }

    return this.createRemoteTransport()
  }

  public getServerUrl(): URL {
    return this.configRepository.getServerUrl()
  }

  public getRedirectUrl(): string {
    const address = this.server?.address()

    if (!address || typeof address === 'string') {
      throw new Error('Redirect URL cannot be retrieved before server is started')
    }

    return `http://localhost:${address.port}/auth/callback`
  }

  public async getClientInformation(): Promise<OAuthClientInformation | undefined> {
    return await this.configRepository.readConfig<OAuthClientInformation>('client-information')
  }

  public async saveClientInformation(clientInformation: OAuthClientInformation): Promise<void> {
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

  public createRemoteTransport(): StreamableHTTPClientTransport {
    return new StreamableHTTPClientTransport(this.configRepository.getServerUrl(), {
      authProvider: new NodeOauthClientProvider(this),
    })
  }
}
