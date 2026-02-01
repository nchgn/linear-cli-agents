import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError} from '../../lib/errors.js'
import {colors, truncate, formatProgress, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface CycleData {
  id: string
  number: number
  name: string | null
  startsAt: Date
  endsAt: Date
  completedAt: Date | null
  progress: number
  teamId: string
  teamKey: string
  teamName: string
}

const COLUMNS: ColumnDef<CycleData>[] = [
  {
    key: 'number',
    header: '#',
    format: (value) => colors.dim(String(value)),
  },
  {
    key: 'name',
    header: 'NAME',
    format: (value) => (value ? colors.bold(truncate(String(value), 25)) : colors.gray('Unnamed')),
  },
  {
    key: 'teamKey',
    header: 'TEAM',
    format: (value) => colors.cyan(String(value)),
  },
  {
    key: 'startsAt',
    header: 'START',
    format: (value) => colors.dim(new Date(value as Date).toISOString().split('T')[0]),
  },
  {
    key: 'endsAt',
    header: 'END',
    format: (value) => colors.dim(new Date(value as Date).toISOString().split('T')[0]),
  },
  {
    key: 'progress',
    header: 'PROGRESS',
    format: (value) => formatProgress(Number(value)),
  },
]

export default class CyclesList extends Command {
  static override description = 'List cycles (sprints)'

  static override examples = [
    '<%= config.bin %> cycles list',
    '<%= config.bin %> cycles list --team-id TEAM_ID',
    '<%= config.bin %> cycles list --team ENG',
    '<%= config.bin %> cycles list --format table',
    '<%= config.bin %> cycles list --active',
  ]

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
    'team-id': Flags.string({
      description: 'Filter by team ID',
    }),
    team: Flags.string({
      description: 'Filter by team key (e.g., ENG)',
    }),
    active: Flags.boolean({
      description: 'Show only active cycles',
      default: false,
    }),
    upcoming: Flags.boolean({
      description: 'Show only upcoming cycles',
      default: false,
    }),
    completed: Flags.boolean({
      description: 'Show only completed cycles',
      default: false,
    }),
    first: Flags.integer({
      description: 'Number of cycles to fetch (default: 50)',
      default: 50,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(CyclesList)
      const format = flags.format as OutputFormat
      const client = getClient()

      // Build filter
      const filter: Record<string, unknown> = {}

      if (flags['team-id']) {
        filter.team = {id: {eq: flags['team-id']}}
      } else if (flags.team) {
        filter.team = {key: {eq: flags.team}}
      }

      const now = new Date()
      if (flags.active) {
        filter.startsAt = {lte: now}
        filter.endsAt = {gte: now}
      } else if (flags.upcoming) {
        filter.startsAt = {gt: now}
      } else if (flags.completed) {
        filter.completedAt = {neq: null}
      }

      const cycles = await client.cycles({
        first: flags.first,
        after: flags.after,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      })

      const data: CycleData[] = await Promise.all(
        cycles.nodes.map(async (cycle) => {
          const team = await cycle.team
          return {
            id: cycle.id,
            number: cycle.number,
            name: cycle.name ?? null,
            startsAt: cycle.startsAt,
            endsAt: cycle.endsAt,
            completedAt: cycle.completedAt ?? null,
            progress: cycle.progress,
            teamId: team?.id ?? '',
            teamKey: team?.key ?? '',
            teamName: team?.name ?? '',
          }
        }),
      )

      const pageInfo = {
        hasNextPage: cycles.pageInfo.hasNextPage,
        hasPreviousPage: cycles.pageInfo.hasPreviousPage,
        startCursor: cycles.pageInfo.startCursor,
        endCursor: cycles.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'name',
          secondaryKey: 'number',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
