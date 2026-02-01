import {Args, Command} from '@oclif/core'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {setDefault, isValidConfigKey, configKeyToDefaultsKey, CONFIG_KEYS} from '../../lib/config.js'

export default class ConfigSet extends Command {
  static override description = 'Set a configuration value'

  static override examples = [
    '<%= config.bin %> config set default-team-id d1ad1a80-9267-4ebc-979a-eaf885898a2c',
    '<%= config.bin %> config set default-team-key MITO',
  ]

  static override args = {
    key: Args.string({
      description: `Config key (${CONFIG_KEYS.join(', ')})`,
      required: true,
    }),
    value: Args.string({
      description: 'Config value',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args} = await this.parse(ConfigSet)

      if (!isValidConfigKey(args.key)) {
        throw new CliError(
          ErrorCodes.INVALID_INPUT,
          `Invalid config key: ${args.key}. Valid keys: ${CONFIG_KEYS.join(', ')}`,
        )
      }

      const defaultsKey = configKeyToDefaultsKey(args.key)
      setDefault(defaultsKey, args.value)

      print(
        success({
          key: args.key,
          value: args.value,
          message: `Configuration "${args.key}" set successfully`,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
