import type { Player } from '@shared/types/player'
import type { Sticker } from '@shared/types/sticker'
import type { PlayerStickerTierInfo } from '@shared/types/sticker-tier'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import {
  playerToStickerEditorValues,
  StickerEditor,
  type StickerEditorValues,
} from './StickerEditor'
import { hasExportedSticker } from './sticker-utils'

interface StickerEditorModalProps {
  player: Player | null
  sticker: Sticker | null
  playerTierInfo: PlayerStickerTierInfo
  values: StickerEditorValues
  onChange: (values: StickerEditorValues) => void
  onClose: () => void
  onExportSuccess: (message: string, sticker: Sticker) => void
  onExportError: (message: string) => void
}

export function StickerEditorModal({
  player,
  sticker,
  playerTierInfo,
  values,
  onChange,
  onClose,
  onExportSuccess,
  onExportError,
}: StickerEditorModalProps) {
  const { t } = useAppTranslation()

  if (!player) {
    return null
  }

  const isEditing = hasExportedSticker(sticker)
  const title = isEditing
    ? t('stickers.modal.editTitle', { name: player.name })
    : t('stickers.modal.createTitle', { name: player.name })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--wide card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sticker-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticker-editor-modal__header">
          <h2 id="sticker-editor-title" className="modal__title">
            {title}
          </h2>
          <button className="btn btn--ghost btn--sm" type="button" onClick={onClose}>
            {t('stickers.modal.close')}
          </button>
        </div>

        <StickerEditor
          players={[player]}
          values={values}
          playerTierInfo={playerTierInfo}
          onChange={onChange}
          lockPlayer
          exportButtonLabel={
            isEditing ? t('stickers.modal.reExportPng') : t('stickers.modal.exportPng')
          }
          onExportSuccess={onExportSuccess}
          onExportError={onExportError}
        />
      </div>
    </div>
  )
}

export function createEditorValuesForPlayer(
  player: Player,
  sticker: Sticker | null,
): StickerEditorValues {
  return playerToStickerEditorValues(player, sticker)
}
