import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { getServerUrlHash, log } from './utils.js'

export class ConfigRepository {
  private readonly version = 3
  private readonly configDir: string

  constructor(private readonly serverUrl: URL) {
    this.configDir = path.join(os.homedir(), '.mcp-auth', `${getServerUrlHash(serverUrl)}-v${this.version}`)
  }

  public getServerUrl(): URL {
    return this.serverUrl
  }

  public async readConfig<T>(name: string): Promise<T | undefined> {
    await this.ensureConfigDir()

    try {
      const filePath = this.getConfigFilePath(name)
      const content = await fs.readFile(filePath, 'utf-8')

      return JSON.parse(content) as T
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined
      }

      log(`Error reading ${name}:`, error)

      return undefined
    }
  }

  public async writeConfig<T>(name: string, data: T): Promise<void> {
    await this.ensureConfigDir()

    try {
      const filePath = this.getConfigFilePath(name)
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      log(`Error writing ${name}:`, error)

      throw error
    }
  }

  public async deleteConfig(name: string): Promise<void> {
    try {
      const filePath = this.getConfigFilePath(name)
      await fs.unlink(filePath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        log(`Error deleting ${name}:`, error)
      }
    }
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true })
    } catch (error) {
      log('Error creating config directory:', error)

      throw error
    }
  }

  private getConfigFilePath(name: string): string {
    return path.join(this.configDir, `${name}.json`)
  }
}
