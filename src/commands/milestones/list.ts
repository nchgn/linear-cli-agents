import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {colors, truncate, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface MilestoneData {
  id: string
  name: string
  description: string | undefined
  targetDate: string | undefined
  sortOrder: number
  projectId: string
  projectName: string
  createdAt: Date
  updatedAt: Date
}

const COLUMNS: ColumnDef<MilestoneData>[] = [
  {
    key: 'name',
    header: 'NAME',
    format: (value) => colors.bold(truncate(String(value), 30)),
  },
  {
    key: 'projectName',
    header: 'PROJECT',
    format: (value) => colors.cyan(truncate(String(value), 20)),
  },
  {
    key: 'targetDate',
    header: 'TARGET',
    format: (value) => (value ? colors.dim(String(value)) : colors.gray('No date')),
  },
]

export default class MilestonesList extends Command {
  static override description = 'List project milestones'

  static override examples = [
    '<%= config.bin %> milestones list PROJECT_ID',
    '<%= config.bin %> milestones list PROJECT_ID --format table',
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
    first: Flags.integer({
      description: 'Number of milestones to fetch (default: 50)',
      default: 50,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(MilestonesList)
      const format = flags.format as OutputFormat
      const client = getClient()

      const project = await client.project(args.projectId)
      if (!project) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Project ${args.projectId} not found`)
      }

      const milestones = await project.projectMilestones({
        first: flags.first,
        after: flags.after,
      })

      const data: MilestoneData[] = milestones.nodes.map((milestone) => ({
        id: milestone.id,
        name: milestone.name,
        description: milestone.description ?? undefined,
        targetDate: milestone.targetDate ?? undefined,
        sortOrder: milestone.sortOrder,
        projectId: project.id,
        projectName: project.name,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
      }))

      const pageInfo = {
        hasNextPage: milestones.pageInfo.hasNextPage,
        hasPreviousPage: milestones.pageInfo.hasPreviousPage,
        startCursor: milestones.pageInfo.startCursor,
        endCursor: milestones.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'name',
          secondaryKey: 'targetDate',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
