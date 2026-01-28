import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class MilestonesCreate extends Command {
  static override description = 'Create a project milestone'

  static override examples = [
    '<%= config.bin %> milestones create PROJECT_ID --name "Beta Release"',
    '<%= config.bin %> milestones create PROJECT_ID --name "Launch" --target-date 2024-03-01',
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
    name: Flags.string({
      char: 'n',
      description: 'Milestone name',
      required: true,
    }),
    description: Flags.string({
      char: 'd',
      description: 'Milestone description',
    }),
    'target-date': Flags.string({
      description: 'Target date (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(MilestonesCreate)
      const format = flags.format as OutputFormat
      const client = getClient()

      const project = await client.project(args.projectId)
      if (!project) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Project ${args.projectId} not found`)
      }

      const payload = await client.createProjectMilestone({
        projectId: args.projectId,
        name: flags.name,
        description: flags.description,
        targetDate: flags['target-date'],
      })

      if (!payload.success || !payload.projectMilestone) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create milestone')
      }

      const milestone = await payload.projectMilestone

      const data = {
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        targetDate: milestone.targetDate,
        sortOrder: milestone.sortOrder,
        project: {
          id: project.id,
          name: project.name,
        },
        createdAt: milestone.createdAt,
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
            project: data.project.name,
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
