import type { CellData, RaceData, MapMeta } from "~/utils/game-types"
import { generateMap } from "~/utils/game-map"
import { generateHash, clearOldStorage, saveMapToStorage, loadMapFromStorage } from "~/utils/hash"

export const useGameState = () => {
  const mapHash = ref<string | null>(null)
  const mapWidth = ref(0)
  const mapHeight = ref(0)
  const cells = ref<CellData[][] | null>(null)
  const races = ref<RaceData[]>([])
  const meta = ref<MapMeta | null>(null)
  const isRunning = ref(false)

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

    window.history.replaceState(null, "", `#${hash}`)
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
    } else {
      startGame(width, height, 3, 40)
    }
  }

  return { mapHash, mapWidth, mapHeight, cells, races, meta, isRunning, startGame, loadFromHash }
}
