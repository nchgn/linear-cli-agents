import {Args, Command, Flags} from '@oclif/core'
import {getClient} from '../../lib/client.js'
import {success, print, printItem} from '../../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../../lib/errors.js'
import type {OutputFormat} from '../../lib/types.js'

export default class ProjectsArchive extends Command {
  static override description = 'Archive a project'

  static override examples = [
    '<%= config.bin %> projects archive PROJECT_ID',
    '<%= config.bin %> projects archive PROJECT_ID --unarchive',
  ]

  static override args = {
    id: Args.string({
      description: 'Project ID',
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
      const {args, flags} = await this.parse(ProjectsArchive)
      const format = flags.format as OutputFormat
      const client = getClient()

      let payload
      if (flags.unarchive) {
        payload = await client.unarchiveProject(args.id)
      } else {
        payload = await client.archiveProject(args.id)
      }

      if (!payload.success) {
        const action = flags.unarchive ? 'unarchive' : 'archive'
        throw new CliError(ErrorCodes.API_ERROR, `Failed to ${action} project`)
      }

      const project = await (
        payload as {
          success: boolean
          project?: Promise<{id: string; name: string; archivedAt: Date | null; url: string}>
        }
      ).project
      if (!project) {
        throw new CliError(ErrorCodes.API_ERROR, 'Project not found in response')
      }

      const action = flags.unarchive ? 'unarchived' : 'archived'

      const data = {
        id: project.id,
        name: project.name,
        action,
        archivedAt: project.archivedAt,
        url: project.url,
      }

      if (format === 'json') {
        print(success(data))
      } else if (format === 'table') {
        printItem(
          {
            id: data.id,
            name: data.name,
            action: data.action,
            archivedAt: data.archivedAt ?? 'N/A',
            url: data.url,
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
