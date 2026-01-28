import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, truncate, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface TeamData {
  id: string
  key: string
  name: string
  description: string | undefined
  private: boolean
  issueCount: number
  createdAt: Date
}

const COLUMNS: ColumnDef<TeamData>[] = [
  {
    key: 'key',
    header: 'KEY',
    format: (value) => colors.cyan(String(value)),
  },
  {
    key: 'name',
    header: 'NAME',
    format: (value) => colors.bold(String(value)),
  },
  {
    key: 'description',
    header: 'DESCRIPTION',
    format: (value) => truncate(String(value ?? ''), 40),
  },
  {
    key: 'private',
    header: 'PRIVATE',
    format: (value) => (value ? colors.yellow('Yes') : colors.gray('No')),
  },
  {
    key: 'issueCount',
    header: 'ISSUES',
    format: (value) => colors.dim(String(value)),
  },
]

export default class TeamsList extends Command {
  static override description = 'List teams in the workspace'

  static override examples = [
    '<%= config.bin %> teams list',
    '<%= config.bin %> teams list --format table',
    '<%= config.bin %> teams list --first 10',
  ]

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
    first: Flags.integer({
      description: 'Number of teams to fetch (default: 50)',
      default: 50,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(TeamsList)
      const format = flags.format as OutputFormat
      const client = getClient()

      const teams = await client.teams({
        first: flags.first,
        after: flags.after,
      })

      const data: TeamData[] = await Promise.all(
        teams.nodes.map(async (team) => {
          const issues = await team.issues({first: 1})
          return {
            id: team.id,
            key: team.key,
            name: team.name,
            description: team.description ?? undefined,
            private: team.private,
            issueCount: issues.pageInfo.hasNextPage ? 50 : issues.nodes.length,
            createdAt: team.createdAt,
          }
        }),
      )

      const pageInfo = {
        hasNextPage: teams.pageInfo.hasNextPage,
        hasPreviousPage: teams.pageInfo.hasPreviousPage,
        startCursor: teams.pageInfo.startCursor,
        endCursor: teams.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'key',
          secondaryKey: 'name',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
