# linear-cli-agents

[![npm version](https://img.shields.io/npm/v/linear-cli-agents.svg)](https://www.npmjs.com/package/linear-cli-agents)
[![CI](https://github.com/nchgn/linear-cli-agents/actions/workflows/ci.yml/badge.svg)](https://github.com/nchgn/linear-cli-agents/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI for interacting with [Linear](https://linear.app), designed for LLMs and agents.

## Features

- **JSON output**: All commands return structured JSON, perfect for parsing by LLMs
- **Multiple formats**: JSON (default), table (colored), or plain text output
- **Comprehensive docs**: `linear info` returns full CLI documentation in one command
- **Configurable defaults**: Set default team to skip `--team-id` on every command
- **Bulk operations**: Update multiple issues at once with `bulk-update` and `bulk-label`
- **Schema introspection**: Discover available operations programmatically
- **Full CRUD**: Issues, projects, labels, comments, templates, milestones
- **Issue relations**: Manage blocks, duplicates, and related issues
- **Project management**: Projects, milestones, and status updates
- **Team management**: List and browse teams, states, users
- **Browser integration**: Open issues, teams, inbox directly in Linear
- **Search**: Find issues across workspace
- **Raw GraphQL queries**: Execute any GraphQL query directly

## Installation

```bash
npm install -g linear-cli-agents
# or
pnpm add -g linear-cli-agents
```

## Quick Start

```bash
# Install
npm install -g linear-cli-agents

# Authenticate
linear auth login

# Get full CLI documentation (recommended for LLMs)
linear info

# Configure default team (optional, skips --team-id on every command)
linear config set default-team-id YOUR_TEAM_ID

# Add CLI instructions to your CLAUDE.md (optional)
linear setup
```

## Authentication

```bash
# Open Linear API settings in browser to create a key
linear auth login --browser

# Login with API key
linear auth login --key lin_api_xxxxx

# Or use environment variable
export LINEAR_API_KEY=lin_api_xxxxx

# Check auth status
linear auth status

# View current user info
linear me

# Logout
linear auth logout
```

## Configuration

```bash
# Set default team (skips --team-id on create commands)
linear config set default-team-id YOUR_TEAM_UUID
linear config set default-team-key TEAM_KEY

# Get a config value
linear config get default-team-id

# List all config
linear config list
```

## Usage

### Issues

```bash
# List all issues
linear issues list

# List with filters
linear issues list --team ENG
linear issues list --assignee me
linear issues list --state "In Progress"
linear issues list --filter '{"priority":{"lte":2}}'

# Output formats: json (default), table (colored), plain (IDs only)
linear issues list --format table
linear issues list --format plain

# Get a specific issue
linear issues get ENG-123
linear issues get ENG-123 --format table

# Create an issue
linear issues create --title "Bug fix" --team-id <team-id>
linear issues create --input '{"title":"Feature","teamId":"xxx","priority":2}'

# Update an issue
linear issues update ENG-123 --title "Updated title"
linear issues update ENG-123 --state-id <state-id> --assignee-id <user-id>

# Delete an issue (moves to trash)
linear issues delete ENG-123

# Archive/unarchive an issue
linear issues archive ENG-123
linear issues archive ENG-123 --unarchive

# Manage labels on issues
linear issues add-labels ENG-123 --label-ids LABEL_ID1,LABEL_ID2
linear issues remove-labels ENG-123 --label-ids LABEL_ID1

# Bulk update multiple issues at once
linear issues bulk-update --ids ENG-1,ENG-2,ENG-3 --state-id STATE_ID
linear issues bulk-update --ids ENG-1,ENG-2 --priority 2 --assignee-id USER_ID

# Bulk add/remove labels from multiple issues
linear issues bulk-label --ids ENG-1,ENG-2,ENG-3 --add-labels LABEL1,LABEL2
linear issues bulk-label --ids ENG-1,ENG-2 --remove-labels LABEL1
```

### Projects

```bash
# List projects
linear projects list
linear projects list --team ENG
linear projects list --state started

# Get project details
linear projects get PROJECT_ID

# Create a project
linear projects create --name "Q1 Goals" --team-ids TEAM_ID
linear projects create --name "Feature X" --team-ids TEAM_ID --target-date 2024-06-30

# Update a project
linear projects update PROJECT_ID --name "Updated Name"
linear projects update PROJECT_ID --state completed

# Delete a project
linear projects delete PROJECT_ID

# Archive/unarchive a project
linear projects archive PROJECT_ID
linear projects archive PROJECT_ID --unarchive
```

### Project Milestones

```bash
# List milestones for a project
linear milestones list PROJECT_ID

# Get milestone details
linear milestones get MILESTONE_ID

# Create a milestone
linear milestones create PROJECT_ID --name "Alpha Release" --target-date 2024-03-01

# Update a milestone
linear milestones update MILESTONE_ID --name "Beta Release"
```

### Project Updates

```bash
# List status updates for a project
linear project-updates list PROJECT_ID

# Get update details
linear project-updates get UPDATE_ID

# Create a status update
linear project-updates create PROJECT_ID --body "Sprint completed" --health onTrack

# Update a status update
linear project-updates update UPDATE_ID --body "Updated status"
```

### Issue Relations

```bash
# List relations for an issue
linear relations list ENG-123

# Create a relation
linear relations create ENG-123 ENG-456 --type blocks
linear relations create ENG-123 ENG-456 --type duplicate
linear relations create ENG-123 ENG-456 --type related

# Delete a relation
linear relations delete RELATION_ID
```

### Labels

```bash
# List labels
linear labels list
linear labels list --team ENG

# Create a label
linear labels create --name "Bug" --color "#FF0000"
linear labels create --name "Feature" --color "#00FF00" --team-id TEAM_ID

# Update a label
linear labels update LABEL_ID --name "Critical Bug" --color "#FF0000"

# Delete a label
linear labels delete LABEL_ID
```

### Templates

```bash
# List templates
linear templates list
linear templates list --team ENG

# Get template details
linear templates get TEMPLATE_ID

# Create a template
linear templates create --name "Bug Report" --type issue --team-id TEAM_ID \
  --template-data '{"title":"Bug: ","priority":2}'

# Update a template
linear templates update TEMPLATE_ID --name "Updated Template"
```

### Comments

```bash
# List comments on an issue
linear comments list ENG-123

# Add a comment
linear comments add ENG-123 --body "This looks good!"

# Update a comment
linear comments update COMMENT_ID --body "Updated comment"

# Delete a comment
linear comments delete COMMENT_ID
```

### States

```bash
# List workflow states
linear states list
linear states list --team ENG
```

### Cycles (Sprints)

```bash
# List all cycles
linear cycles list
linear cycles list --team ENG

# Filter by status
linear cycles list --active      # Currently running
linear cycles list --upcoming    # Future cycles
linear cycles list --completed   # Past cycles

# Get current cycle for a team
linear cycles current --team ENG

# Get cycle details
linear cycles get CYCLE_ID
```

### Users

```bash
# List users
linear users list

# Get user details
linear users get USER_ID
```

### Search

```bash
# Search issues
linear search "login bug"
linear search "SSO" --team ENG
```

### Teams

```bash
# List all teams
linear teams list

# With table format
linear teams list --format table
```

### Open in Browser

```bash
# Open an issue
linear open ENG-123

# Open a team
linear open --team ENG

# Open inbox
linear open --inbox

# Open my issues
linear open --my-issues

# Open settings
linear open --settings
```

### User Info

```bash
# Show current user
linear me
linear whoami

# With table format
linear me --format table
```

### Schema Introspection (for LLMs)

```bash
# List available entities
linear schema

# Get schema for a specific entity
linear schema issues

# Get full schema (all entities)
linear schema --full

# Include usage examples
linear schema issues --include-examples
```

### Raw GraphQL Queries

```bash
# Execute any GraphQL query
linear query --gql "query { viewer { id name email } }"

# With variables
linear query --gql "query(\$id: String!) { issue(id: \$id) { title } }" \
  --variables '{"id":"xxx"}'
```

## Output Format

### JSON (default)

All commands return structured JSON by default, ideal for LLMs and scripts:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Success with pagination
{
  "success": true,
  "data": [...],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "abc123"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Issue ENG-123 not found"
  }
}
```

### Table (human-readable)

Use `--format table` for colored, human-readable output:

```bash
linear issues list --format table
# ID        PRI     TITLE
# ENG-123   High    Fix login bug
# ENG-124   Medium  Add dark mode
```

### Plain (minimal)

Use `--format plain` for minimal output (IDs/identifiers only):

```bash
linear issues list --format plain
# ENG-123    Fix login bug
# ENG-124    Add dark mode
```

### Disabling Colors

Colors are automatically disabled when piping output. You can also disable them manually:

```bash
NO_COLOR=1 linear issues list --format table
# or
linear issues list --format table --no-color
```

## For LLM Integration

The CLI is designed to be easily used by LLMs and AI agents:

1. **Single discovery command**: Use `linear info` to get complete documentation in one JSON response
2. **Structured output**: All responses are JSON with consistent format
3. **Configurable defaults**: Set default team to reduce command complexity
4. **Bulk operations**: Update multiple issues efficiently
5. **Error codes**: Programmatic error handling via error codes

### Example LLM Workflow

```bash
# 1. Get complete CLI documentation in one command
linear info

# 2. Or get compact version for limited context
linear info --compact

# 3. Create issues (uses default team if configured)
linear issues create --title "From LLM"

# 4. Bulk update multiple issues
linear issues bulk-update --ids ENG-1,ENG-2,ENG-3 --state-id STATE_ID
```

### Claude Code Integration

```bash
# Add CLI instructions to CLAUDE.md
linear setup

# Remove instructions
linear setup --remove
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development
./bin/dev.js issues list

# Run tests
pnpm test
```

## Troubleshooting

### Authentication Issues

**"Not authenticated" error:**

```bash
# Check current auth status
linear auth status

# Re-authenticate
linear auth login --key lin_api_xxxxx
```

**Using environment variable:**

```bash
export LINEAR_API_KEY=lin_api_xxxxx
linear auth status  # Should show source: environment
```

### Common Errors

| Error Code          | Cause                      | Solution                                        |
| ------------------- | -------------------------- | ----------------------------------------------- |
| `NOT_AUTHENTICATED` | No API key configured      | Run `linear auth login` or set `LINEAR_API_KEY` |
| `INVALID_API_KEY`   | API key expired or invalid | Generate a new key in Linear settings           |
| `NOT_FOUND`         | Resource doesn't exist     | Check the issue/team identifier                 |
| `RATE_LIMITED`      | Too many requests          | Wait before retrying                            |

### Getting Help

```bash
# See all commands
linear --help

# Get help for a specific command
linear issues --help
linear issues create --help
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
