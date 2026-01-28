# linear-cli-agents

[![npm version](https://img.shields.io/npm/v/linear-cli-agents.svg)](https://www.npmjs.com/package/linear-cli-agents)
[![CI](https://github.com/nchgn/linear-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/nchgn/linear-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A CLI for interacting with [Linear](https://linear.app), designed for LLMs and agents.

## Features

- **JSON output**: All commands return structured JSON, perfect for parsing by LLMs
- **Multiple formats**: JSON (default), table (colored), or plain text output
- **Schema introspection**: Discover available operations programmatically
- **Full CRUD for issues**: List, create, update, and delete issues
- **Team management**: List and browse teams
- **Browser integration**: Open issues, teams, inbox directly in Linear
- **Raw GraphQL queries**: Execute any GraphQL query directly

## Installation

```bash
npm install -g linear-cli-agents
# or
pnpm add -g linear-cli-agents
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

1. **Discover capabilities**: Use `linear schema` to understand available operations
2. **Structured output**: All responses are JSON with consistent format
3. **Error codes**: Programmatic error handling via error codes
4. **Raw queries**: Use `linear query` for complex operations not covered by built-in commands

### Example LLM Workflow

```bash
# 1. Discover what operations are available
linear schema

# 2. Get details about issues
linear schema issues

# 3. List issues assigned to current user
linear issues list --assignee me

# 4. Create a new issue
linear issues create --input '{"title":"From LLM","teamId":"xxx"}'
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
