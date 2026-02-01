import {Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import {getDefaultTeamId} from '../../lib/config.js'
import type {LinearDocument} from '@linear/sdk'

type IssueCreateInput = LinearDocument.IssueCreateInput

export default class IssuesCreate extends Command {
  static override description = 'Create a new issue'

  static override examples = [
    '<%= config.bin %> issues create --input \'{"title":"Bug fix","teamId":"xxx"}\'',
    '<%= config.bin %> issues create --title "New feature" --team-id xxx',
    '<%= config.bin %> issues create --title "Task" --team-id xxx --description "Details here" --priority 2',
  ]

  static override flags = {
    input: Flags.string({
      char: 'i',
      description: 'JSON input object (IssueCreateInput)',
      exclusive: ['title'],
    }),
    title: Flags.string({
      description: 'Issue title',
      exclusive: ['input'],
    }),
    'team-id': Flags.string({
      description: 'Team ID',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Issue description (markdown supported)',
    }),
    priority: Flags.integer({
      char: 'p',
      description: 'Priority (0=none, 1=urgent, 2=high, 3=medium, 4=low)',
    }),
    'assignee-id': Flags.string({
      description: 'Assignee user ID',
    }),
    'state-id': Flags.string({
      description: 'State ID',
    }),
    'project-id': Flags.string({
      description: 'Project ID',
    }),
    estimate: Flags.integer({
      description: 'Estimate points',
    }),
    'label-ids': Flags.string({
      description: 'Comma-separated label IDs',
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(IssuesCreate)
      const client = getClient()

      let input: IssueCreateInput

      if (flags.input) {
        // Parse JSON input
        try {
          input = JSON.parse(flags.input) as IssueCreateInput
        } catch {
          throw new CliError(ErrorCodes.INVALID_INPUT, 'Invalid JSON in --input flag')
        }
      } else {
        // Build input from individual flags
        if (!flags.title) {
          throw new CliError(ErrorCodes.MISSING_REQUIRED_FIELD, 'Title is required. Use --title or --input')
        }

        // Use provided team-id or fall back to default
        const teamId = flags['team-id'] ?? getDefaultTeamId()
        if (!teamId) {
          throw new CliError(
            ErrorCodes.MISSING_REQUIRED_FIELD,
            'Team ID is required. Use --team-id, --input, or configure default with "linear config set default-team-id TEAM_ID"',
          )
        }

        input = {
          title: flags.title,
          teamId,
        }

        if (flags.description) input.description = flags.description
        if (flags.priority !== undefined) input.priority = flags.priority
        if (flags['assignee-id']) input.assigneeId = flags['assignee-id']
        if (flags['state-id']) input.stateId = flags['state-id']
        if (flags['project-id']) input.projectId = flags['project-id']
        if (flags.estimate !== undefined) input.estimate = flags.estimate
        if (flags['label-ids']) input.labelIds = flags['label-ids'].split(',')
      }

      // Create the issue
      const payload = await client.createIssue(input)
      const issue = await payload.issue

      if (!issue) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to create issue')
      }

      print(
        success({
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          createdAt: issue.createdAt,
        }),
      )
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
