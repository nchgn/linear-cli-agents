import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class UsersGet extends Command {
  static override description = 'Get a single user by ID'

  static override examples = [
    '<%= config.bin %> users get USER_ID',
    '<%= config.bin %> users get USER_ID --format table',
    '<%= config.bin %> users get me',
  ]

  static override args = {
    id: Args.string({
      description: 'User ID (use "me" for current user)',
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
      const {args, flags} = await this.parse(UsersGet)
      const format = flags.format as OutputFormat
      const client = getClient()

      let user
      if (args.id === 'me') {
        user = await client.viewer
      } else {
        user = await client.user(args.id)
      }

      if (!user) {
        throw new CliError(ErrorCodes.NOT_FOUND, `User ${args.id} not found`)
      }

      // Fetch assigned issues count
      const assignedIssues = await user.assignedIssues({first: 1})
      const teams = await user.teams()

      const data = {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        active: user.active,
        admin: user.admin,
        guest: user.guest,
        avatarUrl: user.avatarUrl ?? undefined,
        timezone: user.timezone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        assignedIssuesCount: assignedIssues.pageInfo.hasNextPage ? '50+' : assignedIssues.nodes.length,
        teams: teams.nodes.map((team) => ({
          id: team.id,
          key: team.key,
          name: team.name,
        })),
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            name: data.name,
            displayName: data.displayName,
            email: data.email,
            active: data.active ? 'Yes' : 'No',
            admin: data.admin ? 'Yes' : 'No',
            guest: data.guest ? 'Yes' : 'No',
            timezone: data.timezone ?? 'N/A',
            assignedIssues: data.assignedIssuesCount,
            teams: data.teams.map((t) => t.key).join(', ') || 'None',
            createdAt: data.createdAt,
          } as Record<string, unknown>,
          format,
        )
      } else {
        // plain: just the ID
        console.log(data.id)
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
