import { getBracketRoundLabel, BRACKET_ROUND_DISPLAY_ORDER } from '@shared/tournament/bracket-round.utils'
import {
  BracketSourceType,
  BracketRound,
  type BracketMatch,
} from '@shared/types/bracket-match'
import type {
  BracketParticipantSlot,
  BracketView,
  BracketViewMatch,
  BracketViewRound,
} from '@shared/types/bracket-view'
import type { Match } from '@shared/types/match'
import { resolveBracketMatchParticipants } from './bracket-advancement.calculator'

export function getPendingSourceLabel(
  sourceType: BracketSourceType,
  sourceRef: string | null,
  bracketMatchesById: Map<string, BracketMatch>,
): string {
  if (!sourceRef) {
    return 'TBD'
  }

  switch (sourceType) {
    case BracketSourceType.MATCH_WINNER: {
      const feeder = bracketMatchesById.get(sourceRef)
      return feeder ? `Winner Match ${feeder.bracketPosition}` : 'TBD'
    }
    case BracketSourceType.STANDING_POSITION:
      return `#${sourceRef}`
    case BracketSourceType.GROUP_POSITION: {
      const [groupLetter, position] = sourceRef.split(':')
      return groupLetter && position ? `${groupLetter}${position}` : sourceRef
    }
    case BracketSourceType.PLAYER:
      return 'TBD'
  }
}

export function buildParticipantSlot(
  sourceType: BracketSourceType,
  sourceRef: string | null,
  playerId: string | null,
  score: number | null,
  bracketMatchesById: Map<string, BracketMatch>,
  getPlayerName: (playerId: string) => string,
): BracketParticipantSlot {
  if (playerId) {
    return {
      label: getPlayerName(playerId),
      playerId,
      score,
      isPending: false,
    }
  }

  return {
    label: getPendingSourceLabel(sourceType, sourceRef, bracketMatchesById),
    playerId: null,
    score: null,
    isPending: true,
  }
}

export function buildBracketViewMatch(
  bracketMatch: BracketMatch,
  matchesById: Map<string, Match>,
  bracketMatchesById: Map<string, BracketMatch>,
  getPlayerName: (playerId: string) => string,
  canEnterResults: boolean,
): BracketViewMatch {
  const match = bracketMatch.matchId ? matchesById.get(bracketMatch.matchId) ?? null : null

  let homePlayerId: string | null = null
  let awayPlayerId: string | null = null
  let homeScore: number | null = null
  let awayScore: number | null = null
  let status: BracketViewMatch['status'] = 'pending'

  if (match) {
    homePlayerId = match.homePlayerId
    awayPlayerId = match.awayPlayerId
    status = match.status

    if (match.status === 'played') {
      homeScore = match.homeGoals
      awayScore = match.awayGoals
    }
  } else {
    const participants = resolveBracketMatchParticipants(bracketMatch, bracketMatchesById)
    homePlayerId = participants.homePlayerId
    awayPlayerId = participants.awayPlayerId
  }

  return {
    bracketMatchId: bracketMatch.id,
    bracketRound: bracketMatch.bracketRound,
    bracketPosition: bracketMatch.bracketPosition,
    matchId: bracketMatch.matchId,
    status,
    home: buildParticipantSlot(
      bracketMatch.homeSourceType,
      bracketMatch.homeSourceRef,
      homePlayerId,
      homeScore,
      bracketMatchesById,
      getPlayerName,
    ),
    away: buildParticipantSlot(
      bracketMatch.awaySourceType,
      bracketMatch.awaySourceRef,
      awayPlayerId,
      awayScore,
      bracketMatchesById,
      getPlayerName,
    ),
    canEnterResult:
      canEnterResults &&
      match !== null &&
      (match.status === 'scheduled' || match.status === 'played'),
  }
}

export function buildBracketView(
  phaseId: string,
  bracketMatches: BracketMatch[],
  matches: Match[],
  getPlayerName: (playerId: string) => string,
  canEnterResults: boolean,
): BracketView {
  if (bracketMatches.length === 0) {
    return { phaseId, rounds: [] }
  }

  const matchesById = new Map(matches.map((match) => [match.id, match]))
  const bracketMatchesById = new Map(bracketMatches.map((entry) => [entry.id, entry]))

  const viewMatches = bracketMatches.map((bracketMatch) =>
    buildBracketViewMatch(
      bracketMatch,
      matchesById,
      bracketMatchesById,
      getPlayerName,
      canEnterResults,
    ),
  )

  const rounds: BracketViewRound[] = BRACKET_ROUND_DISPLAY_ORDER.flatMap((round) => {
    const roundMatches = viewMatches
      .filter((entry) => entry.bracketRound === round)
      .sort((left, right) => left.bracketPosition - right.bracketPosition)

    if (roundMatches.length === 0) {
      return []
    }

    return [
      {
        round,
        label: getBracketRoundLabel(round),
        matches: roundMatches,
      },
    ]
  })

  return { phaseId, rounds }
}

export function getFirstBracketRound(bracketMatches: BracketMatch[]): BracketRound | null {
  for (const round of BRACKET_ROUND_DISPLAY_ORDER) {
    if (bracketMatches.some((entry) => entry.bracketRound === round)) {
      return round
    }
  }

  return null
}
