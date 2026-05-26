import type { CellData, RaceData, MapMeta } from "~/utils/game-types"
import { generateMap } from "~/utils/game-map"
import { processTurn } from "~/utils/game-engine"

export const useGameState = () => {
  const cells = ref<CellData[][] | null>(null)
  const races = ref<RaceData[]>([])
  const meta = ref<MapMeta | null>(null)
  const isRunning = ref(false)
  const isPaused = ref(false)
  const gameOver = ref(false)
  const winner = ref<string | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null

  function startTimer() {
    stopTimer()
    timer = setInterval(() => {
      nextTurn()
    }, 1000)
  }

  function stopTimer() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function startGame(width: number, height: number, raceCount: number, density: number) {
    const { cells: newCells, races: newRaces, meta: newMeta } = generateMap(width, height, density, raceCount)

    cells.value = newCells
    races.value = newRaces
    meta.value = newMeta
    isRunning.value = true
    isPaused.value = false
    gameOver.value = false
    winner.value = null

    startTimer()
  }

  function nextTurn() {
    if (!cells.value || !meta.value || !isRunning.value) return
    const result = processTurn(cells.value, races.value, meta.value)
    cells.value = result.cells
    races.value = result.races
    meta.value = result.meta
    if (result.gameOver) {
      gameOver.value = true
      winner.value = result.winner
      stopTimer()
    }
  }

  function togglePause() {
    if (!isRunning.value) return
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      stopTimer()
    } else {
      startTimer()
    }
  }

  function stopGame() {
    stopTimer()
    cells.value = null
    races.value = []
    meta.value = null
    isRunning.value = false
    isPaused.value = false
    gameOver.value = false
    winner.value = null
  }

  return { cells, races, meta, isRunning, isPaused, gameOver, winner, startGame, nextTurn, togglePause, stopGame }
}
