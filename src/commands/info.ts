import {Command, Flags} from '@oclif/core'
import {success, print} from '../lib/output.js'

/**
 * Comprehensive CLI documentation for LLM agents.
 * Returns all commands, flags, examples, and schema in a single JSON response.
 */

interface FlagDef {
  type: string
  description?: string
  char?: string
  options?: string[]
  default?: string
  required?: boolean
}

interface ArgDef {
  description: string
  required?: boolean
}

interface CommandDef {
  description: string
  args?: Record<string, ArgDef>
  flags: Record<string, FlagDef>
  examples: string[]
}

const COMMANDS: Record<string, CommandDef> = {
  // Authentication
  'auth login': {
    description: 'Authenticate with Linear',
    flags: {
      token: {type: 'string', description: 'API token (or enter interactively)'},
    },
    examples: ['linear auth login', 'linear auth login --token lin_api_xxx'],
  },
  'auth logout': {
    description: 'Remove stored credentials',
    flags: {},
    examples: ['linear auth logout'],
  },
  'auth status': {
    description: 'Check authentication status',
    flags: {},
    examples: ['linear auth status'],
  },

  // Issues
  'issues list': {
    description: 'List issues with optional filters',
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      first: {type: 'number', description: 'Number of results (default: 50)'},
      after: {type: 'string', description: 'Pagination cursor'},
      filter: {type: 'string', description: 'JSON filter object'},
      team: {type: 'string', description: 'Team key (e.g., ENG)'},
      state: {type: 'string', description: 'State name filter'},
      assignee: {type: 'string', description: 'Assignee name filter'},
    },
    examples: [
      'linear issues list',
      'linear issues list --team MITO',
      'linear issues list --state "In Progress"',
      'linear issues list --filter \'{"priority":{"lte":2}}\'',
    ],
  },
  'issues get': {
    description: 'Get issue details',
    args: {id: {description: 'Issue ID or identifier (e.g., ENG-123)', required: true}},
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      'with-attachments': {type: 'boolean', description: 'Include attachments (linked PRs, commits, etc.)'},
    },
    examples: ['linear issues get ENG-123', 'linear issues get ENG-123 --with-attachments'],
  },
  'issues create': {
    description: 'Create a new issue',
    flags: {
      input: {type: 'string', description: 'JSON input (IssueCreateInput)'},
      title: {type: 'string', description: 'Issue title', required: true},
      'team-id': {type: 'string', description: 'Team ID (uses default if configured)'},
      description: {type: 'string', char: 'd', description: 'Description (markdown)'},
      priority: {type: 'number', description: '0=none, 1=urgent, 2=high, 3=medium, 4=low'},
      'assignee-id': {type: 'string', description: 'Assignee user ID'},
      'state-id': {type: 'string', description: 'Workflow state ID'},
      'project-id': {type: 'string', description: 'Project ID'},
      estimate: {type: 'number', description: 'Story points'},
      'label-ids': {type: 'string', description: 'Comma-separated label IDs'},
    },
    examples: [
      'linear issues create --title "Fix bug" --team-id xxx',
      'linear issues create --title "Task" --team-id xxx --priority 2',
      'linear issues create --input \'{"title":"Bug","teamId":"xxx"}\'',
    ],
  },
  'issues update': {
    description: 'Update an existing issue',
    args: {id: {description: 'Issue ID or identifier', required: true}},
    flags: {
      input: {type: 'string', description: 'JSON input (IssueUpdateInput)'},
      title: {type: 'string', description: 'New title'},
      description: {type: 'string', char: 'd', description: 'New description'},
      priority: {type: 'number', description: 'New priority'},
      'assignee-id': {type: 'string', description: 'New assignee (empty to unassign)'},
      'state-id': {type: 'string', description: 'New state ID'},
      'project-id': {type: 'string', description: 'New project ID'},
      estimate: {type: 'number', description: 'New estimate'},
      'label-ids': {type: 'string', description: 'Replace labels (comma-separated)'},
    },
    examples: [
      'linear issues update ENG-123 --title "Updated title"',
      'linear issues update ENG-123 --state-id xxx --priority 1',
    ],
  },
  'issues delete': {
    description: 'Delete an issue',
    args: {id: {description: 'Issue ID or identifier', required: true}},
    flags: {},
    examples: ['linear issues delete ENG-123'],
  },
  'issues archive': {
    description: 'Archive an issue',
    args: {id: {description: 'Issue ID or identifier', required: true}},
    flags: {},
    examples: ['linear issues archive ENG-123'],
  },
  'issues add-labels': {
    description: 'Add labels to an issue',
    args: {id: {description: 'Issue ID or identifier', required: true}},
    flags: {
      'label-ids': {type: 'string', description: 'Comma-separated label IDs', required: true},
    },
    examples: ['linear issues add-labels ENG-123 --label-ids LABEL1,LABEL2'],
  },
  'issues remove-labels': {
    description: 'Remove labels from an issue',
    args: {id: {description: 'Issue ID or identifier', required: true}},
    flags: {
      'label-ids': {type: 'string', description: 'Comma-separated label IDs', required: true},
    },
    examples: ['linear issues remove-labels ENG-123 --label-ids LABEL1'],
  },
  'issues bulk-update': {
    description: 'Update multiple issues at once',
    flags: {
      ids: {type: 'string', description: 'Comma-separated issue IDs or identifiers', required: true},
      'state-id': {type: 'string', description: 'New state ID'},
      priority: {type: 'number', description: 'New priority'},
      'assignee-id': {type: 'string', description: 'New assignee'},
      'project-id': {type: 'string', description: 'New project ID'},
    },
    examples: [
      'linear issues bulk-update --ids ENG-1,ENG-2,ENG-3 --state-id xxx',
      'linear issues bulk-update --ids ENG-1,ENG-2 --priority 2',
    ],
  },
  'issues bulk-label': {
    description: 'Add or remove labels from multiple issues',
    flags: {
      ids: {type: 'string', description: 'Comma-separated issue IDs', required: true},
      'add-labels': {type: 'string', description: 'Label IDs to add'},
      'remove-labels': {type: 'string', description: 'Label IDs to remove'},
    },
    examples: [
      'linear issues bulk-label --ids ENG-1,ENG-2 --add-labels LABEL1,LABEL2',
      'linear issues bulk-label --ids ENG-1,ENG-2 --remove-labels LABEL1',
    ],
  },

  // Projects
  'projects list': {
    description: 'List projects',
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      first: {type: 'number', description: 'Number of results'},
      after: {type: 'string', description: 'Pagination cursor'},
    },
    examples: ['linear projects list'],
  },
  'projects get': {
    description: 'Get project details',
    args: {id: {description: 'Project ID', required: true}},
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear projects get PROJECT_ID'],
  },
  'projects create': {
    description: 'Create a project',
    flags: {
      name: {type: 'string', char: 'n', description: 'Project name', required: true},
      description: {type: 'string', char: 'd', description: 'Project description (short subtitle)'},
      content: {type: 'string', char: 'c', description: 'Project content (markdown, long-form description body)'},
      state: {type: 'string', options: ['planned', 'started', 'paused', 'completed', 'canceled']},
      'team-ids': {type: 'string', description: 'Team IDs (uses default if configured)'},
      'lead-id': {type: 'string', description: 'Lead user ID'},
      'start-date': {type: 'string', description: 'Start date (YYYY-MM-DD)'},
      'target-date': {type: 'string', description: 'Target date (YYYY-MM-DD)'},
    },
    examples: [
      'linear projects create --name "My Project" --team-ids TEAM_ID',
      'linear projects create --name "Q1" --target-date 2024-03-31',
    ],
  },
  'projects update': {
    description: 'Update a project',
    args: {id: {description: 'Project ID', required: true}},
    flags: {
      name: {type: 'string', description: 'New name'},
      description: {type: 'string', description: 'New description (short subtitle)'},
      content: {type: 'string', char: 'c', description: 'New content (markdown, long-form description body)'},
      state: {type: 'string', options: ['planned', 'started', 'paused', 'completed', 'canceled']},
      'lead-id': {type: 'string', description: 'Lead user ID'},
      'start-date': {type: 'string', description: 'Start date (YYYY-MM-DD)'},
      'target-date': {type: 'string', description: 'Target date (YYYY-MM-DD)'},
    },
    examples: [
      'linear projects update PROJECT_ID --name "New Name"',
      'linear projects update PROJECT_ID --content "# Plan\\nDetailed markdown content"',
    ],
  },
  'projects delete': {
    description: 'Delete a project',
    args: {id: {description: 'Project ID', required: true}},
    flags: {},
    examples: ['linear projects delete PROJECT_ID'],
  },
  'projects archive': {
    description: 'Archive a project',
    args: {id: {description: 'Project ID', required: true}},
    flags: {},
    examples: ['linear projects archive PROJECT_ID'],
  },

  // Teams
  'teams list': {
    description: 'List teams',
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear teams list'],
  },

  // Users
  'users list': {
    description: 'List users',
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear users list'],
  },
  'users get': {
    description: 'Get user details',
    args: {id: {description: 'User ID', required: true}},
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear users get USER_ID'],
  },

  // Labels
  'labels list': {
    description: 'List labels',
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      'team-id': {type: 'string', description: 'Filter by team'},
    },
    examples: ['linear labels list', 'linear labels list --team-id TEAM_ID'],
  },
  'labels create': {
    description: 'Create a label',
    flags: {
      name: {type: 'string', description: 'Label name', required: true},
      color: {type: 'string', description: 'Label color (hex)', required: true},
      'team-id': {type: 'string', description: 'Team ID'},
      description: {type: 'string', description: 'Label description'},
    },
    examples: ['linear labels create --name "bug" --color "#ff0000"'],
  },
  'labels update': {
    description: 'Update a label',
    args: {id: {description: 'Label ID', required: true}},
    flags: {
      name: {type: 'string', description: 'New name'},
      color: {type: 'string', description: 'New color'},
    },
    examples: ['linear labels update LABEL_ID --name "Bug"'],
  },
  'labels delete': {
    description: 'Delete a label',
    args: {id: {description: 'Label ID', required: true}},
    flags: {},
    examples: ['linear labels delete LABEL_ID'],
  },

  // States
  'states list': {
    description: 'List workflow states',
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      'team-id': {type: 'string', description: 'Filter by team'},
    },
    examples: ['linear states list', 'linear states list --team-id TEAM_ID'],
  },

  // Comments
  'comments list': {
    description: 'List comments on an issue',
    flags: {
      'issue-id': {type: 'string', description: 'Issue ID', required: true},
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
    },
    examples: ['linear comments list --issue-id ISSUE_ID'],
  },
  'comments add': {
    description: 'Add a comment to an issue',
    flags: {
      'issue-id': {type: 'string', description: 'Issue ID', required: true},
      body: {type: 'string', description: 'Comment body (markdown)', required: true},
    },
    examples: ['linear comments add --issue-id ISSUE_ID --body "Comment text"'],
  },
  'comments update': {
    description: 'Update a comment',
    args: {id: {description: 'Comment ID', required: true}},
    flags: {body: {type: 'string', description: 'New body', required: true}},
    examples: ['linear comments update COMMENT_ID --body "Updated text"'],
  },
  'comments delete': {
    description: 'Delete a comment',
    args: {id: {description: 'Comment ID', required: true}},
    flags: {},
    examples: ['linear comments delete COMMENT_ID'],
  },

  // Relations
  'relations list': {
    description: 'List issue relations',
    args: {id: {description: 'Issue ID', required: true}},
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear relations list ENG-123'],
  },
  'relations create': {
    description: 'Create issue relation',
    flags: {
      'issue-id': {type: 'string', description: 'Source issue ID', required: true},
      'related-issue-id': {type: 'string', description: 'Related issue ID', required: true},
      type: {type: 'string', options: ['blocks', 'blocked_by', 'related', 'duplicate'], required: true},
    },
    examples: ['linear relations create --issue-id ENG-1 --related-issue-id ENG-2 --type blocks'],
  },
  'relations delete': {
    description: 'Delete issue relation',
    args: {id: {description: 'Relation ID', required: true}},
    flags: {},
    examples: ['linear relations delete RELATION_ID'],
  },

  // Milestones
  'milestones list': {
    description: 'List project milestones',
    flags: {
      'project-id': {type: 'string', description: 'Project ID', required: true},
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
    },
    examples: ['linear milestones list --project-id PROJECT_ID'],
  },
  'milestones get': {
    description: 'Get milestone details',
    args: {id: {description: 'Milestone ID', required: true}},
    flags: {},
    examples: ['linear milestones get MILESTONE_ID'],
  },
  'milestones create': {
    description: 'Create a milestone',
    flags: {
      'project-id': {type: 'string', description: 'Project ID', required: true},
      name: {type: 'string', description: 'Milestone name', required: true},
      description: {type: 'string', description: 'Description'},
      'target-date': {type: 'string', description: 'Target date (YYYY-MM-DD)'},
    },
    examples: ['linear milestones create --project-id xxx --name "Alpha"'],
  },
  'milestones update': {
    description: 'Update a milestone',
    args: {id: {description: 'Milestone ID', required: true}},
    flags: {
      name: {type: 'string', description: 'New name'},
      description: {type: 'string', description: 'New description'},
    },
    examples: ['linear milestones update MILESTONE_ID --name "Beta"'],
  },

  // Project Updates
  'project-updates list': {
    description: 'List project status updates',
    flags: {
      'project-id': {type: 'string', description: 'Project ID', required: true},
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
    },
    examples: ['linear project-updates list --project-id PROJECT_ID'],
  },
  'project-updates get': {
    description: 'Get project update details',
    args: {id: {description: 'Update ID', required: true}},
    flags: {},
    examples: ['linear project-updates get UPDATE_ID'],
  },
  'project-updates create': {
    description: 'Create a project status update',
    flags: {
      'project-id': {type: 'string', description: 'Project ID', required: true},
      body: {type: 'string', description: 'Update body (markdown)', required: true},
      health: {type: 'string', options: ['onTrack', 'atRisk', 'offTrack']},
    },
    examples: ['linear project-updates create --project-id xxx --body "Progress update"'],
  },
  'project-updates update': {
    description: 'Update a project status update',
    args: {id: {description: 'Update ID', required: true}},
    flags: {
      body: {type: 'string', description: 'New body'},
      health: {type: 'string', options: ['onTrack', 'atRisk', 'offTrack']},
    },
    examples: ['linear project-updates update UPDATE_ID --health atRisk'],
  },

  // Templates
  'templates list': {
    description: 'List issue templates',
    flags: {
      'team-id': {type: 'string', description: 'Team ID'},
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
    },
    examples: ['linear templates list'],
  },
  'templates get': {
    description: 'Get template details',
    args: {id: {description: 'Template ID', required: true}},
    flags: {},
    examples: ['linear templates get TEMPLATE_ID'],
  },
  'templates create': {
    description: 'Create an issue template',
    flags: {
      'team-id': {type: 'string', description: 'Team ID', required: true},
      name: {type: 'string', description: 'Template name', required: true},
      description: {type: 'string', description: 'Template description'},
    },
    examples: ['linear templates create --team-id xxx --name "Bug Report"'],
  },
  'templates update': {
    description: 'Update a template',
    args: {id: {description: 'Template ID', required: true}},
    flags: {
      name: {type: 'string', description: 'New name'},
      description: {type: 'string', description: 'New description'},
    },
    examples: ['linear templates update TEMPLATE_ID --name "New Name"'],
  },

  // Documents
  'documents list': {
    description: 'List documents',
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      first: {type: 'number', description: 'Number of results'},
    },
    examples: ['linear documents list'],
  },
  'documents get': {
    description: 'Get document details',
    args: {id: {description: 'Document ID', required: true}},
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear documents get DOCUMENT_ID'],
  },
  'documents create': {
    description: 'Create a new document',
    flags: {
      title: {type: 'string', char: 't', description: 'Document title', required: true},
      content: {type: 'string', char: 'c', description: 'Document content (markdown)'},
      'project-id': {type: 'string', description: 'Project ID to associate with'},
      icon: {type: 'string', description: 'Document icon (emoji)'},
      color: {type: 'string', description: 'Document color (hex)'},
    },
    examples: [
      'linear documents create --title "My Document"',
      'linear documents create --title "Notes" --content "# Heading\\n\\nContent"',
    ],
  },
  'documents update': {
    description: 'Update a document',
    args: {id: {description: 'Document ID', required: true}},
    flags: {
      title: {type: 'string', char: 't', description: 'New title'},
      content: {type: 'string', char: 'c', description: 'New content (markdown)'},
      'project-id': {type: 'string', description: 'New project ID (empty to remove)'},
      icon: {type: 'string', description: 'New icon (emoji)'},
      color: {type: 'string', description: 'New color (hex)'},
    },
    examples: ['linear documents update DOCUMENT_ID --title "New Title"'],
  },
  'documents delete': {
    description: 'Delete a document (moves to trash)',
    args: {id: {description: 'Document ID', required: true}},
    flags: {},
    examples: ['linear documents delete DOCUMENT_ID'],
  },

  // Initiatives
  'initiatives list': {
    description: 'List initiatives',
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      status: {type: 'string', options: ['Planned', 'Active', 'Completed'], description: 'Filter by status'},
      first: {type: 'number', description: 'Number of results'},
    },
    examples: ['linear initiatives list', 'linear initiatives list --status Active'],
  },
  'initiatives get': {
    description: 'Get initiative details',
    args: {id: {description: 'Initiative ID', required: true}},
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear initiatives get INITIATIVE_ID'],
  },
  'initiatives create': {
    description: 'Create a new initiative',
    flags: {
      name: {type: 'string', char: 'n', description: 'Initiative name', required: true},
      description: {type: 'string', char: 'd', description: 'Initiative description'},
      status: {type: 'string', options: ['Planned', 'Active', 'Completed'], description: 'Initial status'},
      'target-date': {type: 'string', description: 'Target completion date (YYYY-MM-DD)'},
      'owner-id': {type: 'string', description: 'Owner user ID'},
      icon: {type: 'string', description: 'Initiative icon (emoji)'},
      color: {type: 'string', description: 'Initiative color (hex)'},
    },
    examples: [
      'linear initiatives create --name "Q1 Goals"',
      'linear initiatives create --name "Launch" --status Active --target-date 2024-12-31',
    ],
  },
  'initiatives update': {
    description: 'Update an initiative',
    args: {id: {description: 'Initiative ID', required: true}},
    flags: {
      name: {type: 'string', char: 'n', description: 'New name'},
      description: {type: 'string', char: 'd', description: 'New description'},
      status: {type: 'string', options: ['Planned', 'Active', 'Completed'], description: 'New status'},
      'target-date': {type: 'string', description: 'New target date (YYYY-MM-DD)'},
      'owner-id': {type: 'string', description: 'New owner user ID'},
      icon: {type: 'string', description: 'New icon (emoji)'},
      color: {type: 'string', description: 'New color (hex)'},
    },
    examples: [
      'linear initiatives update INITIATIVE_ID --status Completed',
      'linear initiatives update INITIATIVE_ID --name "New Name"',
    ],
  },
  'initiatives delete': {
    description: 'Delete an initiative (moves to trash)',
    args: {id: {description: 'Initiative ID', required: true}},
    flags: {},
    examples: ['linear initiatives delete INITIATIVE_ID'],
  },
  'initiatives archive': {
    description: 'Archive or unarchive an initiative',
    args: {id: {description: 'Initiative ID', required: true}},
    flags: {
      unarchive: {type: 'boolean', char: 'u', description: 'Unarchive instead of archive'},
    },
    examples: ['linear initiatives archive INITIATIVE_ID', 'linear initiatives archive INITIATIVE_ID --unarchive'],
  },

  // Config
  'config set': {
    description: 'Set a configuration value',
    args: {
      key: {description: 'Config key', required: true},
      value: {description: 'Config value', required: true},
    },
    flags: {},
    examples: ['linear config set default-team-id TEAM_UUID', 'linear config set default-team-key MITO'],
  },
  'config get': {
    description: 'Get a configuration value',
    args: {key: {description: 'Config key', required: true}},
    flags: {},
    examples: ['linear config get default-team-id'],
  },
  'config list': {
    description: 'List all configuration values',
    flags: {},
    examples: ['linear config list'],
  },

  // Other
  me: {
    description: 'Get current user info',
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear me'],
  },
  // Cycles
  'cycles list': {
    description: 'List cycles (sprints)',
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      'team-id': {type: 'string', description: 'Filter by team ID'},
      team: {type: 'string', description: 'Filter by team key (e.g., ENG)'},
      active: {type: 'boolean', description: 'Show only active cycles'},
      upcoming: {type: 'boolean', description: 'Show only upcoming cycles'},
      completed: {type: 'boolean', description: 'Show only completed cycles'},
      first: {type: 'number', description: 'Number of results'},
    },
    examples: ['linear cycles list', 'linear cycles list --team ENG', 'linear cycles list --active'],
  },
  'cycles get': {
    description: 'Get cycle (sprint) details',
    args: {id: {description: 'Cycle ID', required: true}},
    flags: {format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'}},
    examples: ['linear cycles get CYCLE_ID'],
  },
  'cycles current': {
    description: 'Get the current active cycle for a team',
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      'team-id': {type: 'string', description: 'Team ID'},
      team: {type: 'string', description: 'Team key (e.g., ENG)'},
    },
    examples: ['linear cycles current --team ENG'],
  },

  // Other
  search: {
    description: 'Search for issues',
    args: {query: {description: 'Search query', required: true}},
    flags: {
      format: {type: 'string', options: ['json', 'table', 'plain'], default: 'json'},
      first: {type: 'number', description: 'Number of results'},
    },
    examples: ['linear search "bug fix"'],
  },
  open: {
    description: 'Open issue/project in browser',
    args: {id: {description: 'Issue identifier (e.g., ENG-123)', required: true}},
    flags: {},
    examples: ['linear open ENG-123'],
  },
  query: {
    description: 'Execute raw GraphQL query',
    flags: {
      query: {type: 'string', char: 'q', description: 'GraphQL query', required: true},
      variables: {type: 'string', char: 'v', description: 'JSON variables'},
    },
    examples: ['linear query --query "{ viewer { id name } }"'],
  },
  schema: {
    description: 'Show entity schema info',
    args: {entity: {description: 'Entity name (issues, projects, etc.)'}},
    flags: {
      full: {type: 'boolean', description: 'Show full schema for all entities'},
      'include-examples': {type: 'boolean', description: 'Include usage examples'},
    },
    examples: ['linear schema', 'linear schema issues', 'linear schema --full'],
  },
  upload: {
    description: 'Upload a file to Linear and get the asset URL',
    args: {file: {description: 'Path to the file to upload', required: true}},
    flags: {
      'content-type': {type: 'string', description: 'Override the content type (MIME type)'},
      markdown: {type: 'boolean', char: 'm', description: 'Output as markdown link/image'},
    },
    examples: [
      'linear upload ./screenshot.png',
      'linear upload ./document.pdf --content-type application/pdf',
      'linear upload ./image.png --markdown',
    ],
  },
  info: {
    description: 'Show comprehensive CLI documentation (this command)',
    flags: {
      compact: {type: 'boolean', description: 'Compact output (fewer examples)'},
    },
    examples: ['linear info', 'linear info --compact'],
  },
  setup: {
    description: 'Add Linear CLI instructions to your CLAUDE.md',
    flags: {
      remove: {type: 'boolean', description: 'Remove the section instead'},
    },
    examples: ['linear setup', 'linear setup --remove'],
  },
}

const ENTITY_SCHEMAS = {
  issues: {
    entity: 'issues',
    operations: [
      'list',
      'get',
      'create',
      'update',
      'delete',
      'archive',
      'add-labels',
      'remove-labels',
      'bulk-update',
      'bulk-label',
    ],
    description: 'Work items (bugs, features, tasks)',
    fields: {
      id: 'Unique identifier',
      identifier: 'Human-readable (e.g., ENG-123)',
      title: 'Issue title',
      description: 'Markdown description',
      priority: '0=none, 1=urgent, 2=high, 3=medium, 4=low',
      state: 'Workflow state',
      assignee: 'Assigned user',
      labels: 'Issue labels',
      project: 'Parent project',
      url: 'Linear URL',
    },
  },
  projects: {
    entity: 'projects',
    operations: ['list', 'get', 'create', 'update', 'delete', 'archive'],
    description: 'Group related issues',
    fields: {
      id: 'Unique identifier',
      name: 'Project name',
      description: 'Short description (subtitle)',
      content: 'Long-form markdown description body',
      state: 'planned/started/paused/completed/canceled',
      progress: 'Completion percentage',
      startDate: 'Start date',
      targetDate: 'Target date',
      lead: 'Project lead',
      teams: 'Associated teams',
    },
  },
  cycles: {
    entity: 'cycles',
    operations: ['list', 'get', 'current'],
    description: 'Time-boxed iterations (sprints)',
    fields: {
      id: 'Unique identifier',
      number: 'Cycle number',
      name: 'Cycle name (optional)',
      startsAt: 'Start date',
      endsAt: 'End date',
      progress: 'Completion progress (0-1)',
      team: 'Associated team',
    },
  },
  teams: {
    entity: 'teams',
    operations: ['list'],
    description: 'Organize members and issues',
    fields: {
      id: 'Unique identifier',
      key: 'Team key (e.g., ENG)',
      name: 'Team name',
    },
  },
  users: {
    entity: 'users',
    operations: ['list', 'get', 'me'],
    description: 'Workspace members',
    fields: {
      id: 'Unique identifier',
      name: 'User name',
      email: 'User email',
      displayName: 'Display name',
    },
  },
  labels: {
    entity: 'labels',
    operations: ['list', 'create', 'update', 'delete'],
    description: 'Categorize issues',
    fields: {
      id: 'Unique identifier',
      name: 'Label name',
      color: 'Hex color',
    },
  },
  states: {
    entity: 'states',
    operations: ['list'],
    description: 'Workflow states',
    fields: {
      id: 'Unique identifier',
      name: 'State name',
      type: 'backlog/unstarted/started/completed/canceled',
      color: 'Hex color',
    },
  },
  comments: {
    entity: 'comments',
    operations: ['list', 'add', 'update', 'delete'],
    description: 'Comments on issues',
    fields: {
      id: 'Unique identifier',
      body: 'Markdown body',
      createdAt: 'Creation timestamp',
    },
  },
  documents: {
    entity: 'documents',
    operations: ['list', 'get', 'create', 'update', 'delete'],
    description: 'Rich text documents in Linear',
    fields: {
      id: 'Unique identifier',
      title: 'Document title',
      content: 'Markdown content',
      icon: 'Document icon (emoji)',
      color: 'Document color (hex)',
      project: 'Associated project',
      creator: 'User who created it',
    },
  },
  initiatives: {
    entity: 'initiatives',
    operations: ['list', 'get', 'create', 'update', 'delete', 'archive'],
    description: 'Strategic initiatives grouping projects',
    fields: {
      id: 'Unique identifier',
      name: 'Initiative name',
      description: 'Initiative description',
      status: 'Planned/Active/Completed',
      targetDate: 'Target completion date',
      owner: 'Initiative owner',
      projects: 'Associated projects',
    },
  },
}

const WORKFLOWS = {
  createIssue: {
    description: 'Create a new issue',
    steps: [
      '1. Get team ID: linear teams list',
      '2. (Optional) Get state ID: linear states list --team-id TEAM_ID',
      '3. (Optional) Get label IDs: linear labels list --team-id TEAM_ID',
      '4. Create issue: linear issues create --title "Title" --team-id TEAM_ID',
    ],
  },
  updateIssueState: {
    description: 'Change issue status',
    steps: [
      '1. Get state ID: linear states list --team-id TEAM_ID',
      '2. Update issue: linear issues update ENG-123 --state-id STATE_ID',
    ],
  },
  bulkUpdateIssues: {
    description: 'Update multiple issues at once',
    steps: [
      '1. Get state ID (if needed): linear states list --team-id TEAM_ID',
      '2. Bulk update: linear issues bulk-update --ids ENG-1,ENG-2,ENG-3 --state-id STATE_ID',
    ],
  },
  assignLabels: {
    description: 'Add labels to issues',
    steps: [
      '1. Get label IDs: linear labels list --team-id TEAM_ID',
      '2. Add labels: linear issues add-labels ENG-123 --label-ids LABEL1,LABEL2',
    ],
  },
  createProject: {
    description: 'Create a new project',
    steps: [
      '1. Get team ID: linear teams list',
      '2. Create project: linear projects create --name "Project" --team-ids TEAM_ID',
    ],
  },
}

const CONFIG_KEYS = {
  'default-team-id': {
    description: 'Default team UUID for issue/project creation',
    example: 'd1ad1a80-9267-4ebc-979a-eaf885898a2c',
  },
  'default-team-key': {
    description: 'Default team key for reference',
    example: 'MITO',
  },
}

export default class Info extends Command {
  static override description = 'Show comprehensive CLI documentation for LLM agents'

  static override examples = [
    '<%= config.bin %> info',
    '<%= config.bin %> info --compact',
    '<%= config.bin %> info | jq .data.commands',
  ]

  static override flags = {
    compact: Flags.boolean({
      description: 'Compact output with fewer examples',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Info)

    if (flags.compact) {
      // Compact version: command list with descriptions only
      const compactCommands = Object.entries(COMMANDS).reduce(
        (acc, [name, cmd]) => {
          acc[name] = {
            description: cmd.description,
            ...(cmd.args && {args: cmd.args}),
            flags: cmd.flags,
          }
          return acc
        },
        {} as Record<string, unknown>,
      )

      print(
        success({
          version: '0.7.0',
          commands: compactCommands,
          configKeys: CONFIG_KEYS,
          note: 'Use "linear info" for full documentation with examples and workflows',
        }),
      )
      return
    }

    // Full documentation
    print(
      success({
        version: '0.7.0',
        overview: {
          description: 'CLI for interacting with Linear, designed for LLMs and agents',
          authentication: 'Run "linear auth login" or set LINEAR_API_KEY environment variable',
          outputFormat: 'All commands output JSON by default. Use --format for table/plain.',
          defaults: 'Configure default team with "linear config set default-team-id TEAM_ID"',
        },
        commands: COMMANDS,
        schemas: ENTITY_SCHEMAS,
        workflows: WORKFLOWS,
        configKeys: CONFIG_KEYS,
        tips: [
          'Use issue identifiers (ENG-123) instead of UUIDs when possible',
          'Set default-team-id to skip --team-id on every create command',
          'Use --format plain for scripting (outputs only IDs)',
          'Use bulk-update and bulk-label for batch operations',
          'Pipe to jq for JSON processing: linear issues list | jq ".data[].identifier"',
        ],
      }),
    )
  }
}
