import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import type { OAuthClientInformation, OAuthClientMetadata, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js'
import open from 'open'

import type { AuthCoordinator } from './auth-coordinator'

export type InvalidateCredentialsScope = 'all' | 'client' | 'tokens' | 'verifier'

export class NodeOauthClientProvider implements OAuthClientProvider {
  constructor(private readonly coordinator: AuthCoordinator) {}

  public get clientMetadata(): OAuthClientMetadata {
    return { client_name: 'Sequa MCP', redirect_uris: [this.redirectUrl] }
  }

  public get redirectUrl(): string {
    return this.coordinator.getRedirectUrl()
  }

  public async clientInformation(): Promise<OAuthClientInformation | undefined> {
    return await this.coordinator.getClientInformation()
  }

  public async saveClientInformation(clientInformation: OAuthClientInformation): Promise<void> {
    await this.coordinator.saveClientInformation(clientInformation)
  }

  public async state(): Promise<string> {
    return encodeURIComponent(this.coordinator.getServerUrl().toString())
  }

  public async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    await open(authorizationUrl.toString())
  }

  public async codeVerifier(): Promise<string> {
    const codeVerifier = await this.coordinator.getCodeVerifier()

    if (!codeVerifier) {
      throw new Error('Code verifier is not set')
    }

    return codeVerifier
  }

  public async saveCodeVerifier(codeVerifier: string): Promise<void> {
    await this.coordinator.saveCodeVerifier(codeVerifier)
  }

  public async tokens(): Promise<OAuthTokens | undefined> {
    return await this.coordinator.getTokens()
  }

  public async saveTokens(tokens: OAuthTokens): Promise<void> {
    await this.coordinator.saveTokens(tokens)
  }

  public async invalidateCredentials(scope: InvalidateCredentialsScope): Promise<void> {
    await this.coordinator.invalidateCredentials(scope)
  }
}
