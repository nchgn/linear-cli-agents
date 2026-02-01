import {Args, Command} from '@oclif/core'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {getDefaults, isValidConfigKey, configKeyToDefaultsKey, CONFIG_KEYS} from '../../lib/config.js'

export default class ConfigGet extends Command {
  static override description = 'Get a configuration value'

  static override examples = [
    '<%= config.bin %> config get default-team-id',
    '<%= config.bin %> config get default-team-key',
  ]

  static override args = {
    key: Args.string({
      description: `Config key (${CONFIG_KEYS.join(', ')})`,
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args} = await this.parse(ConfigGet)

      if (!isValidConfigKey(args.key)) {
        throw new CliError(
          ErrorCodes.INVALID_INPUT,
          `Invalid config key: ${args.key}. Valid keys: ${CONFIG_KEYS.join(', ')}`,
        )
      }

      const defaults = getDefaults()
      const defaultsKey = configKeyToDefaultsKey(args.key)
      const value = defaults[defaultsKey]

      print(
        success({
          key: args.key,
          value: value ?? null,
          isSet: value !== undefined,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
