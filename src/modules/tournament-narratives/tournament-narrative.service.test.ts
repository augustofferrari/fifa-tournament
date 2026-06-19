import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSchemaTables } from '../../database/migrations/schema'
import { MatchRepository } from '../matches/match.repository'
import { PlayerRepository } from '../players/player.repository'
import { TournamentAwardsService } from '../tournament-awards/tournament-awards.service'
import { TournamentPhaseRepository } from '../tournament-phases/tournament-phase.repository'
import { TournamentPhaseService } from '../tournament-phases/tournament-phase.service'
import { TournamentRepository } from '../tournaments/tournament.repository'
import { TournamentNarrativeService } from './tournament-narrative.service'

function createMatchRepository(db: Database.Database, tournamentRepository: TournamentRepository) {
  const tournamentPhaseService = new TournamentPhaseService(
    db,
    tournamentRepository,
    new TournamentPhaseRepository(db),
  )

  return new MatchRepository(db, tournamentRepository, tournamentPhaseService)
}

describe('TournamentNarrativeService', () => {
  let db: Database.Database
  let playerRepository: PlayerRepository
  let tournamentRepository: TournamentRepository
  let matchRepository: MatchRepository
  let tournamentAwardsService: TournamentAwardsService
  let tournamentNarrativeService: TournamentNarrativeService

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
    createSchemaTables(db)
    playerRepository = new PlayerRepository(db)
    tournamentRepository = new TournamentRepository(db)
    matchRepository = createMatchRepository(db, tournamentRepository)
    tournamentAwardsService = new TournamentAwardsService(db, tournamentRepository, matchRepository)
    tournamentNarrativeService = new TournamentNarrativeService(
      db,
      tournamentRepository,
      matchRepository,
      tournamentAwardsService,
    )
  })

  afterEach(() => {
    db.close()
  })

  it('generates a deterministic narrative from tournament data', () => {
    const alice = playerRepository.createPlayer({ name: 'Alice' })
    const bob = playerRepository.createPlayer({ name: 'Bob' })
    const tournament = tournamentRepository.createTournament({ name: 'Finals' })

    tournamentRepository.addPlayersToTournament(tournament.id, [alice.id, bob.id])
    matchRepository.generateFixtureForTournament(tournament.id)

    const [match] = matchRepository.listMatchesByTournament({ tournamentId: tournament.id })
    matchRepository.updateMatchResult(match!.id, 3, 1)

    const narrative = tournamentNarrativeService.getTournamentNarrative(tournament.id)

    expect(narrative.tournamentId).toBe(tournament.id)
    expect(narrative.tournamentName).toBe('Finals')
    expect(narrative.summary).toBe(
      'Finals wrapped up with 2 players, 1 match played and 4 goals scored.',
    )
    expect(narrative.championSummary).toContain('Alice')
    expect(narrative.championSummary).toContain('Bob')
    expect(narrative.topScorerNote).toContain('Alice')
    expect(narrative.topScorerNote).toContain('3 goals')
    expect(narrative.defensivePlayerNote).toContain('Alice')
    expect(narrative.defensivePlayerNote).toContain('1 goal')
  })

  it('throws when the tournament does not exist', () => {
    expect(() => tournamentNarrativeService.getTournamentNarrative('missing-id')).toThrow(
      'Tournament not found: missing-id',
    )
  })
})
