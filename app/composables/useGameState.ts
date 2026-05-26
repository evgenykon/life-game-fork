import type { CellData, RaceData, MapMeta } from "~/utils/game-types"
import { generateMap } from "~/utils/game-map"
import { processTurn } from "~/utils/game-engine"
import { generateHash, clearOldStorage, saveMapToStorage, loadMapFromStorage } from "~/utils/hash"

export const useGameState = () => {
  const mapHash = ref<string | null>(null)
  const mapWidth = ref(0)
  const mapHeight = ref(0)
  const cells = ref<CellData[][] | null>(null)
  const races = ref<RaceData[]>([])
  const meta = ref<MapMeta | null>(null)
  const isRunning = ref(false)
  const isPaused = ref(false)

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
    const oldHash = mapHash.value
    const hash = generateHash()
    clearOldStorage(oldHash)

    const { cells: newCells, races: newRaces, meta: newMeta } = generateMap(width, height, density, raceCount)

    saveMapToStorage(hash, width, height, (x, y) => newCells[y]![x]!, newMeta)

    mapHash.value = hash
    mapWidth.value = width
    mapHeight.value = height
    cells.value = newCells
    races.value = newRaces
    meta.value = newMeta
    isRunning.value = true
    isPaused.value = false

    window.history.replaceState(null, "", `#${hash}`)

    startTimer()
  }

  function loadFromHash(hash: string, width: number, height: number) {
    const loaded = loadMapFromStorage(hash, width, height)
    if (loaded) {
      mapHash.value = hash
      mapWidth.value = width
      mapHeight.value = height
      cells.value = loaded.cells
      races.value = loaded.meta.races
      meta.value = loaded.meta
      isRunning.value = true
      isPaused.value = false
      startTimer()
    } else {
      startGame(width, height, 3, 40)
    }
  }

  function nextTurn() {
    if (!cells.value || !meta.value || !isRunning.value) return
    const result = processTurn(cells.value, races.value, meta.value)
    cells.value = result.cells
    races.value = result.races
    meta.value = result.meta
    if (mapHash.value) {
      saveMapToStorage(mapHash.value, mapWidth.value, mapHeight.value, (x, y) => result.cells[y]![x]!, result.meta)
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
    isRunning.value = false
    isPaused.value = false
  }

  return { mapHash, mapWidth, mapHeight, cells, races, meta, isRunning, isPaused, startGame, loadFromHash, nextTurn, togglePause, stopGame }
}
