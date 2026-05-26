import { CellType, RESOURCE_YIELDS, RACE_MAINTENANCE, DEPLETION_RECOVERY_CYCLES, RESOURCE_AMOUNT } from "~/utils/game-types"
import type { CellData, RaceData, MapMeta, Position } from "~/utils/game-types"

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function findCellToStrip(
  race: RaceData,
  cells: CellData[][]
): Position | null {
  const controlled = race.controlledCells
  if (controlled.length === 0) return null

  const bases = race.baseCells
  if (bases.length === 0) return controlled[0]!

  let maxDist = -1
  for (const pos of controlled) {
    const minDist = Math.min(...bases.map((b) => manhattan(b, pos)))
    if (minDist > maxDist) maxDist = minDist
  }

  const frontier = controlled.filter((pos) => {
    const minDist = Math.min(...bases.map((b) => manhattan(b, pos)))
    return minDist === maxDist
  })

  const byPriority = (pos: Position): number => {
    const cell = cells[pos.y]?.[pos.x]
    if (!cell) return 1
    if (cell.isDepleted) return 1
    if (cell.type === CellType.BASE) return 5
    if (cell.fabricComplete) return 4
    if (cell.fabricOwnerId && !cell.fabricComplete) return 3
    return 2
  }

  const sorted = [...frontier].sort((a, b) => byPriority(a) - byPriority(b))
  return sorted[0] ?? null
}

export function processTurn(
  cells: CellData[][],
  races: RaceData[],
  meta: MapMeta
): { cells: CellData[][]; races: RaceData[]; meta: MapMeta } {
  const newMeta = { ...meta, cycle: meta.cycle + 1 }
  const newRaces = races.map((r) => ({
    ...r,
    resources: { ...r.resources },
    baseCells: [...r.baseCells],
    controlledCells: [...r.controlledCells],
  }))
  const newCells = cells.map((row) => row.map((c) => ({ ...c })))

  const cycleDepletion = Math.max(1, Math.floor(newMeta.cycle / 10) + 1)

  for (const race of newRaces) {
    if (!race.alive) continue

    for (const pos of race.controlledCells) {
      const cell = newCells[pos.y]?.[pos.x]
      if (!cell || cell.type !== CellType.RESOURCE || cell.isDepleted || !cell.resourceType) continue

      const yield_ = RESOURCE_YIELDS[cell.resourceType]
      race.resources.meal += yield_.meal
      race.resources.water += yield_.water
      race.resources.material += yield_.material

      cell.resourceAmount -= cycleDepletion
      if (cell.resourceAmount <= 0) {
        cell.resourceAmount = 0
        cell.isDepleted = true
        cell.depletionCycles = 0
      }
    }

    const neededMeal = Math.min(race.resources.meal, RACE_MAINTENANCE.meal)
    const neededWater = Math.min(race.resources.water, RACE_MAINTENANCE.water)
    const neededMaterial = Math.min(race.resources.material, RACE_MAINTENANCE.material)

    race.resources.meal -= neededMeal
    race.resources.water -= neededWater
    race.resources.material -= neededMaterial

    if (neededMeal < RACE_MAINTENANCE.meal || neededWater < RACE_MAINTENANCE.water || neededMaterial < RACE_MAINTENANCE.material) {
      const toStrip = findCellToStrip(race, newCells)
      if (toStrip) {
        const cell = newCells[toStrip.y]![toStrip.x]!
        const isBase = cell.type === CellType.BASE

        cell.ownerId = null
        cell.fabricOwnerId = null
        cell.fabricProgress = 0
        cell.fabricCost = 0
        cell.fabricComplete = false

        if (isBase) {
          cell.type = CellType.RESOURCE
          cell.resourceType = null
          cell.resourceAmount = 0
        }

        race.controlledCells = race.controlledCells.filter(
          (p) => p.x !== toStrip.x || p.y !== toStrip.y
        )
        race.baseCells = race.baseCells.filter(
          (p) => p.x !== toStrip.x || p.y !== toStrip.y
        )

        if (race.baseCells.length === 0) {
          race.alive = false
        }
      }
    }
  }

  for (let y = 0; y < newCells.length; y++) {
    for (let x = 0; x < newCells[y].length; x++) {
      const cell = newCells[y][x]
      if (!cell) continue

      if (cell.isDepleted) {
        cell.depletionCycles++
        if (cell.depletionCycles >= DEPLETION_RECOVERY_CYCLES) {
          cell.isDepleted = false
          cell.depletionCycles = 0
          cell.resourceAmount = RESOURCE_AMOUNT
        }
      }
    }
  }

  newMeta.races = newRaces

  return { cells: newCells, races: newRaces, meta: newMeta }
}
