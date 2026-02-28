import {Command, Flags} from '@oclif/core'
import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {homedir} from 'node:os'
import {join, dirname} from 'node:path'
import {success, print} from '../lib/output.js'
import {handleError} from '../lib/errors.js'

const CLAUDE_MD_PATH = join(homedir(), '.claude', 'CLAUDE.md')
const LINEAR_CLI_SECTION_START = '<!-- LINEAR-CLI-START -->'
const LINEAR_CLI_SECTION_END = '<!-- LINEAR-CLI-END -->'

const LINEAR_CLI_DOCS = `${LINEAR_CLI_SECTION_START}
## Linear CLI

CLI for Linear. Run \`linear info\` for full documentation.

\`\`\`bash
linear auth login                          # Authenticate (one-time)
linear info                                # Get all commands and docs
linear issues create --title "X" --team-id ID
linear issues bulk-update --ids A,B,C --state-id ID
\`\`\`
${LINEAR_CLI_SECTION_END}`

export default class Setup extends Command {
  static override description = 'Add Linear CLI instructions to your CLAUDE.md'

  static override examples = ['<%= config.bin %> setup', '<%= config.bin %> setup --remove']

  static override flags = {
    remove: Flags.boolean({
      description: 'Remove Linear CLI section from CLAUDE.md',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {flags} = await this.parse(Setup)

      const dir = dirname(CLAUDE_MD_PATH)
      if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true})
      }

      let content = ''
      if (existsSync(CLAUDE_MD_PATH)) {
        content = readFileSync(CLAUDE_MD_PATH, 'utf-8')
      }

      const hasSection = content.includes(LINEAR_CLI_SECTION_START)

      if (flags.remove) {
        if (!hasSection) {
          print(
            success({
              action: 'none',
              message: 'Linear CLI section not found in CLAUDE.md',
              path: CLAUDE_MD_PATH,
            }),
          )
          return
        }

        const regex = new RegExp(`\\n?${LINEAR_CLI_SECTION_START}[\\s\\S]*?${LINEAR_CLI_SECTION_END}\\n?`, 'g')
        content = content.replace(regex, '\n').trim() + '\n'
        writeFileSync(CLAUDE_MD_PATH, content, 'utf-8')

        print(
          success({
            action: 'removed',
            message: 'Linear CLI section removed from CLAUDE.md',
            path: CLAUDE_MD_PATH,
          }),
        )
        return
      }

      if (hasSection) {
        const regex = new RegExp(`${LINEAR_CLI_SECTION_START}[\\s\\S]*?${LINEAR_CLI_SECTION_END}`, 'g')
        content = content.replace(regex, LINEAR_CLI_DOCS)
        writeFileSync(CLAUDE_MD_PATH, content, 'utf-8')

        print(
          success({
            action: 'updated',
            message: 'Linear CLI section updated in CLAUDE.md',
            path: CLAUDE_MD_PATH,
          }),
        )
      } else {
        const separator = content.length > 0 && !content.endsWith('\n\n') ? '\n\n' : ''
        content = content + separator + LINEAR_CLI_DOCS + '\n'
        writeFileSync(CLAUDE_MD_PATH, content, 'utf-8')

        print(
          success({
            action: 'added',
            message: 'Linear CLI section added to CLAUDE.md',
            path: CLAUDE_MD_PATH,
          }),
        )
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
