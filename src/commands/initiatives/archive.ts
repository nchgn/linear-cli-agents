import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'

export default class InitiativesArchive extends Command {
  static override description = 'Archive or unarchive an initiative'

  static override examples = [
    '<%= config.bin %> initiatives archive INITIATIVE_ID',
    '<%= config.bin %> initiatives archive INITIATIVE_ID --unarchive',
  ]

  static override args = {
    id: Args.string({
      description: 'Initiative ID',
      required: true,
    }),
  }

  static override flags = {
    unarchive: Flags.boolean({
      char: 'u',
      description: 'Unarchive instead of archive',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(InitiativesArchive)
      const client = getClient()

      const payload = flags.unarchive
        ? await client.unarchiveInitiative(args.id)
        : await client.archiveInitiative(args.id)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, `Failed to ${flags.unarchive ? 'unarchive' : 'archive'} initiative`)
      }

      print(
        success({
          id: args.id,
          archived: !flags.unarchive,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
