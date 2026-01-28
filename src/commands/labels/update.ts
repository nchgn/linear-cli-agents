import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class LabelsUpdate extends Command {
  static override description = 'Update a label'

  static override examples = [
    '<%= config.bin %> labels update LABEL_ID --name "Updated Name"',
    '<%= config.bin %> labels update LABEL_ID --color "#00FF00"',
    '<%= config.bin %> labels update LABEL_ID --description "New description"',
  ]

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
    name: Flags.string({
      char: 'n',
      description: 'Label name',
    }),
    color: Flags.string({
      char: 'c',
      description: 'Label color (hex, e.g., #FF0000)',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Label description',
    }),
    'parent-id': Flags.string({
      description: 'Parent label ID',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(LabelsUpdate)
      const format = flags.format as OutputFormat
      const client = getClient()

      const input: Record<string, unknown> = {}
      if (flags.name) input.name = flags.name
      if (flags.color) input.color = flags.color
      if (flags.description) input.description = flags.description
      if (flags['parent-id']) input.parentId = flags['parent-id']

      if (Object.keys(input).length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'At least one field to update is required')
      }

      const payload = await client.updateIssueLabel(args.id, input)

      if (!payload.success || !payload.issueLabel) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update label')
      }

      const label = await payload.issueLabel
      const [team, parent] = await Promise.all([label.team, label.parent])

      const data = {
        id: label.id,
        name: label.name,
        color: label.color,
        description: label.description,
        isGroup: label.isGroup,
        team: team
          ? {
              id: team.id,
              key: team.key,
              name: team.name,
            }
          : null,
        parent: parent
          ? {
              id: parent.id,
              name: parent.name,
            }
          : null,
        createdAt: label.createdAt,
        updatedAt: label.updatedAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            name: data.name,
            color: data.color,
            description: data.description ?? 'N/A',
            team: data.team?.key ?? 'Workspace',
            parent: data.parent?.name ?? 'N/A',
            updatedAt: data.updatedAt,
          } as Record<string, unknown>,
          format,
        )
      } else {
        console.log(data.id)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
