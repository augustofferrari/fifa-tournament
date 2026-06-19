import { clearAllApplicationData, getDatabase } from '@database'
import { playerPhotoService } from '@modules/players/player-photo.service'
import { stickerExportService } from '@modules/stickers/sticker-export.service'

export class DatabaseResetService {
  resetAllData(): void {
    clearAllApplicationData(getDatabase())
    playerPhotoService.clearAllStoredPhotos()
    stickerExportService.clearAllStoredImages()
  }
}

export const databaseResetService = new DatabaseResetService()
