import {Command} from '@oclif/core'
import {success, print} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {getDefaults, getApiKey, getConfigPath, CONFIG_KEYS, configKeyToDefaultsKey} from '../../lib/config.js'

export default class ConfigList extends Command {
  static override description = 'List all configuration values'

  static override examples = ['<%= config.bin %> config list']

  public async run(): Promise<void> {
    try {
      const defaults = getDefaults()
      const apiKey = getApiKey()

      const config: Record<string, string | null> = {}

      // Add all config keys with their values
      for (const key of CONFIG_KEYS) {
        const defaultsKey = configKeyToDefaultsKey(key)
        config[key] = defaults[defaultsKey] ?? null
      }

      print(
        success({
          configPath: getConfigPath(),
          authenticated: apiKey !== undefined,
          apiKeySource: apiKey ? (process.env.LINEAR_API_KEY ? 'environment' : 'config') : null,
          defaults: config,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
