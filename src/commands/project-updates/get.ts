import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class ProjectUpdatesGet extends Command {
  static override description = 'Get a project update by ID'

  static override examples = [
    '<%= config.bin %> project-updates get UPDATE_ID',
    '<%= config.bin %> project-updates get UPDATE_ID --format table',
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
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(ProjectUpdatesGet)
      const format = flags.format as OutputFormat
      const client = getClient()

      const update = await client.projectUpdate(args.id)
      if (!update) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Project update ${args.id} not found`)
      }

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
              email: user.email,
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
            url: data.url,
            createdAt: data.createdAt,
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
