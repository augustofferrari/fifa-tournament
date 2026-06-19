import { useEffect, useState } from 'react'
import type { TournamentNarrative } from '@shared/types/tournament-narrative'

interface TournamentSummarySectionProps {
  tournamentId: string
  refreshTrigger?: unknown
}

interface NarrativeBlock {
  key: string
  label: string
  text: string
}

function buildNarrativeBlocks(narrative: TournamentNarrative): NarrativeBlock[] {
  return [
    { key: 'champion', label: 'Champion', text: narrative.championSummary },
    { key: 'surprise', label: 'Biggest surprise', text: narrative.biggestSurprise },
    { key: 'scorer', label: 'Top scorer', text: narrative.topScorerNote },
    { key: 'defense', label: 'Defense', text: narrative.defensivePlayerNote },
  ]
}

function formatNarrativeForCopy(narrative: TournamentNarrative): string {
  const blocks = buildNarrativeBlocks(narrative)

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
  }, [tournamentId, refreshTrigger])

  async function handleCopy() {
    if (!narrative) {
      return
    }

    try {
      await navigator.clipboard.writeText(formatNarrativeForCopy(narrative))
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  const copyLabel =
    copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy summary'

  if (isLoading && !narrative) {
    return (
      <div className="card tournament-detail__summary">
        <h2 className="tournament-detail__section-title">Tournament Summary</h2>
        <p className="tournament-detail__empty">Generating summary…</p>
      </div>
    )
  }

  if (!narrative) {
    return null
  }

  const blocks = buildNarrativeBlocks(narrative)

  return (
    <div className="card tournament-detail__summary">
      <div className="tournament-summary__header">
        <h2 className="tournament-detail__section-title">Tournament Summary</h2>
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
