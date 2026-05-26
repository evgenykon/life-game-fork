import { CellType, ResourceType, RACE_COLORS, randomPriorities } from "~/utils/game-types"
import type { CellData, Position, RaceData, MapMeta } from "~/utils/game-types"
import { balance } from "~/utils/balance"

function weightedRandomResource(): ResourceType {
  const entries = Object.entries(balance.RESOURCE_WEIGHTS) as [ResourceType, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [type, weight] of entries) {
    r -= weight
    if (r <= 0) return type
  }
  return ResourceType.GRUNT
}

function createEmptyCell(): CellData {
  return {
    type: CellType.RESOURCE,
    resourceType: ResourceType.SAND,
    resourceAmount: balance.RESOURCE_AMOUNT,
    ownerId: null,
    fabricOwnerId: null,
    fabricProgress: 0,
    fabricCost: 0,
    fabricComplete: false,
    captureProgress: 0,
    captureCost: 0,
    capturedBy: null,
    attackProgress: 0,
    attackedBy: null,
    depletionCycles: 0,
    abandonedCycles: 0,
    isDepleted: false,
  }
}

function createResourceCell(resourceType: ResourceType): CellData {
  return {
    ...createEmptyCell(),
    type: CellType.RESOURCE,
    resourceType,
    resourceAmount: balance.RESOURCE_AMOUNT,
  }
}

function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function generateMap(width: number, height: number, density: number, raceCount: number): { cells: CellData[][]; races: RaceData[]; meta: MapMeta } {
  const cells: CellData[][] = []
  for (let y = 0; y < height; y++) {
    const row: CellData[] = []
    for (let x = 0; x < width; x++) {
      if (Math.random() * 100 < density) {
        row.push(createResourceCell(weightedRandomResource()))
      } else {
        row.push(createEmptyCell())
      }
    }
    cells.push(row)
  }

  const races: RaceData[] = []
  const bases: Position[] = []

  for (let i = 0; i < raceCount; i++) {
    let pos: Position | null = null
    let attempts = 0
    while (attempts < 500) {
      const candidate: Position = {
        x: 1 + Math.floor(Math.random() * (width - 2)),
        y: 1 + Math.floor(Math.random() * (height - 2)),
      }
      attempts++
      const cell = cells[candidate.y]?.[candidate.x]
      if (!cell || cell.type !== CellType.RESOURCE) continue
      if (bases.some((b) => distance(b, candidate) < balance.MIN_RACE_DISTANCE)) continue
      pos = candidate
      break
    }

    if (!pos) {
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const cell = cells[y]?.[x]
          if (cell?.type === CellType.RESOURCE && !bases.some((b) => distance(b, { x, y }) < balance.MIN_RACE_DISTANCE)) {
            pos = { x, y }
            break
          }
        }
        if (pos) break
      }
    }

    if (!pos) continue

    const cell = cells[pos.y]![pos.x]!
    cell.type = CellType.BASE
    cell.resourceType = null
    cell.resourceAmount = 0
    cell.ownerId = `race_${i}`

    const raceColor = RACE_COLORS[i % RACE_COLORS.length]!
    bases.push(pos)
    races.push({
      id: `race_${i}`,
      name: `Race ${i + 1}`,
      color: raceColor.color,
      tintColor: raceColor.tintColor,
      borderColor: raceColor.borderColor,
      priorities: randomPriorities(),
      resources: { ...balance.RACE_START_RESOURCES },
      baseCells: [pos],
      controlledCells: [pos],
      alive: true,
      lastReprioritizeCycle: 0,
      lastWarBoostCycle: -999,
      history: {
        meal: [balance.RACE_START_RESOURCES.meal],
        water: [balance.RACE_START_RESOURCES.water],
        material: [balance.RACE_START_RESOURCES.material],
        territory: [1],
      },
    })
  }

  const meta: MapMeta = {
    width,
    height,
    density,
    raceCount,
    cycle: 0,
    races,
  }

  return { cells, races, meta }
}
