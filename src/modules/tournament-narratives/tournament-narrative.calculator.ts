import { translate, type Locale, DEFAULT_LOCALE } from '@shared/i18n'
import type { Match } from '@shared/types/match'
import type { StandingRow } from '@shared/types/standings'
import type { Tournament } from '@shared/types/tournament'
import type { TournamentAwards } from '@shared/types/tournament-awards'
import type { TournamentNarrative } from '@shared/types/tournament-narrative'

export interface GenerateTournamentNarrativeInput {
  tournament: Tournament
  standings: StandingRow[]
  awards: TournamentAwards
  matches: Match[]
  locale?: Locale
}

interface UpsetResult {
  winnerPlayerId: string
  winnerPlayerName: string
  loserPlayerId: string
  loserPlayerName: string
  winnerGoals: number
  loserGoals: number
  rankGap: number
}

function pluralNarrativeKey(suffix: string, count: number): string {
  return `tournaments.narrative.${suffix}_${count === 1 ? 'one' : 'other'}`
}

function isPlayedMatch(match: Match): boolean {
  return match.status === 'played' && match.homeGoals !== null && match.awayGoals !== null
}

function standingRow(standings: StandingRow[], playerId: string): StandingRow | null {
  return standings.find((row) => row.playerId === playerId) ?? null
}

function countPlayedMatches(matches: Match[]): number {
  return matches.filter(isPlayedMatch).length
}

function countTotalGoals(matches: Match[]): number {
  return matches
    .filter(isPlayedMatch)
    .reduce((total, match) => total + match.homeGoals! + match.awayGoals!, 0)
}

function findBiggestUpset(standings: StandingRow[], matches: Match[]): UpsetResult | null {
  const rankByPlayerId = new Map(
    standings.map((row, index) => [row.playerId, index + 1] as const),
  )
  const nameByPlayerId = new Map(standings.map((row) => [row.playerId, row.playerName]))

  let best: UpsetResult | null = null

  for (const match of matches) {
    if (!isPlayedMatch(match)) {
      continue
    }

    const homeGoals = match.homeGoals!
    const awayGoals = match.awayGoals!

    if (homeGoals === awayGoals) {
      continue
    }

    const homeWon = homeGoals > awayGoals
    const winnerPlayerId = homeWon ? match.homePlayerId : match.awayPlayerId
    const loserPlayerId = homeWon ? match.awayPlayerId : match.homePlayerId
    const winnerRank = rankByPlayerId.get(winnerPlayerId)
    const loserRank = rankByPlayerId.get(loserPlayerId)

    if (winnerRank === undefined || loserRank === undefined || winnerRank <= loserRank) {
      continue
    }

    const rankGap = winnerRank - loserRank
    const candidate: UpsetResult = {
      winnerPlayerId,
      winnerPlayerName: nameByPlayerId.get(winnerPlayerId) ?? winnerPlayerId,
      loserPlayerId,
      loserPlayerName: nameByPlayerId.get(loserPlayerId) ?? loserPlayerId,
      winnerGoals: homeWon ? homeGoals : awayGoals,
      loserGoals: homeWon ? awayGoals : homeGoals,
      rankGap,
    }

    if (
      !best ||
      candidate.rankGap > best.rankGap ||
      (candidate.rankGap === best.rankGap && candidate.winnerGoals - candidate.loserGoals >
        best.winnerGoals - best.loserGoals)
    ) {
      best = candidate
    }
  }

  return best
}

function buildTournamentSummary(
  tournament: Tournament,
  standings: StandingRow[],
  matches: Match[],
  locale: Locale,
): string {
  const playerCount = standings.length
  const playedMatches = countPlayedMatches(matches)
  const totalGoals = countTotalGoals(matches)

  if (playedMatches === 0) {
    if (playerCount === 0) {
      return translate('tournaments.narrative.notStartedNoPlayers', locale, {
        name: tournament.name,
      })
    }

    return translate(pluralNarrativeKey('readyNoResults', playerCount), locale, {
      name: tournament.name,
      count: playerCount,
    })
  }

  const statusKey =
    tournament.status === 'finished'
      ? 'summaryFinished'
      : tournament.status === 'active'
        ? 'summaryActive'
        : 'summaryOther'

  const goalPhrase = translate(pluralNarrativeKey('goal', totalGoals), locale, {
    count: totalGoals,
  })

  return translate(pluralNarrativeKey(statusKey, playerCount), locale, {
    name: tournament.name,
    playerCount,
    matchCount: playedMatches,
    goalPhrase,
  })
}

function buildChampionSummary(
  tournament: Tournament,
  standings: StandingRow[],
  awards: TournamentAwards,
  matches: Match[],
  locale: Locale,
): string {
  if (countPlayedMatches(matches) === 0) {
    return translate('tournaments.narrative.championNotBegun', locale)
  }

  const championRow = awards.champion
    ? standingRow(standings, awards.champion.playerId)
    : standings[0] ?? null

  if (!championRow) {
    return translate('tournaments.narrative.noClearLeader', locale, { name: tournament.name })
  }

  const championName = awards.champion?.playerName ?? championRow.playerName
  const record = translate('tournaments.narrative.recordFormat', locale, {
    won: championRow.won,
    drawn: championRow.drawn,
    lost: championRow.lost,
  })
  const goalLine = translate('tournaments.narrative.goalLine', locale, {
    for: championRow.goalsFor,
    against: championRow.goalsAgainst,
  })

  if (tournament.status === 'finished' || awards.champion) {
    const runnerUpName = awards.runnerUp?.playerName

    if (runnerUpName) {
      return translate('tournaments.narrative.championWithRunnerUp', locale, {
        champion: championName,
        name: tournament.name,
        points: championRow.points,
        record,
        goalLine,
        runnerUp: runnerUpName,
      })
    }

    return translate('tournaments.narrative.championSolo', locale, {
      champion: championName,
      name: tournament.name,
      points: championRow.points,
      record,
      goalLine,
    })
  }

  return translate('tournaments.narrative.championLeading', locale, {
    champion: championName,
    name: tournament.name,
    points: championRow.points,
    record,
    goalLine,
  })
}

function buildBiggestSurpriseNote(
  tournament: Tournament,
  standings: StandingRow[],
  awards: TournamentAwards,
  matches: Match[],
  locale: Locale,
): string {
  if (countPlayedMatches(matches) === 0) {
    return translate('tournaments.narrative.noSurprisesYet', locale)
  }

  const upset = findBiggestUpset(standings, matches)

  if (upset) {
    return translate('tournaments.narrative.biggestUpset', locale, {
      winner: upset.winnerPlayerName,
      loser: upset.loserPlayerName,
      score: `${upset.winnerGoals}-${upset.loserGoals}`,
    })
  }

  const championId = awards.champion?.playerId ?? standings[0]?.playerId ?? null

  if (
    awards.mostWins &&
    championId &&
    awards.mostWins.playerId !== championId
  ) {
    const mostWinsRow = standingRow(standings, awards.mostWins.playerId)

    if (mostWinsRow && mostWinsRow.won > 0) {
      return translate('tournaments.narrative.mostWinsMiss', locale, {
        player: awards.mostWins.playerName,
        count: mostWinsRow.won,
        name: tournament.name,
      })
    }
  }

  if (
    awards.biggestWin &&
    championId &&
    awards.biggestWin.winnerPlayerId !== championId
  ) {
    const { winnerPlayerName, loserPlayerName, winnerGoals, loserGoals, goalDifference } =
      awards.biggestWin

    return translate('tournaments.narrative.biggestWinDominant', locale, {
      winner: winnerPlayerName,
      score: `${winnerGoals}-${loserGoals}`,
      loser: loserPlayerName,
      diff: goalDifference,
    })
  }

  return translate('tournaments.narrative.favouritesHeld', locale, { name: tournament.name })
}

function buildTopScorerNote(
  standings: StandingRow[],
  awards: TournamentAwards,
  matches: Match[],
  locale: Locale,
): string {
  if (countPlayedMatches(matches) === 0) {
    return translate('tournaments.narrative.scoringChartEmpty', locale)
  }

  if (!awards.topScorer) {
    return translate('tournaments.narrative.goalsShared', locale)
  }

  const scorerRow = standingRow(standings, awards.topScorer.playerId)

  if (!scorerRow || scorerRow.goalsFor === 0) {
    return translate('tournaments.narrative.goalsShared', locale)
  }

  return translate(pluralNarrativeKey('topScorer', scorerRow.goalsFor), locale, {
    player: awards.topScorer.playerName,
    goals: scorerRow.goalsFor,
    matches: scorerRow.played,
  })
}

function buildDefensivePlayerNote(
  standings: StandingRow[],
  awards: TournamentAwards,
  matches: Match[],
  locale: Locale,
): string {
  if (countPlayedMatches(matches) === 0) {
    return translate('tournaments.narrative.defensivePending', locale)
  }

  if (!awards.bestDefense) {
    return translate('tournaments.narrative.noDefensiveStandout', locale)
  }

  const defenseRow = standingRow(standings, awards.bestDefense.playerId)

  if (!defenseRow || defenseRow.played === 0) {
    return translate('tournaments.narrative.noDefensiveStandout', locale)
  }

  if (defenseRow.goalsAgainst === 1 && defenseRow.played === 1) {
    return translate('tournaments.narrative.bestDefense_one', locale, {
      player: awards.bestDefense.playerName,
      matches: defenseRow.played,
    })
  }

  if (defenseRow.goalsAgainst === 1) {
    return translate('tournaments.narrative.bestDefense_oneGoal_other', locale, {
      player: awards.bestDefense.playerName,
      matches: defenseRow.played,
    })
  }

  return translate('tournaments.narrative.bestDefense_other', locale, {
    player: awards.bestDefense.playerName,
    goals: defenseRow.goalsAgainst,
    matches: defenseRow.played,
  })
}

export function generateTournamentNarrative(
  input: GenerateTournamentNarrativeInput,
): TournamentNarrative {
  const { tournament, standings, awards, matches, locale = DEFAULT_LOCALE } = input

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    summary: buildTournamentSummary(tournament, standings, matches, locale),
    championSummary: buildChampionSummary(tournament, standings, awards, matches, locale),
    biggestSurprise: buildBiggestSurpriseNote(tournament, standings, awards, matches, locale),
    topScorerNote: buildTopScorerNote(standings, awards, matches, locale),
    defensivePlayerNote: buildDefensivePlayerNote(standings, awards, matches, locale),
  }
}
