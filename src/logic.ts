import type { PlayerId, RuneClient } from "rune-sdk"

export type Cells = (PlayerId | null)[]
export interface GameState {
  emojis: Record<string, string[]>
  questions: Record<string, string[]>
  winner: string
  round: number
  started: boolean
  timerTotalTime: number
  timerEndsAt: number
  timerName: string
}

function startTimer(game: GameState, name: string, length: number) {
  game.timerName = name
  game.timerTotalTime = length
  game.timerEndsAt = Rune.gameTime() + length
}

type GameActions = {
  respond: (emojis: string) => void
  start: () => void
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

Rune.initLogic({
  minPlayers: 1,
  maxPlayers: 6,
  setup: () => {
    return {
      emojis: {},
      questions: {},
      winner: "",
      round: 0,
      started: false,
      timerEndsAt: 0,
      timerTotalTime: 0,
      timerName: "",
    }
  },
  actions: {
    start: (_, { game }) => {
      if (!game.started) {
        game.started = true
      }
    },
    respond: (emojis, { game, playerId }) => {
      if (!game.emojis[playerId]) {
        game.emojis[playerId] = []
      }
      game.emojis[playerId][game.round] = emojis
    },
  },
})
