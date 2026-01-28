import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class TemplatesUpdate extends Command {
  static override description = 'Update a template'

  static override examples = [
    '<%= config.bin %> templates update TEMPLATE_ID --name "Updated Name"',
    '<%= config.bin %> templates update TEMPLATE_ID --template-data \'{"title":"New Bug: ","priority":1}\'',
  ]

  static override args = {
    id: Args.string({
      description: 'Template ID',
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
      description: 'Template name',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Template description',
    }),
    'template-data': Flags.string({
      description: 'Template data as JSON',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(TemplatesUpdate)
      const format = flags.format as OutputFormat
      const client = getClient()

      const input: Record<string, unknown> = {}
      if (flags.name) input.name = flags.name
      if (flags.description) input.description = flags.description
      if (flags['template-data']) {
        try {
          input.templateData = JSON.parse(flags['template-data']) as Record<string, unknown>
        } catch {
          throw new CliError(ErrorCodes.INVALID_INPUT, 'Invalid JSON in --template-data')
        }
      }

      if (Object.keys(input).length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'At least one field to update is required')
      }

      const payload = await client.updateTemplate(args.id, input)

      if (!payload.success || !payload.template) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update template')
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
        updatedAt: template.updatedAt,
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
