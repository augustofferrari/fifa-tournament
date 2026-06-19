import { useEffect, useMemo, useState } from 'react'
import type { TournamentNarrative } from '@shared/types/tournament-narrative'
import type { TFunction } from 'i18next'
import { useAppTranslation } from '@renderer/i18n/useLocale'

interface TournamentSummarySectionProps {
  tournamentId: string
  refreshTrigger?: unknown
}

interface NarrativeBlock {
  key: string
  label: string
  text: string
}

function buildNarrativeBlocks(narrative: TournamentNarrative, t: TFunction): NarrativeBlock[] {
  return [
    { key: 'champion', label: t('tournaments.summary.champion'), text: narrative.championSummary },
    {
      key: 'surprise',
      label: t('tournaments.summary.biggestSurprise'),
      text: narrative.biggestSurprise,
    },
    { key: 'scorer', label: t('tournaments.summary.topScorer'), text: narrative.topScorerNote },
    { key: 'defense', label: t('tournaments.summary.defense'), text: narrative.defensivePlayerNote },
  ]
}

function formatNarrativeForCopy(narrative: TournamentNarrative, t: TFunction): string {
  const blocks = buildNarrativeBlocks(narrative, t)

  return [
    narrative.summary,
    '',
    ...blocks.flatMap((block) => [`${block.label}: ${block.text}`, '']),
  ]
    .join('\n')
    .trim()
}

export function TournamentSummarySection({
  tournamentId,
  refreshTrigger,
}: TournamentSummarySectionProps) {
  const { t, locale } = useAppTranslation()
  const [narrative, setNarrative] = useState<TournamentNarrative | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    let cancelled = false

    async function loadNarrative() {
      setIsLoading(true)

      try {
        const data = await window.api.tournaments.getNarrative(tournamentId)

        if (!cancelled) {
          setNarrative(data)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadNarrative()

    return () => {
      cancelled = true
    }
  }, [tournamentId, refreshTrigger, locale])

  async function handleCopy() {
    if (!narrative) {
      return
    }

    try {
      await navigator.clipboard.writeText(formatNarrativeForCopy(narrative, t))
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  const copyLabel =
    copyState === 'copied'
      ? t('tournaments.summary.copied')
      : copyState === 'error'
        ? t('tournaments.summary.copyFailed')
        : t('tournaments.summary.copySummary')

  const blocks = useMemo(
    () => (narrative ? buildNarrativeBlocks(narrative, t) : []),
    [narrative, t],
  )

  if (isLoading && !narrative) {
    return (
      <div className="card tournament-detail__summary">
        <h2 className="tournament-detail__section-title">{t('tournaments.summary.title')}</h2>
        <p className="tournament-detail__empty">{t('tournaments.summary.generating')}</p>
      </div>
    )
  }

  if (!narrative) {
    return null
  }

  return (
    <div className="card tournament-detail__summary">
      <div className="tournament-summary__header">
        <h2 className="tournament-detail__section-title">{t('tournaments.summary.title')}</h2>
        <button
          className="btn btn--ghost btn--sm"
          type="button"
          onClick={() => void handleCopy()}
          disabled={isLoading}
        >
          {copyLabel}
        </button>
      </div>

      <p className="tournament-summary__lead">{narrative.summary}</p>

      <div className="tournament-summary__notes">
        {blocks.map((block) => (
          <article key={block.key} className="tournament-summary__note">
            <h3 className="tournament-summary__note-label">{block.label}</h3>
            <p className="tournament-summary__note-text">{block.text}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
