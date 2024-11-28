import "./styles.css"
import { createPicker, darkTheme, InMemoryStoreFactory } from "picmo"

let started = false
let currentScreen = "startScreen"

function div(id: string): HTMLDivElement {
  return document.getElementById(id) as HTMLDivElement
}

document.body.addEventListener("click", () => {
  if (!started) {
    started = true
    Rune.actions.start()
  }
})

let pickerSelected = 1

const selectedEmoji: string[] = ["", "", ""]

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
    Rune.actions.respond(selectedEmoji.join(""))
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

Rune.initClient({
  onChange: ({ game, event }) => {
    if (event && event.name === "stateSync" && event.isNewGame) {
      started = false
      showScreen("startScreen")
    }
    started = game.started

    if (game.started) {
      div("picker1").innerHTML = selectedEmoji[0]
      div("picker2").innerHTML = selectedEmoji[1]
      div("picker3").innerHTML = selectedEmoji[2]

      const remaining = game.timerEndsAt - Rune.gameTime()
      const percent = (Math.max(0, remaining) / game.timerTotalTime) * 100 + "%"
      if (game.timerName === "question") {
        div("questionTimerBar").style.width = percent
      }
    }
  },
})
