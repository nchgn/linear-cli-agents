import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class CyclesGet extends Command {
  static override description = 'Get cycle (sprint) details'

  static override examples = [
    '<%= config.bin %> cycles get CYCLE_ID',
    '<%= config.bin %> cycles get CYCLE_ID --format table',
  ]

  static override args = {
    id: Args.string({
      description: 'Cycle ID',
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
      const {args, flags} = await this.parse(CyclesGet)
      const format = flags.format as OutputFormat
      const client = getClient()

      const cycle = await client.cycle(args.id)

      if (!cycle) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Cycle ${args.id} not found`)
      }

      const [team, issues] = await Promise.all([cycle.team, cycle.issues()])

      const issuesSummary = {
        total: issues.nodes.length,
        completed: issues.nodes.filter((i) => i.completedAt).length,
      }

      const data = {
        id: cycle.id,
        number: cycle.number,
        name: cycle.name ?? null,
        description: cycle.description ?? null,
        startsAt: cycle.startsAt,
        endsAt: cycle.endsAt,
        completedAt: cycle.completedAt ?? null,
        progress: cycle.progress,
        scopeHistory: cycle.scopeHistory,
        completedScopeHistory: cycle.completedScopeHistory,
        team: team
          ? {
              id: team.id,
              key: team.key,
              name: team.name,
            }
          : null,
        issues: issuesSummary,
        createdAt: cycle.createdAt,
        updatedAt: cycle.updatedAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            number: data.number,
            name: data.name ?? 'Unnamed',
            team: data.team?.key ?? 'N/A',
            startsAt: data.startsAt,
            endsAt: data.endsAt,
            completedAt: data.completedAt ?? 'In progress',
            progress: `${Math.round(data.progress * 100)}%`,
            issues: `${issuesSummary.completed}/${issuesSummary.total} completed`,
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
