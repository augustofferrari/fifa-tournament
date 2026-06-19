export const MIN_TOURNAMENT_PLAYERS = 2

export const ValidationMessages = {
  playerNameRequired: 'Player name is required.',
  tournamentNameRequired: 'Tournament name is required.',
  tournamentMinPlayers: 'Select at least 2 players for a tournament.',
  fixtureAlreadyGenerated: 'A fixture has already been generated for this tournament.',
  goalsCannotBeNegative: 'Goals cannot be negative.',
  goalsMustBeWholeNumbers: 'Enter whole numbers of zero or more for both scores.',
  removedPlayer: 'Removed player',
} as const
