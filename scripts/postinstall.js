#!/usr/bin/env node

/**
 * Post-install script that optionally adds Linear CLI usage instructions to CLAUDE.md
 */

import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {homedir} from 'node:os'
import {join, dirname} from 'node:path'
import {createInterface} from 'node:readline'

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

const updateClaudeMd = () => {
  const dir = dirname(CLAUDE_MD_PATH)
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true})
  }

  let content = existsSync(CLAUDE_MD_PATH) ? readFileSync(CLAUDE_MD_PATH, 'utf-8') : ''

  if (content.includes(LINEAR_CLI_SECTION_START)) {
    const regex = new RegExp(`${LINEAR_CLI_SECTION_START}[\\s\\S]*?${LINEAR_CLI_SECTION_END}`, 'g')
    content = content.replace(regex, LINEAR_CLI_DOCS)
  } else {
    const separator = content.length > 0 && !content.endsWith('\n\n') ? '\n\n' : ''
    content = content + separator + LINEAR_CLI_DOCS + '\n'
  }

  writeFileSync(CLAUDE_MD_PATH, content, 'utf-8')
  return true
}

const askQuestion = (question) => {
  return new Promise((resolve) => {
    // Check if stdin is available and interactive
    if (!process.stdin.isTTY) {
      resolve(null)
      return
    }

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(question, (answer) => {
      rl.close()
      resolve(answer?.toLowerCase().trim())
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      rl.close()
      resolve(null)
    }, 10000)
  })
}

const main = async () => {
  // Skip in CI environments
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    return
  }

  console.log('\n✓ Linear CLI installed')

  const answer = await askQuestion('  Add usage instructions to ~/.claude/CLAUDE.md? [y/N] ')

  if (answer === 'y' || answer === 'yes') {
    try {
      updateClaudeMd()
      console.log('  ✓ Added to CLAUDE.md\n')
    } catch {
      console.log('  ✗ Failed. Run "linear setup" manually.\n')
    }
  } else {
    console.log('  Run "linear setup" later to add instructions.\n')
  }
}

main()
