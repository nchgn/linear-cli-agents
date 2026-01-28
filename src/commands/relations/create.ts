import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import type {OutputFormat} from '../../lib/types.js'
import type {LinearDocument} from '@linear/sdk'

const RELATION_TYPES = ['blocks', 'duplicate', 'related'] as const

export default class RelationsCreate extends Command {
  static override description = 'Create a relation between two issues'

  static override examples = [
    '<%= config.bin %> relations create ENG-123 ENG-456 --type blocks',
    '<%= config.bin %> relations create ENG-123 ENG-456 --type duplicate',
    '<%= config.bin %> relations create ENG-123 ENG-456 --type related',
  ]

  static override args = {
    issue: Args.string({
      description: 'Source issue ID or identifier (e.g., ENG-123)',
      required: true,
    }),
    relatedIssue: Args.string({
      description: 'Related issue ID or identifier (e.g., ENG-456)',
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
    type: Flags.string({
      char: 't',
      description: 'Relation type (blocks, duplicate, related)',
      required: true,
      options: [...RELATION_TYPES],
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(RelationsCreate)
      const format = flags.format as OutputFormat
      const relationType = flags.type as LinearDocument.IssueRelationType
      const client = getClient()

      const [issueId, relatedIssueId] = await Promise.all([
        resolveIssueId(client, args.issue),
        resolveIssueId(client, args.relatedIssue),
      ])

      const payload = await client.createIssueRelation({
        issueId,
        relatedIssueId,
        type: relationType,
      })

      if (!payload.success || !payload.issueRelation) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create relation')
      }

      const relation = await payload.issueRelation
      const [issue, relatedIssue] = await Promise.all([relation.issue, relation.relatedIssue])

      const data = {
        id: relation.id,
        type: relation.type,
        issue: issue
          ? {
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
            }
          : null,
        relatedIssue: relatedIssue
          ? {
              id: relatedIssue.id,
              identifier: relatedIssue.identifier,
              title: relatedIssue.title,
            }
          : null,
        createdAt: relation.createdAt,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            type: data.type,
            issue: data.issue?.identifier ?? 'N/A',
            relatedIssue: data.relatedIssue?.identifier ?? 'N/A',
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
