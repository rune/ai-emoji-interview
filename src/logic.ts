import type { GameOverResult, PlayerId, RuneClient } from "rune-sdk"

const QUESTION_TIMER = 20_000
const END_TIMER = 5_000

export type AiMessage = {
  role: string
  content: string
}

export interface GameState {
  emojis: Record<string, string[]>
  questions: Record<string, string[]>
  playerNames: Record<string, string>
  jobTitle: string
  winner: string
  round: number
  started: boolean
  timerTotalTime: number
  timerEndsAt: number
  timerName: string
  prompting: boolean
  messages: AiMessage[]
  conclusion: string
}

const PROMPT =
  "We are playing a game where you act an interviewer for crazy job. Players will respond using only emojis.\n" +
  "You should generate a random crazy funny job. Output the job title on a line starting with Job Title:.\n" +
  "You should then generate a short introduction to the interview for the job applicant on a line starting with Intro:.\n" +
  "I will then provide emojis to answer on lines starting with Player <player name>:. You should not output any lines starting with Player:.\n" +
  "When you receive the emojis you should generate a next step in the interview for each player on lines starting with Answer <player name>:\n" +
  "After you have received 3 inputs from each player you should pick the best applicant based on their responses and output it on a line starting with Winner:\n" +
  "You should also output a congratulations on getting the job message based on the last set of emojis on a line starting with Conclusion:\n" +
  "\n" +
  "Example:\n" +
  "\n" +
  "Job Title: Galactic Animal Whisperer\n" +
  "Intro: Welcome to the interview! We’re hiring for a position with the Intergalactic Animal Conservation Society. This role requires connecting with rare and exotic creatures across the cosmos, soothing them, and understanding their needs.\n" +
  "Player kev: 🦾☘️🥝\n" +
  "Player coke and code: 👹🧖🫃\n" +
  "Player shane helm: 🥝🍧👽\n" +
  "Answer kev: Ah ha, I see you're strong and fruity. I wonder how that will play with the animals. Maybe you'll been bringing an extra zest. How would you approach difficult animals with your style?" +
  "Answer coke and code:: Ah, I see a natural approach here! You have a refreshing calmness and a gentle presence, perfect for creatures with complex sensitivities. Tell me, how would you approach building trust with an alien species known for being cautious around new environments?" +
  "Answer shane helm: Well there aren't many frozen aliens but I'm sure the you'll find something of interest. So, how would you handle the hot blooded animals in your care?" +
  "Player kev: 🫶🧠👀\n" +
  "Player coke and code: 🧑‍🦱💂‍♀️🕵️\n" +
  "Player shane helm: 👳🏻‍♀️👨🏼‍🎨✌🏼\n" +
  "Winner: kev\n" +
  "Conclusion: Congratulations kev and welcome to our team. I'm sure you'll be a fantastic additional to the animal whispering team!" +
  "\n" +
  "You must also provide a winner and conclusion after you have provided answers twice."

function startTimer(game: GameState, name: string, length: number) {
  game.timerName = name
  game.timerTotalTime = length
  game.timerEndsAt = Rune.gameTime() + length
}

type GameActions = {
  respond: (params: { name: string; emojis: string }) => void
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
      prompting: false,
      jobTitle: "",
      messages: [],
      playerNames: {},
      conclusion: "",
    }
  },
  events: {
    playerJoined: () => {},
    playerLeft: () => {},
  },
  ai: {
    promptResponse: ({ response }, { game, allPlayerIds }) => {
      game.prompting = false
      game.messages.push({ role: "assistant", content: response })
      const lines = response.split("\n")
      for (const line of lines) {
        if (line.startsWith("Job Title:")) {
          game.jobTitle = line.substring(line.indexOf(":") + 1).trim()
        }
        if (line.startsWith("Intro:")) {
          game.round = 0
          for (const id of allPlayerIds) {
            if (!game.questions[id]) {
              game.questions[id] = []
            }
            game.questions[id][game.round] = line
              .substring(line.indexOf(":") + 1)
              .trim()
          }
          startTimer(game, "question", QUESTION_TIMER)
        }
        if (line.startsWith("Answer ")) {
          const name = line.substring(line.indexOf(" ") + 1, line.indexOf(":"))
          const answer = line.substring(line.indexOf(":") + 1).trim()

          for (const id of allPlayerIds) {
            if (
              (game.playerNames[id]?.toLowerCase() ?? "") ===
              name.toLowerCase().trim()
            ) {
              if (!game.questions[id]) {
                game.questions[id] = []
              }
              game.questions[id][game.round] = answer
            }
          }
          startTimer(game, "question", QUESTION_TIMER)
        }
        if (line.startsWith("Winner:")) {
          const name = line.substring(line.indexOf(":") + 1).trim()

          for (const id of allPlayerIds) {
            if (
              (game.playerNames[id]?.toLowerCase() ?? "") ===
              name.toLowerCase().trim()
            ) {
              game.winner = id
            }
          }
          startTimer(game, "endgame", END_TIMER)
        }
        if (line.startsWith("Conclusion:")) {
          game.conclusion = line.substring(line.indexOf(":") + 1).trim()
          startTimer(game, "endgame", QUESTION_TIMER)
        }
      }
    },
  },
  updatesPerSecond: 10,
  update: ({ game, allPlayerIds }) => {
    if (game.timerEndsAt !== 0 && game.timerEndsAt < Rune.gameTime()) {
      if (game.timerName === "question") {
        game.timerEndsAt = 0

        game.prompting = true
        let inputs = ""
        for (const id of Object.keys(game.emojis)) {
          if (game.emojis[id]) {
            if (game.emojis[id][game.round]) {
              inputs +=
                "Player " +
                game.playerNames[id] +
                ": " +
                game.emojis[id][game.round] +
                "\n"
            } else {
              inputs = "Player " + game.playerNames[id] + ": ❤️❤️❤️\n"
            }
          }
        }
        game.messages.push({ role: "system", content: inputs })
        Rune.ai.promptRequest({
          messages: JSON.parse(JSON.stringify(game.messages)),
        })
        game.round++
      } else if (game.timerName === "endgame") {
        const options: Record<PlayerId, GameOverResult> = {}
        for (const id of allPlayerIds) {
          options[id] = game.winner === id ? "WON" : "LOST"
        }
        Rune.gameOver({ players: options, minimizePopUp: true })
      }
    }
  },
  actions: {
    start: (_, { game }) => {
      if (!game.started) {
        game.started = true
        game.prompting = true
        game.messages.push({ role: "system", content: PROMPT })
        Rune.ai.promptRequest({
          messages: JSON.parse(JSON.stringify(game.messages)),
        })
      }
    },
    respond: ({ name, emojis }, { game, playerId }) => {
      if (!game.emojis[playerId]) {
        game.emojis[playerId] = []
      }
      game.playerNames[playerId] = name
      game.emojis[playerId][game.round] = emojis
    },
  },
})
