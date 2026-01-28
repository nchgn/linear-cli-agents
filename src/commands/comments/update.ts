import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class CommentsUpdate extends Command {
  static override description = 'Update a comment'

  static override examples = ['<%= config.bin %> comments update COMMENT_ID --body "Updated comment text"']

  static override args = {
    id: Args.string({
      description: 'Comment ID',
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
    body: Flags.string({
      char: 'b',
      description: 'Comment body (supports markdown)',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(CommentsUpdate)
      const format = flags.format as OutputFormat
      const client = getClient()

      const payload = await client.updateComment(args.id, {
        body: flags.body,
      })

      if (!payload.success || !payload.comment) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to update comment')
      }

      const comment = await payload.comment
      const [user, issue] = await Promise.all([comment.user, comment.issue])

      const data = {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
            }
          : null,
        issue: issue
          ? {
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
            }
          : null,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            issue: data.issue?.identifier ?? 'N/A',
            user: data.user?.name ?? 'Unknown',
            body: data.body,
            updatedAt: data.updatedAt,
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
