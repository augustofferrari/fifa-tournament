import type { Player } from '@shared/types/player'
import type { Sticker } from '@shared/types/sticker'
import {
  playerToStickerEditorValues,
  StickerEditor,
  type StickerEditorValues,
} from './StickerEditor'
import { hasExportedSticker } from './sticker-utils'

interface StickerEditorModalProps {
  player: Player | null
  sticker: Sticker | null
  values: StickerEditorValues
  onChange: (values: StickerEditorValues) => void
  onClose: () => void
  onExportSuccess: (message: string) => void
  onExportError: (message: string) => void
}

export function StickerEditorModal({
  player,
  sticker,
  values,
  onChange,
  onClose,
  onExportSuccess,
  onExportError,
}: StickerEditorModalProps) {
  if (!player) {
    return null
  }

  const isEditing = hasExportedSticker(sticker)
  const title = isEditing ? `Edit Sticker — ${player.name}` : `Create Sticker — ${player.name}`

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
            Close
          </button>
        </div>

        <StickerEditor
          players={[player]}
          values={values}
          onChange={onChange}
          lockPlayer
          exportButtonLabel={isEditing ? 'Re-export PNG' : 'Export PNG'}
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
