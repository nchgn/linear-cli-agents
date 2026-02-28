import {Args, Command, Flags} from '@oclif/core'
import {readFileSync, statSync, existsSync} from 'node:fs'
import {basename, extname} from 'node:path'
import {getClient} from '../lib/client.js'
import {success, print} from '../lib/output.js'
import {handleError, CliError, ErrorCodes} from '../lib/errors.js'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
}

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  return MIME_TYPES[ext] ?? 'application/octet-stream'
}

export default class Upload extends Command {
  static override description = 'Upload a file to Linear and get the asset URL'

  static override examples = [
    '<%= config.bin %> upload ./screenshot.png',
    '<%= config.bin %> upload ./document.pdf --content-type application/pdf',
    '<%= config.bin %> upload ./image.png --markdown',
  ]

  static override args = {
    file: Args.string({
      description: 'Path to the file to upload',
      required: true,
    }),
  }

  static override flags = {
    'content-type': Flags.string({
      description: 'Override the content type (MIME type)',
    }),
    markdown: Flags.boolean({
      char: 'm',
      description: 'Output as markdown link/image',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    try {
      const {args, flags} = await this.parse(Upload)
      const client = getClient()

      const filePath = args.file
      if (!existsSync(filePath)) {
        throw new CliError(ErrorCodes.NOT_FOUND, `File not found: ${filePath}`)
      }

      const stats = statSync(filePath)
      if (!stats.isFile()) {
        throw new CliError(ErrorCodes.INVALID_INPUT, `Not a file: ${filePath}`)
      }

      const fileName = basename(filePath)
      const contentType = flags['content-type'] ?? getMimeType(filePath)
      const fileSize = stats.size

      const uploadPayload = await client.fileUpload(contentType, fileName, fileSize)

      if (!uploadPayload.success || !uploadPayload.uploadFile) {
        throw new CliError(ErrorCodes.API_ERROR, 'Failed to request upload URL')
      }

      const {uploadUrl, assetUrl} = uploadPayload.uploadFile
      const uploadHeaders = uploadPayload.uploadFile.headers

      const fileContent = readFileSync(filePath)

      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      }
      for (const {key, value} of uploadHeaders) {
        headers[key] = value
      }

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: fileContent,
      })

      if (!response.ok) {
        throw new CliError(ErrorCodes.API_ERROR, `Upload failed: ${response.status} ${response.statusText}`)
      }

      if (flags.markdown) {
        const isImage = contentType.startsWith('image/')
        const markdown = isImage ? `![${fileName}](${assetUrl})` : `[${fileName}](${assetUrl})`
        print(
          success({
            assetUrl,
            markdown,
          }),
        )
      } else {
        print(
          success({
            fileName,
            contentType,
            size: fileSize,
            assetUrl,
          }),
        )
      }
    } catch (err) {
      handleError(err)
      this.exit(1)
    }
  }
}
