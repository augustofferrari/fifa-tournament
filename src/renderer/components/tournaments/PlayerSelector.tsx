import type { Player } from '@shared/types/player'
import { PlayerPhoto } from '@renderer/components/players/PlayerPhoto'
import { useAppTranslation } from '@renderer/i18n/useLocale'
import { displayPlayerName } from '@renderer/i18n/display-utils'

interface PlayerSelectorProps {
  players: Player[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  disabled?: boolean
}

export function PlayerSelector({
  players,
  selectedIds,
  onChange,
  disabled = false,
}: PlayerSelectorProps) {
  const { t } = useAppTranslation()

  function togglePlayer(playerId: string) {
    if (selectedIds.includes(playerId)) {
      onChange(selectedIds.filter((id) => id !== playerId))
      return
    }

    onChange([...selectedIds, playerId])
  }

  if (players.length === 0) {
    return (
      <div className="player-selector player-selector--empty">
        {t('tournaments.playerSelector.empty')}
      </div>
    )
  }

  return (
    <div className="player-selector">
      {players.map((player) => {
        const isSelected = selectedIds.includes(player.id)
        const playerName = displayPlayerName(player.name, t)

        return (
          <label
            key={player.id}
            className={`player-selector__item${isSelected ? ' player-selector__item--selected' : ''}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              disabled={disabled}
              onChange={() => togglePlayer(player.id)}
            />
            <PlayerPhoto photoPath={player.photoPath} alt={playerName} size="sm" />
            <span className="player-selector__info">
              <span className="player-selector__name">{playerName}</span>
              {player.teamName && (
                <span className="player-selector__meta">{player.teamName}</span>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}
