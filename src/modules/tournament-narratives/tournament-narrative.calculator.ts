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
): string {
  const playerCount = standings.length
  const playedMatches = countPlayedMatches(matches)
  const totalGoals = countTotalGoals(matches)

  if (playedMatches === 0) {
    if (playerCount === 0) {
      return `${tournament.name} has not started yet — no players or results on the board.`
    }

    return `${tournament.name} is ready to go with ${playerCount} ${playerCount === 1 ? 'player' : 'players'}, waiting for the first results.`
  }

  const statusPhrase =
    tournament.status === 'finished'
      ? 'wrapped up'
      : tournament.status === 'active'
        ? 'is underway'
        : 'has recorded'

  const goalPhrase =
    totalGoals === 1 ? '1 goal' : `${totalGoals} goals`

  return `${tournament.name} ${statusPhrase} with ${playerCount} ${playerCount === 1 ? 'player' : 'players'}, ${playedMatches} ${playedMatches === 1 ? 'match' : 'matches'} played and ${goalPhrase} scored.`
}

function buildChampionSummary(
  tournament: Tournament,
  standings: StandingRow[],
  awards: TournamentAwards,
  matches: Match[],
): string {
  if (countPlayedMatches(matches) === 0) {
    return 'The title race has not begun — no champion can be crowned yet.'
  }

  const championRow = awards.champion
    ? standingRow(standings, awards.champion.playerId)
    : standings[0] ?? null

  if (!championRow) {
    return `${tournament.name} produced results, but no clear leader emerged from the standings.`
  }

  const championName = awards.champion?.playerName ?? championRow.playerName
  const record = `${championRow.won}W-${championRow.drawn}D-${championRow.lost}L`
  const goalLine = `${championRow.goalsFor} scored and ${championRow.goalsAgainst} conceded`

  if (tournament.status === 'finished' || awards.champion) {
    const runnerUpName = awards.runnerUp?.playerName

    if (runnerUpName) {
      return `${championName} lifted ${tournament.name}, finishing on ${championRow.points} points (${record}, ${goalLine}) and holding off ${runnerUpName} for the crown.`
    }

    return `${championName} lifted ${tournament.name}, finishing on ${championRow.points} points with a ${record} record and ${goalLine}.`
  }

  return `${championName} leads ${tournament.name} on ${championRow.points} points (${record}, ${goalLine}) as the standings favourite.`
}

function buildBiggestSurpriseNote(
  tournament: Tournament,
  standings: StandingRow[],
  awards: TournamentAwards,
  matches: Match[],
): string {
  if (countPlayedMatches(matches) === 0) {
    return 'No surprises yet — the tournament is still waiting for its first result.'
  }

  const upset = findBiggestUpset(standings, matches)

  if (upset) {
    return `${upset.winnerPlayerName} delivered the biggest shock, beating higher-ranked ${upset.loserPlayerName} ${upset.winnerGoals}-${upset.loserGoals} against the standings grain.`
  }

  const championId = awards.champion?.playerId ?? standings[0]?.playerId ?? null

  if (
    awards.mostWins &&
    championId &&
    awards.mostWins.playerId !== championId
  ) {
    const mostWinsRow = standingRow(standings, awards.mostWins.playerId)

    if (mostWinsRow && mostWinsRow.won > 0) {
      return `${awards.mostWins.playerName} won the most matches (${mostWinsRow.won}) yet still missed out on the title — the cruellest near-miss of ${tournament.name}.`
    }
  }

  if (
    awards.biggestWin &&
    championId &&
    awards.biggestWin.winnerPlayerId !== championId
  ) {
    const { winnerPlayerName, loserPlayerName, winnerGoals, loserGoals, goalDifference } =
      awards.biggestWin

    return `${winnerPlayerName}'s ${winnerGoals}-${loserGoals} win over ${loserPlayerName} was the most dominant single result (+${goalDifference}), even without taking the trophy.`
  }

  return `The favourites largely held firm in ${tournament.name} — no single result flipped the expected order.`
}

function buildTopScorerNote(standings: StandingRow[], awards: TournamentAwards, matches: Match[]): string {
  if (countPlayedMatches(matches) === 0) {
    return 'The scoring chart is empty until the first goals go in.'
  }

  if (!awards.topScorer) {
    return 'No player separated themselves in the scoring charts — goals were shared around.'
  }

  const scorerRow = standingRow(standings, awards.topScorer.playerId)

  if (!scorerRow || scorerRow.goalsFor === 0) {
    return 'No player separated themselves in the scoring charts — goals were shared around.'
  }

  const goalLabel = scorerRow.goalsFor === 1 ? '1 goal' : `${scorerRow.goalsFor} goals`

  return `${awards.topScorer.playerName} topped the scoring charts with ${goalLabel} across ${scorerRow.played} ${scorerRow.played === 1 ? 'match' : 'matches'}.`
}

function buildDefensivePlayerNote(
  standings: StandingRow[],
  awards: TournamentAwards,
  matches: Match[],
): string {
  if (countPlayedMatches(matches) === 0) {
    return 'Defensive honours will be decided once the action starts.'
  }

  if (!awards.bestDefense) {
    return 'No standout defensive record emerged from the results.'
  }

  const defenseRow = standingRow(standings, awards.bestDefense.playerId)

  if (!defenseRow || defenseRow.played === 0) {
    return 'No standout defensive record emerged from the results.'
  }

  const concededLabel =
    defenseRow.goalsAgainst === 1 ? '1 goal' : `${defenseRow.goalsAgainst} goals`

  return `${awards.bestDefense.playerName} led the defensive standings, conceding just ${concededLabel} in ${defenseRow.played} ${defenseRow.played === 1 ? 'match' : 'matches'}.`
}

export function generateTournamentNarrative(
  input: GenerateTournamentNarrativeInput,
): TournamentNarrative {
  const { tournament, standings, awards, matches } = input

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    summary: buildTournamentSummary(tournament, standings, matches),
    championSummary: buildChampionSummary(tournament, standings, awards, matches),
    biggestSurprise: buildBiggestSurpriseNote(tournament, standings, awards, matches),
    topScorerNote: buildTopScorerNote(standings, awards, matches),
    defensivePlayerNote: buildDefensivePlayerNote(standings, awards, matches),
  }
}
