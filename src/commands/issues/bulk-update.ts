import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import type {LinearDocument} from '@linear/sdk'

type IssueUpdateInput = LinearDocument.IssueUpdateInput

interface UpdateResult {
  identifier: string
  id: string
  success: boolean
  error?: string
}

export default class IssuesBulkUpdate extends Command {
  static override description = 'Update multiple issues at once'

  static override examples = [
    '<%= config.bin %> issues bulk-update --ids ENG-1,ENG-2,ENG-3 --state-id STATE_ID',
    '<%= config.bin %> issues bulk-update --ids ENG-1,ENG-2 --priority 2',
    '<%= config.bin %> issues bulk-update --ids ENG-1,ENG-2,ENG-3 --assignee-id USER_ID',
    '<%= config.bin %> issues bulk-update --ids ENG-1,ENG-2 --state-id STATE_ID --priority 1',
  ]

  static override flags = {
    ids: Flags.string({
      description: 'Comma-separated issue IDs or identifiers (e.g., ENG-1,ENG-2,ENG-3)',
      required: true,
    }),
    'state-id': Flags.string({
      description: 'New state ID for all issues',
    }),
    priority: Flags.integer({
      char: 'p',
      description: 'New priority (0=none, 1=urgent, 2=high, 3=medium, 4=low)',
    }),
    'assignee-id': Flags.string({
      description: 'New assignee user ID (use empty string to unassign)',
    }),
    'project-id': Flags.string({
      description: 'New project ID',
    }),
    estimate: Flags.integer({
      description: 'New estimate points',
    }),
    'label-ids': Flags.string({
      description: 'Comma-separated label IDs (replaces existing labels)',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(IssuesBulkUpdate)
      const client = getClient()

      // Build the update input from flags
      const input: IssueUpdateInput = {}

      if (flags['state-id']) input.stateId = flags['state-id']
      if (flags.priority !== undefined) input.priority = flags.priority
      if (flags['assignee-id'] !== undefined) {
        input.assigneeId = flags['assignee-id'] || null
      }
      if (flags['project-id']) input.projectId = flags['project-id']
      if (flags.estimate !== undefined) input.estimate = flags.estimate
      if (flags['label-ids']) input.labelIds = flags['label-ids'].split(',').map((id) => id.trim())

      if (Object.keys(input).length === 0) {
        throw new CliError(
          ErrorCodes.INVALID_INPUT,
          'No update fields provided. Use at least one of: --state-id, --priority, --assignee-id, --project-id, --estimate, --label-ids',
        )
      }

      // Parse issue identifiers
      const identifiers = flags.ids.split(',').map((id) => id.trim())

      if (identifiers.length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'No issue IDs provided')
      }

      // Process all updates
      const results: UpdateResult[] = []

      // Resolve all issue IDs first
      const resolvedIds = await Promise.all(
        identifiers.map(async (identifier) => {
          try {
            const id = await resolveIssueId(client, identifier)
            return {identifier, id, error: null}
          } catch (err) {
            return {identifier, id: null, error: err instanceof Error ? err.message : 'Unknown error'}
          }
        }),
      )

      // Update all resolved issues
      await Promise.all(
        resolvedIds.map(async ({identifier, id, error}) => {
          if (error || !id) {
            results.push({
              identifier,
              id: id ?? '',
              success: false,
              error: error ?? 'Failed to resolve issue ID',
            })
            return
          }

          try {
            const payload = await client.updateIssue(id, input)
            const issue = await payload.issue

            if (!issue) {
              results.push({
                identifier,
                id,
                success: false,
                error: 'Failed to update issue',
              })
              return
            }

            results.push({
              identifier: issue.identifier,
              id: issue.id,
              success: true,
            })
          } catch (err) {
            results.push({
              identifier,
              id,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error',
            })
          }
        }),
      )

      const successCount = results.filter((r) => r.success).length
      const failedCount = results.filter((r) => !r.success).length

      print(
        success({
          totalRequested: identifiers.length,
          successCount,
          failedCount,
          results,
          updatedFields: Object.keys(input),
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
