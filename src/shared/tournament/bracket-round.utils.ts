import { BracketRound } from '@shared/types/bracket-match'

export function getBracketRoundLabel(round: BracketRound): string {
  switch (round) {
    case BracketRound.FINAL:
      return 'Final'
    case BracketRound.SEMIFINAL:
      return 'Semifinals'
    case BracketRound.QUARTERFINAL:
      return 'Quarterfinals'
    case BracketRound.ROUND_OF_16:
      return 'Round of 16'
  }
}

export const BRACKET_ROUND_DISPLAY_ORDER: BracketRound[] = [
  BracketRound.ROUND_OF_16,
  BracketRound.QUARTERFINAL,
  BracketRound.SEMIFINAL,
  BracketRound.FINAL,
]
