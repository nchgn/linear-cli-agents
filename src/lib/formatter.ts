import Table from 'cli-table3'
import pc from 'picocolors'
import type {OutputFormat} from './types.js'

/**
 * Check if colors should be disabled.
 * Respects NO_COLOR env var and --no-color flag.
 */
export const shouldDisableColors = (): boolean => {
  return Boolean(process.env.NO_COLOR) || process.argv.includes('--no-color')
}

/**
 * Color utilities that respect NO_COLOR.
 */
const colors = {
  dim: (str: string) => (shouldDisableColors() ? str : pc.dim(str)),
  bold: (str: string) => (shouldDisableColors() ? str : pc.bold(str)),
  cyan: (str: string) => (shouldDisableColors() ? str : pc.cyan(str)),
  green: (str: string) => (shouldDisableColors() ? str : pc.green(str)),
  yellow: (str: string) => (shouldDisableColors() ? str : pc.yellow(str)),
  red: (str: string) => (shouldDisableColors() ? str : pc.red(str)),
  blue: (str: string) => (shouldDisableColors() ? str : pc.blue(str)),
  magenta: (str: string) => (shouldDisableColors() ? str : pc.magenta(str)),
  gray: (str: string) => (shouldDisableColors() ? str : pc.gray(str)),
}

export {colors}

/**
 * Column definition for table formatting.
 */
export interface ColumnDef<T> {
  key: keyof T | string
  header: string
  width?: number
  align?: 'left' | 'center' | 'right'
  format?: (value: unknown, row: T) => string
}

/**
 * Format data as a colored table.
 */
export const formatTable = <T extends Record<string, unknown>>(data: T[], columns: ColumnDef<T>[]): string => {
  if (data.length === 0) {
    return colors.dim('No results found.')
  }

  const colWidths = columns.map((col) => col.width ?? null)
  const table = new Table({
    head: columns.map((col) => colors.bold(col.header)),
    colWidths,
    colAligns: columns.map((col) => col.align ?? 'left'),
    style: {
      head: [],
      border: [],
    },
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: '  ',
    },
  })

  for (const row of data) {
    const cells = columns.map((col) => {
      const value = getNestedValue(row, col.key as string)
      if (col.format) {
        return col.format(value, row)
      }
      return String(value ?? '')
    })
    table.push(cells)
  }

  return table.toString()
}

/**
 * Format data as plain text (one item per line).
 */
export const formatPlain = <T extends Record<string, unknown>>(
  data: T[],
  primaryKey: keyof T = 'id' as keyof T,
  secondaryKey?: keyof T,
): string => {
  if (data.length === 0) {
    return ''
  }

  return data
    .map((item) => {
      const primary = String(item[primaryKey] ?? '')
      if (secondaryKey && item[secondaryKey]) {
        return `${primary}\t${String(item[secondaryKey])}`
      }
      return primary
    })
    .join('\n')
}

/**
 * Format a single item as a key-value table.
 */
export const formatKeyValue = (data: Record<string, unknown>): string => {
  const table = new Table({
    style: {
      head: [],
      border: [],
    },
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: '  ',
    },
  })

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue

    let formattedValue: string
    if (typeof value === 'object') {
      formattedValue = colors.dim(JSON.stringify(value))
    } else {
      formattedValue = String(value)
    }

    table.push([colors.cyan(key), formattedValue])
  }

  return table.toString()
}

/**
 * Get nested value from object using dot notation.
 */
const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

/**
 * Priority label formatter with colors.
 */
export const formatPriority = (priority: number): string => {
  switch (priority) {
    case 0:
      return colors.gray('No priority')
    case 1:
      return colors.red('Urgent')
    case 2:
      return colors.yellow('High')
    case 3:
      return colors.blue('Medium')
    case 4:
      return colors.gray('Low')
    default:
      return String(priority)
  }
}

/**
 * Truncate string to max length with ellipsis.
 */
export const truncate = (str: string | undefined | null, maxLength: number): string => {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '\u2026'
}

/**
 * Format progress as a percentage with color.
 */
export const formatProgress = (progress: number): string => {
  const percent = Math.round(progress * 100)
  if (percent >= 100) return colors.green(`${percent}%`)
  if (percent >= 75) return colors.cyan(`${percent}%`)
  if (percent >= 50) return colors.blue(`${percent}%`)
  if (percent >= 25) return colors.yellow(`${percent}%`)
  return colors.gray(`${percent}%`)
}

/**
 * Generic formatter that outputs data in the specified format.
 */
export const formatOutput = <T extends Record<string, unknown>>(
  format: OutputFormat,
  data: T | T[],
  options: {
    columns?: ColumnDef<T>[]
    primaryKey?: keyof T
    secondaryKey?: keyof T
  } = {},
): string => {
  if (format === 'json') {
    return JSON.stringify(Array.isArray(data) ? data : data, null, 2)
  }

  if (format === 'plain') {
    if (Array.isArray(data)) {
      return formatPlain(data, options.primaryKey, options.secondaryKey)
    }
    return String(data[options.primaryKey ?? ('id' as keyof T)] ?? '')
  }

  if (format === 'table') {
    if (Array.isArray(data)) {
      if (!options.columns) {
        throw new Error('Columns are required for table format')
      }
      return formatTable(data, options.columns)
    }
    return formatKeyValue(data)
  }

  return JSON.stringify(data, null, 2)
}
