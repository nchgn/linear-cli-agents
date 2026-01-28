import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {colors, truncate, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface ProjectUpdateData {
  id: string
  body: string
  health: string
  projectId: string
  projectName: string
  userId: string
  userName: string
  createdAt: Date
  updatedAt: Date
}

const formatHealth = (health: string): string => {
  switch (health) {
    case 'onTrack':
      return colors.green('On Track')
    case 'atRisk':
      return colors.yellow('At Risk')
    case 'offTrack':
      return colors.red('Off Track')
    default:
      return health
  }
}

const COLUMNS: ColumnDef<ProjectUpdateData>[] = [
  {
    key: 'projectName',
    header: 'PROJECT',
    format: (value) => colors.cyan(truncate(String(value), 20)),
  },
  {
    key: 'health',
    header: 'HEALTH',
    format: (value) => formatHealth(String(value)),
  },
  {
    key: 'userName',
    header: 'BY',
    format: (value) => colors.dim(String(value)),
  },
  {
    key: 'createdAt',
    header: 'DATE',
    format: (value) => {
      const date = new Date(value as string)
      return colors.dim(date.toLocaleDateString())
    },
  },
]

export default class ProjectUpdatesList extends Command {
  static override description = 'List project updates'

  static override examples = [
    '<%= config.bin %> project-updates list PROJECT_ID',
    '<%= config.bin %> project-updates list PROJECT_ID --format table',
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
      description: 'Number of updates to fetch (default: 20)',
      default: 20,
    }),
    after: Flags.string({
      description: 'Cursor for pagination',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(ProjectUpdatesList)
      const format = flags.format as OutputFormat
      const client = getClient()

      const project = await client.project(args.projectId)
      if (!project) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Project ${args.projectId} not found`)
      }

      const updates = await project.projectUpdates({
        first: flags.first,
        after: flags.after,
      })

      const data: ProjectUpdateData[] = await Promise.all(
        updates.nodes.map(async (update) => {
          const user = await update.user
          return {
            id: update.id,
            body: update.body,
            health: update.health,
            projectId: project.id,
            projectName: project.name,
            userId: user?.id ?? '',
            userName: user?.name ?? 'Unknown',
            createdAt: update.createdAt,
            updatedAt: update.updatedAt,
          }
        }),
      )

      const pageInfo = {
        hasNextPage: updates.pageInfo.hasNextPage,
        hasPreviousPage: updates.pageInfo.hasPreviousPage,
        startCursor: updates.pageInfo.startCursor,
        endCursor: updates.pageInfo.endCursor,
      }

      if (format === 'json') {
        print(successList(data, pageInfo))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'id',
          secondaryKey: 'body',
          pageInfo,
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
