import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'
import type {LinearDocument} from '@linear/sdk'

const HEALTH_OPTIONS = ['onTrack', 'atRisk', 'offTrack'] as const

export default class ProjectUpdatesCreate extends Command {
  static override description = 'Create a project update'

  static override examples = [
    '<%= config.bin %> project-updates create PROJECT_ID --body "Sprint completed successfully"',
    '<%= config.bin %> project-updates create PROJECT_ID --body "Delayed due to dependencies" --health atRisk',
  ]

  static override args = {
    projectId: Args.string({
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
    body: Flags.string({
      char: 'b',
      description: 'Update body (supports markdown)',
      required: true,
    }),
    health: Flags.string({
      char: 'h',
      description: 'Project health status',
      options: [...HEALTH_OPTIONS],
      default: 'onTrack',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(ProjectUpdatesCreate)
      const format = flags.format as OutputFormat
      const health = flags.health as LinearDocument.ProjectUpdateHealthType
      const client = getClient()

      const project = await client.project(args.projectId)
      if (!project) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Project ${args.projectId} not found`)
      }

      const payload = await client.createProjectUpdate({
        projectId: args.projectId,
        body: flags.body,
        health,
      })

      if (!payload.success || !payload.projectUpdate) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create project update')
      }

      const update = await payload.projectUpdate
      const user = await update.user

      const data = {
        id: update.id,
        body: update.body,
        health: update.health,
        url: update.url,
        project: {
          id: project.id,
          name: project.name,
        },
        user: user
          ? {
              id: user.id,
              name: user.name,
            }
          : null,
        createdAt: update.createdAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            project: data.project.name,
            health: data.health,
            body: data.body,
            user: data.user?.name ?? 'Unknown',
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
