import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class LabelsDelete extends Command {
  static override description = 'Delete a label'

  static override examples = ['<%= config.bin %> labels delete LABEL_ID']

  static override args = {
    id: Args.string({
      description: 'Label ID',
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
      const {args, flags} = await this.parse(LabelsDelete)
      const format = flags.format as OutputFormat
      const client = getClient()

      const payload = await client.deleteIssueLabel(args.id)

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to delete label')
      }

      const data = {
        id: args.id,
        deleted: true,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        console.log(`Label ${args.id} deleted successfully`)
      } else {
        console.log(args.id)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
