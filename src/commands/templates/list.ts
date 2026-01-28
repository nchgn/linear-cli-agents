import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, truncate, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface TemplateData {
  id: string
  name: string
  type: string
  description: string | undefined
  teamId: string | undefined
  teamKey: string | undefined
  createdAt: Date
  updatedAt: Date
}

const COLUMNS: ColumnDef<TemplateData>[] = [
  {
    key: 'name',
    header: 'NAME',
    format: (value) => colors.bold(truncate(String(value), 30)),
  },
  {
    key: 'type',
    header: 'TYPE',
    format: (value) => colors.cyan(String(value)),
  },
  {
    key: 'teamKey',
    header: 'TEAM',
    format: (value) => (value ? colors.dim(String(value)) : colors.gray('Org')),
  },
]

export default class TemplatesList extends Command {
  static override description = 'List templates in the workspace'

  static override examples = [
    '<%= config.bin %> templates list',
    '<%= config.bin %> templates list --format table',
    '<%= config.bin %> templates list --team ENG',
  ]

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
    team: Flags.string({
      char: 't',
      description: 'Filter by team key (e.g., ENG)',
    }),
    first: Flags.integer({
      description: 'Number of templates to fetch (default: 50)',
      default: 50,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(TemplatesList)
      const format = flags.format as OutputFormat
      const client = getClient()

      // Get organization to fetch templates
      const org = await client.organization

      let templates
      if (flags.team) {
        const teams = await client.teams({filter: {key: {eq: flags.team}}})
        const team = teams.nodes[0]
        if (!team) {
          throw new Error(`Team ${flags.team} not found`)
        }
        templates = await team.templates({
          first: flags.first,
          after: flags.after,
        })
      } else {
        templates = await org.templates({
          first: flags.first,
          after: flags.after,
        })
      }

      const data: TemplateData[] = await Promise.all(
        templates.nodes.map(async (template) => {
          const team = await template.team
          return {
            id: template.id,
            name: template.name,
            type: template.type,
            description: template.description ?? undefined,
            teamId: team?.id,
            teamKey: team?.key,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
          }
        }),
      )

      const pageInfo = {
        hasNextPage: templates.pageInfo.hasNextPage,
        hasPreviousPage: templates.pageInfo.hasPreviousPage,
        startCursor: templates.pageInfo.startCursor,
        endCursor: templates.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'name',
          secondaryKey: 'type',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
