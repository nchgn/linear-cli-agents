import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'

interface LabelResult {
  identifier: string
  id: string
  success: boolean
  labelsAdded?: string[]
  labelsRemoved?: string[]
  error?: string
}

export default class IssuesBulkLabel extends Command {
  static override description = 'Add or remove labels from multiple issues'

  static override examples = [
    '<%= config.bin %> issues bulk-label --ids ENG-1,ENG-2,ENG-3 --add-labels LABEL_ID1,LABEL_ID2',
    '<%= config.bin %> issues bulk-label --ids ENG-1,ENG-2 --remove-labels LABEL_ID1',
    '<%= config.bin %> issues bulk-label --ids ENG-1,ENG-2,ENG-3 --add-labels LABEL_ID1 --remove-labels LABEL_ID2',
  ]

  static override flags = {
    ids: Flags.string({
      description: 'Comma-separated issue IDs or identifiers (e.g., ENG-1,ENG-2,ENG-3)',
      required: true,
    }),
    'add-labels': Flags.string({
      description: 'Comma-separated label IDs to add',
    }),
    'remove-labels': Flags.string({
      description: 'Comma-separated label IDs to remove',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(IssuesBulkLabel)
      const client = getClient()

      const addLabelIds = flags['add-labels']?.split(',').map((id) => id.trim()) ?? []
      const removeLabelIds = flags['remove-labels']?.split(',').map((id) => id.trim()) ?? []

      if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
        throw new CliError(
          ErrorCodes.INVALID_INPUT,
          'No label operations specified. Use --add-labels and/or --remove-labels',
        )
      }

      // Parse issue identifiers
      const identifiers = flags.ids.split(',').map((id) => id.trim())

      if (identifiers.length === 0) {
        throw new CliError(ErrorCodes.INVALID_INPUT, 'No issue IDs provided')
      }

      // Process all label operations
      const results: LabelResult[] = []

      // Process each issue
      await Promise.all(
        identifiers.map(async (identifier) => {
          try {
            const issueId = await resolveIssueId(client, identifier)
            const issue = await client.issue(issueId)

            if (!issue) {
              results.push({
                identifier,
                id: issueId,
                success: false,
                error: 'Issue not found',
              })
              return
            }

            // Get existing labels
            const existingLabels = await issue.labels()
            const existingLabelIds = existingLabels.nodes.map((l) => l.id)

            // Calculate new label set
            const labelsToAdd = addLabelIds.filter((id) => !existingLabelIds.includes(id))
            const labelsToRemove = removeLabelIds.filter((id) => existingLabelIds.includes(id))

            // Build new label array
            const newLabelIds = [...existingLabelIds.filter((id) => !removeLabelIds.includes(id)), ...labelsToAdd]

            // Update the issue
            const payload = await client.updateIssue(issueId, {
              labelIds: newLabelIds,
            })

            if (!payload.success) {
              results.push({
                identifier,
                id: issueId,
                success: false,
                error: 'Failed to update labels',
              })
              return
            }

            const updatedIssue = await payload.issue
            results.push({
              identifier: updatedIssue?.identifier ?? identifier,
              id: issueId,
              success: true,
              labelsAdded: labelsToAdd.length > 0 ? labelsToAdd : undefined,
              labelsRemoved: labelsToRemove.length > 0 ? labelsToRemove : undefined,
            })
          } catch (err) {
            results.push({
              identifier,
              id: '',
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
          labelsToAdd: addLabelIds.length > 0 ? addLabelIds : undefined,
          labelsToRemove: removeLabelIds.length > 0 ? removeLabelIds : undefined,
          results,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
