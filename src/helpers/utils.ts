import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'

export function getServerUrlHash(key: URL): string {
  return crypto.createHash('sha256').update(key.toString()).digest('hex')
}

export function getTimestamp(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
}

export function debugLog(str: string, ...rest: unknown[]) {
  if (!process.env.DEBUG) {
    return
  }

  void printLog('DEBUG', str, ...rest)
}

export function log(str: string, ...rest: unknown[]) {
  if (!process.env.LOGGING && !process.env.DEBUG) {
    return
  }

  void printLog('LOG', str, ...rest)
}

export function fatalLog(str: string, ...rest: unknown[]) {
  void printLog('FATAL', str, ...rest)
}

export async function printLog(type: string, str: string, ...rest: unknown[]) {
  console.error(`[${type}] [${process.pid}] ${str}`, ...rest)

  if (!process.env.STORE_LOGS) {
    return
  }

  try {
    const logfile = path.join(os.homedir(), '.mcp-auth', 'mcp-proxy.log')
    await fs.promises.appendFile(logfile, `[${new Date().toISOString()}] [${type}] [${process.pid}] ${str}\n`, 'utf-8')

    for (const arg of rest) {
      await fs.promises.appendFile(logfile, `${String(arg)}\n`, 'utf-8')
    }
  } catch {}
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

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
