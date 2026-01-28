import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class RelationsDelete extends Command {
  static override description = 'Delete an issue relation'

  static override examples = ['<%= config.bin %> relations delete RELATION_ID']

  static override args = {
    id: Args.string({
      description: 'Relation ID',
      required: true,
    }),
  }

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(RelationsDelete)
      const format = flags.format as OutputFormat
      const client = getClient()

      const payload = await client.deleteIssueRelation(args.id)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to delete relation')
      }

      const data = {
        id: args.id,
        deleted: true,
      }

      if (format === 'json') {
        print(success(data))
      } else {
        console.log(`Relation ${args.id} deleted`)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
