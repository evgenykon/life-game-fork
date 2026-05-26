import { CellType, RESOURCE_YIELDS, RACE_MAINTENANCE, DEPLETION_RECOVERY_CYCLES, RESOURCE_AMOUNT, RESOURCE_CAPTURE_COST, RESOURCE_FABRIC_COST } from "~/utils/game-types"
import type { CellData, RaceData, MapMeta, Position } from "~/utils/game-types"

const DIRS: Position[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
]

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function findExpandTarget(
  race: RaceData,
  cells: CellData[][],
  width: number,
  height: number
): Position | null {
  const candidates: Position[] = []
  const ownedSet = new Set(race.controlledCells.map((p) => `${p.x},${p.y}`))

  for (const pos of race.controlledCells) {
    for (const dir of DIRS) {
      const nx = pos.x + dir.x
      const ny = pos.y + dir.y
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

      const key = `${nx},${ny}`
      if (ownedSet.has(key)) continue

      const cell = cells[ny]?.[nx]
      if (!cell || cell.type !== CellType.RESOURCE) continue
      if (cell.ownerId !== null) continue
      if (cell.captureProgress > 0) continue

      if (!candidates.some((c) => c.x === nx && c.y === ny)) {
        candidates.push({ x: nx, y: ny })
      }
    }
  }

  if (candidates.length === 0) return null

  const bases = race.baseCells
  let best = candidates[0]!
  let bestDist = -1
  for (const c of candidates) {
    let minDist = Infinity
    for (const b of bases) {
      const d = manhattan(b, c)
      if (d < minDist) minDist = d
    }
    if (minDist > bestDist || (minDist === bestDist && Math.random() < 0.5)) {
      bestDist = minDist
      best = c
    }
  }
  return best
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

function tryStartCapture(
  race: RaceData,
  cells: CellData[][],
  width: number,
  height: number
) {
  const target = findExpandTarget(race, cells, width, height)
  if (!target) return
  const cell = cells[target.y]![target.x]!
  const cost = cell.resourceType ? RESOURCE_CAPTURE_COST[cell.resourceType] : 1
  if (cost > 0) {
    cell.captureProgress = 1
    cell.captureCost = cost
    cell.capturedBy = race.id
  }
}

function tryStartFabric(race: RaceData, cells: CellData[][]) {
  let bestCell: { pos: Position; cell: CellData; score: number } | null = null
  for (const pos of race.controlledCells) {
    const cell = cells[pos.y]?.[pos.x]
    if (!cell || cell.fabricOwnerId || cell.type !== CellType.RESOURCE || !cell.resourceType) continue
    const cost = RESOURCE_FABRIC_COST[cell.resourceType]
    if (cost === null || cost <= 0) continue

    const score = RESOURCE_YIELDS[cell.resourceType]
    const isDepleted = cell.isDepleted ? 100 : 0
    const totalScore = score.meal + score.water + score.material * 0.5 + (isDepleted * race.priorities.reinforcement) / 100

    if (!bestCell || totalScore > bestCell.score) {
      bestCell = { pos, cell, score: totalScore }
    }
  }
  if (bestCell) {
    const { pos, cell } = bestCell
    const cost = RESOURCE_FABRIC_COST[cell.resourceType!]!
    cell.fabricOwnerId = race.id
    cell.fabricProgress = 0
    cell.fabricCost = cost
    cell.fabricComplete = false
  }
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

    const width = newCells[0]?.length ?? 0
    const height = newCells.length

    const ownedSet = new Set(race.controlledCells.map((p) => `${p.x},${p.y}`))
    let capturePos: Position | null = null
    for (const pos of race.controlledCells) {
      for (const dir of DIRS) {
        const nx = pos.x + dir.x
        const ny = pos.y + dir.y
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const cell = newCells[ny]?.[nx]
        if (cell && cell.captureProgress > 0 && cell.captureCost > 0 && cell.ownerId === null && cell.capturedBy === race.id) {
          capturePos = { x: nx, y: ny }
          break
        }
      }
      if (capturePos) break
    }

    let activeFabric: Position | null = null
    for (const pos of race.controlledCells) {
      const cell = newCells[pos.y]?.[pos.x]
      if (cell && cell.fabricOwnerId === race.id && !cell.fabricComplete) {
        activeFabric = pos
        break
      }
    }

    if (capturePos) {
      const cell = newCells[capturePos.y]![capturePos.x]!
      cell.captureProgress++
      if (cell.captureProgress >= cell.captureCost) {
        cell.ownerId = race.id
        cell.captureProgress = 0
        cell.captureCost = 0
        cell.capturedBy = null
        race.controlledCells.push(capturePos)
      }
    } else if (activeFabric) {
      const cell = newCells[activeFabric.y]![activeFabric.x]!
      if (race.resources.material >= 1) {
        race.resources.material -= 1
        cell.fabricProgress++
        if (cell.fabricProgress >= cell.fabricCost) {
          cell.fabricComplete = true
        }
      }
    } else {
      const expansionRoll = race.priorities.expansion > 0 && Math.random() * 100 < race.priorities.expansion
      const buildThreshold = Math.max(5, 50 - race.priorities.building * 0.4)
      const canBuild = race.resources.material > buildThreshold

      if (expansionRoll && canBuild) {
        if (Math.random() < race.priorities.building / (race.priorities.expansion + race.priorities.building)) {
          tryStartFabric(race, newCells)
        } else {
          tryStartCapture(race, newCells, width, height)
        }
      } else if (expansionRoll) {
        tryStartCapture(race, newCells, width, height)
      } else if (canBuild) {
        tryStartFabric(race, newCells)
      }
    }

    for (const pos of race.controlledCells) {
      const cell = newCells[pos.y]?.[pos.x]
      if (!cell || cell.isDepleted) continue
      if (cell.fabricOwnerId !== race.id || !cell.fabricComplete) continue
      if (!cell.resourceType) continue

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
        cell.captureProgress = 0
        cell.captureCost = 0
        cell.capturedBy = null

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
