import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class TemplatesCreate extends Command {
  static override description = 'Create a template'

  static override examples = [
    '<%= config.bin %> templates create --name "Bug Report" --type issue --team-id TEAM_ID --template-data \'{"title":"Bug: ","priority":2}\'',
    '<%= config.bin %> templates create --name "Feature Request" --type issue --template-data \'{"title":"Feature: "}\'',
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
      description: 'Template name',
      required: true,
    }),
    type: Flags.string({
      char: 't',
      description: 'Template type',
      required: true,
      options: ['issue', 'project'],
    }),
    description: Flags.string({
      char: 'd',
      description: 'Template description',
    }),
    'team-id': Flags.string({
      description: 'Team ID (optional, for team-specific templates)',
    }),
    'template-data': Flags.string({
      description: 'Template data as JSON (e.g., {"title":"Bug: ","priority":2})',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(TemplatesCreate)
      const format = flags.format as OutputFormat
      const client = getClient()

      let templateData: Record<string, unknown>
      try {
        templateData = JSON.parse(flags['template-data']) as Record<string, unknown>
      } catch {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'Invalid JSON in --template-data')
      }

      const payload = await client.createTemplate({
        name: flags.name,
        type: flags.type,
        description: flags.description,
        teamId: flags['team-id'],
        templateData,
      })

      if (!payload.success || !payload.template) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create template')
      }

      const template = await payload.template
      const team = await template.team

      const data = {
        id: template.id,
        name: template.name,
        type: template.type,
        description: template.description,
        templateData: template.templateData,
        team: team
          ? {
              id: team.id,
              key: team.key,
              name: team.name,
            }
          : null,
        createdAt: template.createdAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            name: data.name,
            type: data.type,
            description: data.description ?? 'N/A',
            team: data.team?.key ?? 'Organization',
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
