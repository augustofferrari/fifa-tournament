import { copyFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { dialog } from 'electron'
import { ValidationError } from './player.validation'

const PHOTOS_FOLDER = 'photos'
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg'])

export class PlayerPhotoService {
  private userDataPath: string | null = null

  initialize(userDataPath: string): void {
    this.userDataPath = userDataPath
    this.ensurePhotosDirectory()
  }

  get photosDirectory(): string {
    if (!this.userDataPath) {
      throw new Error('PlayerPhotoService has not been initialized.')
    }

    return join(this.userDataPath, PHOTOS_FOLDER)
  }

  ensurePhotosDirectory(): void {
    mkdirSync(this.photosDirectory, { recursive: true })
  }

  async selectAndCopyPhoto(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Select player photo',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return this.copyPhotoToStorage(result.filePaths[0]!)
  }

  copyPhotoToStorage(sourcePath: string): string {
    const extension = extname(sourcePath).toLowerCase()

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new ValidationError('Photo must be a PNG, JPG, or JPEG image')
    }

    if (!existsSync(sourcePath)) {
      throw new ValidationError('Selected photo file was not found')
    }

    this.ensurePhotosDirectory()

    const destinationPath = join(this.photosDirectory, `${randomUUID()}${extension}`)
    copyFileSync(sourcePath, destinationPath)

    return destinationPath
  }

  isManagedPhotoPath(photoPath: string): boolean {
    const resolvedPhotoPath = resolve(photoPath)
    const resolvedPhotosDirectory = resolve(this.photosDirectory)

    return (
      resolvedPhotoPath === resolvedPhotosDirectory ||
      resolvedPhotoPath.startsWith(`${resolvedPhotosDirectory}${sep}`)
    )
  }

  getPhotoUrl(photoPath: string | null): string | null {
    if (!photoPath || !this.isManagedPhotoPath(photoPath) || !existsSync(photoPath)) {
      return null
    }

    return pathToFileURL(photoPath).href
  }

  deletePhotoIfManaged(photoPath: string | null): void {
    if (!photoPath || !this.isManagedPhotoPath(photoPath) || !existsSync(photoPath)) {
      return
    }

    unlinkSync(photoPath)
  }
}

export const playerPhotoService = new PlayerPhotoService()

export function initializePlayerPhotoService(userDataPath: string): void {
  playerPhotoService.initialize(userDataPath)
}
