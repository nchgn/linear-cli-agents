import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import type {OutputFormat} from '../../lib/types.js'

export default class IssuesArchive extends Command {
  static override description = 'Archive an issue'

  static override examples = [
    '<%= config.bin %> issues archive ENG-123',
    '<%= config.bin %> issues archive ENG-123 --unarchive',
  ]

  static override args = {
    id: Args.string({
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
    unarchive: Flags.boolean({
      char: 'u',
      description: 'Unarchive instead of archive',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(IssuesArchive)
      const format = flags.format as OutputFormat
      const client = getClient()

      const issueId = await resolveIssueId(client, args.id)

      let payload
      if (flags.unarchive) {
        payload = await client.unarchiveIssue(issueId)
      } else {
        payload = await client.archiveIssue(issueId)
      }

      if (!payload.success) {
        const action = flags.unarchive ? 'unarchive' : 'archive'
        throw new CliError(ErrorCodes.API_ERROR, `Failed to ${action} issue`)
      }

      const issue = await (
        payload as {
          success: boolean
          issue?: Promise<{id: string; identifier: string; title: string; archivedAt: Date | null; url: string}>
        }
      ).issue
      if (!issue) {
        throw new CliError(ErrorCodes.API_ERROR, 'Issue not found in response')
      }

      const action = flags.unarchive ? 'unarchived' : 'archived'

      const data = {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        action,
        archivedAt: issue.archivedAt,
        url: issue.url,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            identifier: data.identifier,
            title: data.title,
            action: data.action,
            archivedAt: data.archivedAt ?? 'N/A',
            url: data.url,
          } as Record<string, unknown>,
          format,
        )
      } else {
        console.log(data.identifier)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
