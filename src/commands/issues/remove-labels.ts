import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import type {OutputFormat} from '../../lib/types.js'

export default class IssuesRemoveLabels extends Command {
  static override description = 'Remove labels from an issue'

  static override examples = ['<%= config.bin %> issues remove-labels ENG-123 --label-ids LABEL_ID1,LABEL_ID2']

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
    'label-ids': Flags.string({
      description: 'Comma-separated label IDs to remove',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(IssuesRemoveLabels)
      const format = flags.format as OutputFormat
      const client = getClient()

      const issueId = await resolveIssueId(client, args.id)
      const issue = await client.issue(issueId)

      if (!issue) {
        throw new CliError(ErrorCodes.NOT_FOUND, `Issue ${args.id} not found`)
      }

      // Get existing labels
      const existingLabels = await issue.labels()
      const existingLabelIds = existingLabels.nodes.map((l) => l.id)

      // Parse label IDs to remove
      const labelIdsToRemove = flags['label-ids'].split(',').map((id) => id.trim())

      // Filter out the labels to remove
      const remainingLabelIds = existingLabelIds.filter((id) => !labelIdsToRemove.includes(id))

      // Update the issue with remaining labels
      const payload = await client.updateIssue(issueId, {
        labelIds: remainingLabelIds,
      })

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to remove labels from issue')
      }

      const updatedIssue = await payload.issue
      if (!updatedIssue) {
        throw new CliError(ErrorCodes.API_ERROR, 'Issue not found in response')
      }

      const labels = await updatedIssue.labels()

      const data = {
        id: updatedIssue.id,
        identifier: updatedIssue.identifier,
        title: updatedIssue.title,
        labels: labels.nodes.map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })),
        labelsRemoved: labelIdsToRemove.filter((id) => existingLabelIds.includes(id)),
        url: updatedIssue.url,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            identifier: data.identifier,
            title: data.title,
            labels: data.labels.map((l) => l.name).join(', ') || 'None',
            labelsRemoved: data.labelsRemoved.length,
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
