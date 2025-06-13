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
  if (!process.env.LOGGING && !process.env.DEBUG) {
    return
  }

  console.error(`[LOG] [${process.pid}] ${str}`, ...rest)
}

export function setupShutdownHook(cleanup: () => Promise<void>) {
  const fn = async () => {
    log('Shutting down...')
    await cleanup()
    process.exit(0)
  }

  process.on('SIGINT', fn)
  process.on('SIGTERM', fn)
}
