import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {successList, print, printList} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import {colors, type ColumnDef} from '../../lib/formatter.js'
import type {OutputFormat} from '../../lib/types.js'

interface RelationData {
  id: string
  type: string
  issueId: string
  issueIdentifier: string
  issueTitle: string
  relatedIssueId: string
  relatedIssueIdentifier: string
  relatedIssueTitle: string
  createdAt: Date
}

const formatRelationType = (type: string): string => {
  switch (type) {
    case 'blocks':
      return colors.red('blocks')
    case 'blocked':
      return colors.yellow('blocked by')
    case 'duplicate':
      return colors.magenta('duplicate of')
    case 'related':
      return colors.blue('related to')
    default:
      return type
  }
}

const COLUMNS: ColumnDef<RelationData>[] = [
  {
    key: 'issueIdentifier',
    header: 'ISSUE',
    format: (value) => colors.cyan(String(value)),
  },
  {
    key: 'type',
    header: 'RELATION',
    format: (value) => formatRelationType(String(value)),
  },
  {
    key: 'relatedIssueIdentifier',
    header: 'RELATED ISSUE',
    format: (value) => colors.cyan(String(value)),
  },
  {
    key: 'relatedIssueTitle',
    header: 'TITLE',
    format: (value) => colors.dim(String(value).slice(0, 30)),
  },
]

export default class RelationsList extends Command {
  static override description = 'List relations for an issue'

  static override examples = [
    '<%= config.bin %> relations list ENG-123',
    '<%= config.bin %> relations list ENG-123 --format table',
  ]

  static override args = {
    issue: Args.string({
      description: 'Issue ID or identifier (e.g., ENG-123)',
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
      const {args, flags} = await this.parse(RelationsList)
      const format = flags.format as OutputFormat
      const client = getClient()

      const issueId = await resolveIssueId(client, args.issue)
      const issue = await client.issue(issueId)

      if (!issue) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Issue ${args.issue} not found`)
      }

      // Get both relations and inverse relations
      const [relations, inverseRelations] = await Promise.all([issue.relations(), issue.inverseRelations()])

      const data: RelationData[] = []

      // Process outgoing relations
      for (const relation of relations.nodes) {
        const relatedIssue = await relation.relatedIssue
        if (relatedIssue) {
          data.push({
            id: relation.id,
            type: relation.type,
            issueId: issue.id,
            issueIdentifier: issue.identifier,
            issueTitle: issue.title,
            relatedIssueId: relatedIssue.id,
            relatedIssueIdentifier: relatedIssue.identifier,
            relatedIssueTitle: relatedIssue.title,
            createdAt: relation.createdAt,
          })
        }
      }

      // Process incoming relations (inverse)
      for (const relation of inverseRelations.nodes) {
        const sourceIssue = await relation.issue
        if (sourceIssue) {
          // Flip the type for inverse relations
          const inverseType =
            relation.type === 'blocks' ? 'blocked' : relation.type === 'blocked' ? 'blocks' : relation.type
          data.push({
            id: relation.id,
            type: inverseType,
            issueId: issue.id,
            issueIdentifier: issue.identifier,
            issueTitle: issue.title,
            relatedIssueId: sourceIssue.id,
            relatedIssueIdentifier: sourceIssue.identifier,
            relatedIssueTitle: sourceIssue.title,
            createdAt: relation.createdAt,
          })
        }
      }

      if (format === 'json') {
        print(successList(data))
      } else {
        printList(data, format, {
          columns: COLUMNS,
          primaryKey: 'issueIdentifier',
          secondaryKey: 'relatedIssueIdentifier',
        })
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
