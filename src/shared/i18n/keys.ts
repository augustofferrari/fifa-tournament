export const ValidationMessageKeys = {
  playerNameRequired: 'errors.playerNameRequired',
  tournamentNameRequired: 'errors.tournamentNameRequired',
  tournamentMinPlayers: 'errors.tournamentMinPlayers',
  fixtureAlreadyGenerated: 'errors.fixtureAlreadyGenerated',
  goalsCannotBeNegative: 'errors.goalsCannotBeNegative',
  goalsMustBeWholeNumbers: 'errors.goalsMustBeWholeNumbers',
  removedPlayer: 'errors.removedPlayer',
  knockoutRequiresWinner: 'errors.knockoutRequiresWinner',
  finishedTournamentResultsLocked: 'errors.finishedTournamentResultsLocked',
} as const

export type ValidationMessageKey =
  (typeof ValidationMessageKeys)[keyof typeof ValidationMessageKeys]
