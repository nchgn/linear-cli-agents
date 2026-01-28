import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class ProjectsGet extends Command {
  static override description = 'Get a single project by ID'

  static override examples = [
    '<%= config.bin %> projects get PROJECT_ID',
    '<%= config.bin %> projects get PROJECT_ID --format table',
  ]

  static override args = {
    id: Args.string({
      description: 'Project ID',
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
      const {args, flags} = await this.parse(ProjectsGet)
      const format = flags.format as OutputFormat
      const client = getClient()

      const project = await client.project(args.id)

      if (!project) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Project ${args.id} not found`)
      }

      // Fetch related data
      const [lead, teams, issues, milestones] = await Promise.all([
        project.lead,
        project.teams(),
        project.issues({first: 1}),
        project.projectMilestones(),
      ])

      const data = {
        id: project.id,
        name: project.name,
        description: project.description,
        state: project.state,
        progress: project.progress,
        targetDate: project.targetDate,
        startDate: project.startDate,
        url: project.url,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        lead: lead
          ? {
              id: lead.id,
              name: lead.name,
              email: lead.email,
            }
          : null,
        teams: teams.nodes.map((team) => ({
          id: team.id,
          key: team.key,
          name: team.name,
        })),
        issuesCount: issues.pageInfo.hasNextPage ? '50+' : issues.nodes.length,
        milestones: milestones.nodes.map((m) => ({
          id: m.id,
          name: m.name,
          targetDate: m.targetDate,
        })),
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            name: data.name,
            description: data.description ?? 'N/A',
            state: data.state,
            progress: `${Math.round(data.progress * 100)}%`,
            startDate: data.startDate ?? 'N/A',
            targetDate: data.targetDate ?? 'N/A',
            lead: data.lead?.name ?? 'None',
            teams: data.teams.map((t) => t.key).join(', ') || 'None',
            issues: data.issuesCount,
            milestones: data.milestones.length > 0 ? data.milestones.map((m) => m.name).join(', ') : 'None',
            url: data.url,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Record<string, unknown>,
          format,
        )
      } else {
        // plain: just the ID
        console.log(data.id)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
