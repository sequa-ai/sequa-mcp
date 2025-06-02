import crypto from 'crypto'

export function getServerUrlHash(key: URL): string {
  return crypto.createHash('sha256').update(key.toString()).digest('hex')
}

export function getTimestamp(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
}

export function debugLog(str: string, ...rest: any[]) {
  if (!process.env.DEBUG) {
    return
  }

  console.error(`[DEBUG] [${process.pid}] ${str}`, ...rest)
}

export function log(str: string, ...rest: unknown[]) {
  console.error(`[LOG] [${process.pid}] ${str}`, ...rest)
}

export function setupSignalHandlers(cleanup: () => Promise<void>) {
  process.on('SIGINT', async () => {
    log('\nShutting down...')
    await cleanup()
    process.exit(0)
  })

  process.stdin.resume()
  process.stdin.on('end', async () => {
    log('\nShutting down...')
    await cleanup()
    process.exit(0)
  })
}
