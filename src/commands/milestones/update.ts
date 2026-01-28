import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class MilestonesUpdate extends Command {
  static override description = 'Update a project milestone'

  static override examples = [
    '<%= config.bin %> milestones update MILESTONE_ID --name "Updated Name"',
    '<%= config.bin %> milestones update MILESTONE_ID --target-date 2024-06-01',
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
    name: Flags.string({
      char: 'n',
      description: 'Milestone name',
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
      const {args, flags} = await this.parse(MilestonesUpdate)
      const format = flags.format as OutputFormat
      const client = getClient()

      const input: Record<string, unknown> = {}
      if (flags.name) input.name = flags.name
      if (flags.description) input.description = flags.description
      if (flags['target-date']) input.targetDate = flags['target-date']

      if (Object.keys(input).length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'At least one field to update is required')
      }

      const payload = await client.updateProjectMilestone(args.id, input)

      if (!payload.success || !payload.projectMilestone) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update milestone')
      }

      const milestone = await payload.projectMilestone
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
