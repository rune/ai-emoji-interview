import "./styles.css"
import { createPicker, darkTheme, InMemoryStoreFactory } from "picmo"
import musicUrl from "./assets/music.mp3"

const music = new Audio()
music.src = musicUrl
music.loop = true

music.play()

let started = false
let currentScreen = "startScreen"

function div(id: string): HTMLDivElement {
  return document.getElementById(id) as HTMLDivElement
}

document.body.addEventListener("click", () => {
  music.play()

  if (!started) {
    started = true
    Rune.actions.start()
  }
})

let pickerSelected = 1
let winner = ""

let selectedEmoji: string[] = ["", "", ""]

const picker = createPicker({
  rootElement: div("emojiPicker"),
  className: "emojiPicker",
  dataStore: InMemoryStoreFactory,
  theme: darkTheme,
  showSearch: false,
})
picker.addEventListener("emoji:select", (e) => {
  if (e.emoji.length > 0) {
    selectedEmoji[pickerSelected - 1] = e.emoji
    Rune.actions.respond({
      name: localPlayerName,
      emojis: selectedEmoji.join(""),
    })
    div("emojiPickerBackground").style.display = "none"
  }
})
div("emojiPicker").addEventListener("click", (e) => {
  e.stopPropagation()
})
div("emojiPickerBackground").addEventListener("click", () => {
  div("emojiPickerBackground").style.display = "none"
})

div("picker1").addEventListener("click", () => {
  pickerSelected = 1
  div("emojiPickerBackground").style.display = "block"
})
div("picker2").addEventListener("click", () => {
  pickerSelected = 2
  div("emojiPickerBackground").style.display = "block"
})
div("picker3").addEventListener("click", () => {
  pickerSelected = 3
  div("emojiPickerBackground").style.display = "block"
})

function showScreen(screen: string) {
  if (screen !== currentScreen) {
    div(currentScreen).classList.add("disabled")
    div(currentScreen).classList.remove("enabled")

    currentScreen = screen

    div(currentScreen).classList.remove("off")
    div(currentScreen).classList.remove("disabled")
    div(currentScreen).classList.add("enabled")
  }
}

let localPlayerName = ""

Rune.initClient({
  onChange: ({ game, event, yourPlayerId }) => {
    if (event && event.name === "stateSync" && event.isNewGame) {
      started = false
      showScreen("startScreen")
    }

    if (yourPlayerId) {
      localPlayerName = Rune.getPlayerInfo(yourPlayerId).displayName
    }

    started = game.started

    if (game.started) {
      div("picker1").innerHTML = selectedEmoji[0]
      div("picker2").innerHTML = selectedEmoji[1]
      div("picker3").innerHTML = selectedEmoji[2]

      const remaining = game.timerEndsAt - Rune.gameTime()
      const percent = (Math.max(0, remaining) / game.timerTotalTime) * 100 + "%"
      if (game.prompting) {
        showScreen("thinkingScreen")
      } else if (game.timerName === "question") {
        if (currentScreen !== "questionScreen") {
          selectedEmoji = ["", "", ""]
          div("picker1").innerHTML = selectedEmoji[0]
          div("picker2").innerHTML = selectedEmoji[1]
          div("picker3").innerHTML = selectedEmoji[2]
        }
        if (yourPlayerId && game.questions[yourPlayerId]) {
          div("questionTimerBar").style.width = percent
          div("jobName").innerHTML = game.jobTitle
          div("questionText").innerHTML =
            game.questions[yourPlayerId][game.round]
          showScreen("questionScreen")
        }
      } else if (game.timerName === "endgame") {
        if (game.winner !== winner) {
          winner = game.winner
          // do the update for the winner
          div("resultPanelTitle").innerHTML =
            "🥳 " +
            (Rune.getPlayerInfo(game.winner)?.displayName ?? "") +
            " got the job!"
          div("resultPanelContent").innerHTML = ""

          for (let i = 0; i <= game.round; i++) {
            const prompt = game.questions[game.winner]?.[i] ?? ""
            const answer = game.emojis[game.winner]?.[i] ?? ""
            const promptDiv = document.createElement("div")
            promptDiv.innerHTML = prompt
            div("resultPanelContent").appendChild(promptDiv)
            promptDiv.classList.add("resultText")
            const answerDiv = document.createElement("div")
            answerDiv.innerHTML = answer
            div("resultPanelContent").appendChild(answerDiv)
            answerDiv.classList.add("resultEmojis")
          }
          const conclusionDiv = document.createElement("div")
          conclusionDiv.innerHTML = game.conclusion
          div("resultPanelContent").appendChild(conclusionDiv)
          conclusionDiv.classList.add("resultText")
        }
        showScreen("resultScreen")
      }
    }
  },
})
