import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class MilestonesGet extends Command {
  static override description = 'Get a project milestone by ID'

  static override examples = [
    '<%= config.bin %> milestones get MILESTONE_ID',
    '<%= config.bin %> milestones get MILESTONE_ID --format table',
  ]

  static override args = {
    id: Args.string({
      description: 'Milestone ID',
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
      const {args, flags} = await this.parse(MilestonesGet)
      const format = flags.format as OutputFormat
      const client = getClient()

      const milestone = await client.projectMilestone(args.id)
      if (!milestone) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Milestone ${args.id} not found`)
      }

      const project = await milestone.project

      const data = {
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        targetDate: milestone.targetDate,
        sortOrder: milestone.sortOrder,
        project: project
          ? {
              id: project.id,
              name: project.name,
            }
          : null,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            name: data.name,
            description: data.description ?? 'N/A',
            targetDate: data.targetDate ?? 'N/A',
            project: data.project?.name ?? 'N/A',
            sortOrder: data.sortOrder,
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
