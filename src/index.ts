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

  const remoteTransport = await authCoordinator.initRemoteTransport(apiKey)
  const localTransport = new StdioServerTransport()

  const cleanup = async () => {
    for (const cleanupFunction of cleanupFunctions.reverse()) {
      await cleanupFunction()
    }
  }

  try {
    await McpProxy.createProxy(localTransport, remoteTransport, () => process.exit(0))

    await remoteTransport.start()
    cleanupFunctions.push(async () => remoteTransport.close())

    await localTransport.start()
    cleanupFunctions.push(async () => localTransport.close())

    log('Local STDIO server running')
    log(`Proxy established successfully between local STDIO and remote ${remoteTransport.constructor.name}`)
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
    if (!positionalArgs[0]) {
      throw new Error('Server URL is required. ' + usage)
    }

    return startMcp(new URL(positionalArgs[0]), process.env.API_KEY)
  })
  .catch((error) => {
    log('Fatal error:', error)

    process.exit(1)
  })
