import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class TemplatesGet extends Command {
  static override description = 'Get a template by ID'

  static override examples = [
    '<%= config.bin %> templates get TEMPLATE_ID',
    '<%= config.bin %> templates get TEMPLATE_ID --format table',
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
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(TemplatesGet)
      const format = flags.format as OutputFormat
      const client = getClient()

      // Templates need to be fetched via organization
      const org = await client.organization
      const templates = await org.templates()
      const template = templates.nodes.find((t) => t.id === args.id)

      if (!template) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Template ${args.id} not found`)
      }

      const [team, creator] = await Promise.all([template.team, template.creator])

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
        creator: creator
          ? {
              id: creator.id,
              name: creator.name,
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
            creator: data.creator?.name ?? 'Unknown',
            createdAt: data.createdAt,
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
