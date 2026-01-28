import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class LabelsCreate extends Command {
  static override description = 'Create a label'

  static override examples = [
    '<%= config.bin %> labels create --name "Bug" --color "#FF0000"',
    '<%= config.bin %> labels create --name "Feature" --color "#00FF00" --description "New feature requests"',
    '<%= config.bin %> labels create --name "Backend" --color "#0000FF" --team-id TEAM_ID',
    '<%= config.bin %> labels create --name "API" --color "#FF00FF" --parent-id PARENT_LABEL_ID',
  ]

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
      required: true,
    }),
    color: Flags.string({
      char: 'c',
      description: 'Label color (hex, e.g., #FF0000)',
      required: true,
    }),
    description: Flags.string({
      char: 'd',
      description: 'Label description',
    }),
    'team-id': Flags.string({
      description: 'Team ID (for team-specific labels)',
    }),
    'parent-id': Flags.string({
      description: 'Parent label ID (for nested labels)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(LabelsCreate)
      const format = flags.format as OutputFormat
      const client = getClient()

      const payload = await client.createIssueLabel({
        name: flags.name,
        color: flags.color,
        description: flags.description,
        teamId: flags['team-id'],
        parentId: flags['parent-id'],
      })

      if (!payload.success || !payload.issueLabel) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create label')
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
            createdAt: data.createdAt,
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
