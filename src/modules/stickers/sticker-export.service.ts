import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { ValidationError } from './sticker.validation'

const STICKERS_FOLDER = 'stickers'
const PNG_DATA_URL_PATTERN = /^data:image\/png;base64,/

export class StickerExportService {
  private userDataPath: string | null = null

  initialize(userDataPath: string): void {
    this.userDataPath = userDataPath
    this.ensureStickersDirectory()
  }

  get stickersDirectory(): string {
    if (!this.userDataPath) {
      throw new Error('StickerExportService has not been initialized.')
    }

    return join(this.userDataPath, STICKERS_FOLDER)
  }

  ensureStickersDirectory(): void {
    mkdirSync(this.stickersDirectory, { recursive: true })
  }

  savePngFromDataUrl(dataUrl: string): string {
    if (!PNG_DATA_URL_PATTERN.test(dataUrl)) {
      throw new ValidationError('Sticker export must be a PNG data URL')
    }

    const base64Data = dataUrl.replace(PNG_DATA_URL_PATTERN, '')
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.length === 0) {
      throw new ValidationError('Sticker export image data is empty')
    }

    this.ensureStickersDirectory()

    const destinationPath = join(this.stickersDirectory, `${randomUUID()}.png`)
    writeFileSync(destinationPath, buffer)

    return destinationPath
  }

  isManagedStickerPath(imagePath: string): boolean {
    const resolvedImagePath = resolve(imagePath)
    const resolvedStickersDirectory = resolve(this.stickersDirectory)

    return (
      resolvedImagePath === resolvedStickersDirectory ||
      resolvedImagePath.startsWith(`${resolvedStickersDirectory}${sep}`)
    )
  }

  deleteImageIfManaged(imagePath: string | null): void {
    if (!imagePath || !this.isManagedStickerPath(imagePath) || !existsSync(imagePath)) {
      return
    }

    unlinkSync(imagePath)
  }

  getImageUrl(imagePath: string | null): string | null {
    if (!imagePath || !this.isManagedStickerPath(imagePath) || !existsSync(imagePath)) {
      return null
    }

    return pathToFileURL(imagePath).href
  }

  clearAllStoredImages(): void {
    this.ensureStickersDirectory()

    for (const entry of readdirSync(this.stickersDirectory)) {
      unlinkSync(join(this.stickersDirectory, entry))
    }
  }
}

export const stickerExportService = new StickerExportService()

export function initializeStickerExportService(userDataPath: string): void {
  stickerExportService.initialize(userDataPath)
}
