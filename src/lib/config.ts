import {homedir} from 'node:os'
import {join} from 'node:path'
import {existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync} from 'node:fs'
import type {ConfigFile, ConfigDefaults} from './types.js'
import {CliError, ErrorCodes} from './errors.js'

const CONFIG_DIR = join(homedir(), '.linear-cli-agents')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

/**
 * Ensure the config directory exists.
 */
const ensureConfigDir = (): void => {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, {recursive: true, mode: 0o700})
  }
}

/**
 * Read the configuration file.
 * @throws {CliError} When config file exists but cannot be parsed.
 */
export const readConfig = (): ConfigFile => {
  if (!existsSync(CONFIG_FILE)) {
    return {}
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(content) as ConfigFile
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new CliError(
        ErrorCodes.CONFIG_ERROR,
        `Failed to parse config file at ${CONFIG_FILE}. Please check the file format or delete it.`,
        {path: CONFIG_FILE},
      )
    }
    throw error
  }
}

/**
 * Write the configuration file atomically.
 * Uses a temp file + rename to prevent corruption.
 */
export const writeConfig = (config: ConfigFile): void => {
  ensureConfigDir()

  const tempFile = join(CONFIG_DIR, `config.json.tmp.${Date.now()}`)

  try {
    writeFileSync(tempFile, JSON.stringify(config, null, 2), {mode: 0o600})
    renameSync(tempFile, CONFIG_FILE)
  } catch (error) {
    try {
      unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }
    throw new CliError(
      ErrorCodes.CONFIG_ERROR,
      `Failed to write config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Get the API key from config or environment.
 * Environment variable LINEAR_API_KEY takes precedence.
 */
export const getApiKey = (): string | undefined => {
  const envKey = process.env.LINEAR_API_KEY
  if (envKey) {
    return envKey
  }
  const config = readConfig()
  return config.apiKey
}

/**
 * Get the API key or throw if not configured.
 * @throws {CliError} When no API key is configured (NOT_AUTHENTICATED).
 */
export const requireApiKey = (): string => {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new CliError(
      ErrorCodes.NOT_AUTHENTICATED,
      'Not authenticated. Run "linear auth login" or set LINEAR_API_KEY environment variable.',
    )
  }
  return apiKey
}

/**
 * Save the API key to config with secure permissions.
 */
export const saveApiKey = (apiKey: string): void => {
  const config = readConfig()
  config.apiKey = apiKey
  writeConfig(config)
}

/**
 * Remove the API key from config.
 */
export const removeApiKey = (): void => {
  const config = readConfig()
  delete config.apiKey
  writeConfig(config)
}

/**
 * Get the config file path (for display purposes).
 */
export const getConfigPath = (): string => CONFIG_FILE

/**
 * Get defaults from config, with migration from legacy defaultTeamId.
 */
export const getDefaults = (): ConfigDefaults => {
  const config = readConfig()

  // Migrate legacy defaultTeamId to defaults.teamId
  if (config.defaultTeamId && !config.defaults?.teamId) {
    return {
      teamId: config.defaultTeamId,
      ...config.defaults,
    }
  }

  return config.defaults ?? {}
}

/**
 * Get the default team ID from config.
 * Returns undefined if not configured.
 */
export const getDefaultTeamId = (): string | undefined => {
  const defaults = getDefaults()
  return defaults.teamId
}

/**
 * Get the default team key from config.
 * Returns undefined if not configured.
 */
export const getDefaultTeamKey = (): string | undefined => {
  const defaults = getDefaults()
  return defaults.teamKey
}

/**
 * Set a default configuration value.
 */
export const setDefault = (key: keyof ConfigDefaults, value: string | undefined): void => {
  const config = readConfig()

  if (!config.defaults) {
    config.defaults = {}
  }

  if (value === undefined) {
    delete config.defaults[key]
  } else {
    config.defaults[key] = value
  }

  // Clean up legacy field if we're setting teamId
  if (key === 'teamId' && config.defaultTeamId) {
    delete config.defaultTeamId
  }

  writeConfig(config)
}

/**
 * Remove a default configuration value.
 */
export const removeDefault = (key: keyof ConfigDefaults): void => {
  setDefault(key, undefined)
}

/**
 * Valid configuration keys that can be set.
 */
export const CONFIG_KEYS = ['default-team-id', 'default-team-key'] as const
export type ConfigKey = (typeof CONFIG_KEYS)[number]

/**
 * Map config key to internal defaults key.
 */
export const configKeyToDefaultsKey = (key: ConfigKey): keyof ConfigDefaults => {
  const mapping: Record<ConfigKey, keyof ConfigDefaults> = {
    'default-team-id': 'teamId',
    'default-team-key': 'teamKey',
  }
  return mapping[key]
}

/**
 * Check if a key is a valid config key.
 */
export const isValidConfigKey = (key: string): key is ConfigKey => {
  return CONFIG_KEYS.includes(key as ConfigKey)
}
