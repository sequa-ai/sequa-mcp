#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { AuthCoordinator } from './helpers/auth-coordinator.js'
import { CliParser } from './helpers/cli-parser.js'
import { ConfigRepository } from './helpers/config-repository.js'
import { McpProxy } from './helpers/mcp-proxy.js'
import { log, setupShutdownHook } from './helpers/utils.js'

async function startMcp(serverUrl: URL, apiKey?: string) {
  log(`Starting MCP proxy for ${serverUrl}`)

  const configRepository = new ConfigRepository(serverUrl)
  const authCoordinator = new AuthCoordinator(configRepository)

  const cleanupFunctions: Array<() => unknown> = [await authCoordinator.startCallbackServer()]

  const cleanup = async () => {
    for (const cleanupFunction of cleanupFunctions.reverse()) {
      await cleanupFunction()
    }
  }

  try {
    const localTransport = new StdioServerTransport()
    await McpProxy.createProxy(
      localTransport,
      async () => await authCoordinator.initRemoteTransport(apiKey),
      () => process.exit(0),
    )

    await localTransport.start()
    cleanupFunctions.push(async () => localTransport.close())

    log('Local STDIO server running')
    log(`Proxy established successfully between local STDIO and remote`)
    log('Press Ctrl+C to exit')

    setupShutdownHook(cleanup)
  } catch (error) {
    log('Fatal error:', error)
    await cleanup()

    process.exit(1)
  }
}

const usage = 'Usage: npx @sequa-ai/sequa-mcp <https://mcp-server-url>'
CliParser.parseCommandLineArgs(process.argv.slice(2), usage)
  .then(({ positionalArgs }) => {
    const serverUrl = positionalArgs[0] || process.env.MCP_SERVER_URL || 'https://mcp.sequa.ai/v1/setup-code-assistant'

    return startMcp(new URL(serverUrl), process.env.API_KEY)
  })
  .catch((error) => {
    log('Fatal error:', error)

    process.exit(1)
  })
