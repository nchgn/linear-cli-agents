import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class CyclesCurrent extends Command {
  static override description = 'Get the current active cycle for a team'

  static override examples = [
    '<%= config.bin %> cycles current --team ENG',
    '<%= config.bin %> cycles current --team-id TEAM_ID',
    '<%= config.bin %> cycles current --team ENG --format table',
  ]

  static override flags = {
    format: Flags.string({
      char: 'F',
      description: 'Output format',
      options: ['json', 'table', 'plain'],
      default: 'json',
    }),
    'team-id': Flags.string({
      description: 'Team ID',
      exclusive: ['team'],
    }),
    team: Flags.string({
      description: 'Team key (e.g., ENG)',
      exclusive: ['team-id'],
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(CyclesCurrent)
      const format = flags.format as OutputFormat
      const client = getClient()

      if (!flags['team-id'] && !flags.team) {
        throw new CliError(ErrorCodes.MISSING_REQUIRED_FIELD, 'Team is required. Use --team or --team-id')
      }

      // Build filter for active cycle
      const now = new Date()
      const filter: Record<string, unknown> = {
        startsAt: {lte: now},
        endsAt: {gte: now},
      }

      if (flags['team-id']) {
        filter.team = {id: {eq: flags['team-id']}}
      } else if (flags.team) {
        filter.team = {key: {eq: flags.team}}
      }

      const cycles = await client.cycles({
        first: 1,
        filter,
      })

      if (cycles.nodes.length === 0) {
        throw new CliError(ErrorCodes.NOT_FOUND, 'No active cycle found for this team')
      }

      const cycle = cycles.nodes[0]
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
        progress: cycle.progress,
        team: team
          ? {
              id: team.id,
              key: team.key,
              name: team.name,
            }
          : null,
        issues: issuesSummary,
        daysRemaining: Math.ceil((new Date(cycle.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
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
            progress: `${Math.round(data.progress * 100)}%`,
            issues: `${issuesSummary.completed}/${issuesSummary.total} completed`,
            daysRemaining: `${data.daysRemaining} days`,
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
