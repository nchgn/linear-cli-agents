import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class ProjectsUpdate extends Command {
  static override description = 'Update a project'

  static override examples = [
    '<%= config.bin %> projects update PROJECT_ID --name "Updated Name"',
    '<%= config.bin %> projects update PROJECT_ID --state completed',
    '<%= config.bin %> projects update PROJECT_ID --target-date 2024-06-30',
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
    name: Flags.string({
      char: 'n',
      description: 'Project name',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Project description',
    }),
    state: Flags.string({
      char: 's',
      description: 'Project state',
      options: ['planned', 'started', 'paused', 'completed', 'canceled'],
    }),
    'lead-id': Flags.string({
      description: 'Lead user ID',
    }),
    'start-date': Flags.string({
      description: 'Start date (YYYY-MM-DD)',
    }),
    'target-date': Flags.string({
      description: 'Target date (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(ProjectsUpdate)
      const format = flags.format as OutputFormat
      const client = getClient()

      const input: Record<string, unknown> = {}
      if (flags.name) input.name = flags.name
      if (flags.description) input.description = flags.description
      if (flags.state) input.state = flags.state
      if (flags['lead-id']) input.leadId = flags['lead-id']
      if (flags['start-date']) input.startDate = flags['start-date']
      if (flags['target-date']) input.targetDate = flags['target-date']

      if (Object.keys(input).length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'At least one field to update is required')
      }

      const payload = await client.updateProject(args.id, input)

      if (!payload.success || !payload.project) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update project')
      }

      const project = await payload.project
      const [lead, teams] = await Promise.all([project.lead, project.teams()])

      const data = {
        id: project.id,
        name: project.name,
        description: project.description,
        state: project.state,
        progress: project.progress,
        startDate: project.startDate,
        targetDate: project.targetDate,
        url: project.url,
        lead: lead
          ? {
              id: lead.id,
              name: lead.name,
            }
          : null,
        teams: teams.nodes.map((team) => ({
          id: team.id,
          key: team.key,
          name: team.name,
        })),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
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
            teams: data.teams.map((t) => t.key).join(', '),
            url: data.url,
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
