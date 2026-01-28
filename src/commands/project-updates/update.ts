import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

const HEALTH_OPTIONS = ['onTrack', 'atRisk', 'offTrack'] as const
type HealthOption = (typeof HEALTH_OPTIONS)[number]

export default class ProjectUpdatesUpdate extends Command {
  static override description = 'Update a project update'

  static override examples = [
    '<%= config.bin %> project-updates update UPDATE_ID --body "Updated status"',
    '<%= config.bin %> project-updates update UPDATE_ID --health offTrack',
  ]

  static override args = {
    id: Args.string({
      description: 'Project update ID',
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
    body: Flags.string({
      char: 'b',
      description: 'Update body (supports markdown)',
    }),
    health: Flags.string({
      char: 'h',
      description: 'Project health status',
      options: [...HEALTH_OPTIONS],
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(ProjectUpdatesUpdate)
      const format = flags.format as OutputFormat
      const client = getClient()

      const input: Record<string, unknown> = {}
      if (flags.body) input.body = flags.body
      if (flags.health) input.health = flags.health as HealthOption

      if (Object.keys(input).length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'At least one field to update is required')
      }

      const payload = await client.updateProjectUpdate(args.id, input)

      if (!payload.success || !payload.projectUpdate) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update project update')
      }

      const update = await payload.projectUpdate
      const [project, user] = await Promise.all([update.project, update.user])

      const data = {
        id: update.id,
        body: update.body,
        health: update.health,
        url: update.url,
        project: project
          ? {
              id: project.id,
              name: project.name,
            }
          : null,
        user: user
          ? {
              id: user.id,
              name: user.name,
            }
          : null,
        createdAt: update.createdAt,
        updatedAt: update.updatedAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            project: data.project?.name ?? 'N/A',
            health: data.health,
            body: data.body,
            user: data.user?.name ?? 'Unknown',
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
