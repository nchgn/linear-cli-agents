import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {getDefaultTeamId} from '../../lib/config.js'
import type {OutputFormat} from '../../lib/types.js'

export default class ProjectsCreate extends Command {
  static override description = 'Create a project'

  static override examples = [
    '<%= config.bin %> projects create --name "My Project" --team-ids TEAM_ID',
    '<%= config.bin %> projects create --name "Q1 Goals" --description "First quarter objectives" --target-date 2024-03-31',
    '<%= config.bin %> projects create --name "Feature X" --state started --lead-id USER_ID',
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
      description: 'Project name',
      required: true,
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
    'team-ids': Flags.string({
      description: 'Team IDs (comma-separated). Uses default team if not provided.',
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
      const {flags} = await this.parse(ProjectsCreate)
      const format = flags.format as OutputFormat
      const client = getClient()

      // Use provided team-ids or fall back to default
      let teamIds: string[]
      if (flags['team-ids']) {
        teamIds = flags['team-ids'].split(',').map((id) => id.trim())
      } else {
        const defaultTeamId = getDefaultTeamId()
        if (!defaultTeamId) {
          throw new CliError(
            ErrorCodes.MISSING_REQUIRED_FIELD,
            'Team IDs required. Use --team-ids or configure default with "linear config set default-team-id TEAM_ID"',
          )
        }
        teamIds = [defaultTeamId]
      }

      const payload = await client.createProject({
        name: flags.name,
        description: flags.description,
        state: flags.state,
        teamIds,
        leadId: flags['lead-id'],
        startDate: flags['start-date'],
        targetDate: flags['target-date'],
      })

      if (!payload.success || !payload.project) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create project')
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
            startDate: data.startDate ?? 'N/A',
            targetDate: data.targetDate ?? 'N/A',
            lead: data.lead?.name ?? 'None',
            teams: data.teams.map((t) => t.key).join(', '),
            url: data.url,
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
