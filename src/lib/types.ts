/**
 * Standard output types for all CLI commands.
 * All outputs are JSON-formatted for easy parsing by LLMs.
 */

/**
 * Output format for CLI commands.
 * - json: Machine-readable JSON (default, for LLMs/scripts)
 * - table: Human-readable colored table
 * - plain: Minimal output (IDs/identifiers only)
 */
export type OutputFormat = 'json' | 'table' | 'plain'

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor?: string
  endCursor?: string
}

export interface SuccessResponse<T> {
  success: true
  data: T
}

export interface SuccessListResponse<T> {
  success: true
  data: T[]
  pageInfo?: PageInfo
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type CommandResponse<T> = SuccessResponse<T> | ErrorResponse
export type CommandListResponse<T> = SuccessListResponse<T> | ErrorResponse

export interface ConfigDefaults {
  teamId?: string
  teamKey?: string
}

export interface ConfigFile {
  apiKey?: string
  defaults?: ConfigDefaults
  /** @deprecated Use defaults.teamId instead */
  defaultTeamId?: string
}
