import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {resolveIssueId} from '../../lib/issue-utils.js'
import type {OutputFormat} from '../../lib/types.js'

export default class IssuesAddLabels extends Command {
  static override description = 'Add labels to an issue'

  static override examples = ['<%= config.bin %> issues add-labels ENG-123 --label-ids LABEL_ID1,LABEL_ID2']

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
      description: 'Comma-separated label IDs to add',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(IssuesAddLabels)
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

      // Parse new label IDs
      const newLabelIds = flags['label-ids'].split(',').map((id) => id.trim())

      // Combine existing and new labels (avoiding duplicates)
      const combinedLabelIds = [...new Set([...existingLabelIds, ...newLabelIds])]

      // Update the issue with combined labels
      const payload = await client.updateIssue(issueId, {
        labelIds: combinedLabelIds,
      })

      if (!payload.success) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to add labels to issue')
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
        labelsAdded: newLabelIds.filter((id) => !existingLabelIds.includes(id)),
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
            labels: data.labels.map((l) => l.name).join(', '),
            labelsAdded: data.labelsAdded.length,
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
