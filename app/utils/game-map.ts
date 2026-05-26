const RESOURCE_WEIGHTS: Partial<Record<ResourceType, number>> = {
  [ResourceType.FIELD]: 15,
  [ResourceType.FOREST]: 15,
  [ResourceType.GRUNT]: 20,
  [ResourceType.ROCK]: 10,
  [ResourceType.MINERAL]: 5,
  [ResourceType.SWAMP]: 10,
  [ResourceType.SAND]: 10,
  [ResourceType.SNOW]: 5,
  [ResourceType.WATER]: 10,
}

function weightedRandom(): ResourceType {
  const entries = Object.entries(RESOURCE_WEIGHTS) as [ResourceType, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [type, weight] of entries) {
    r -= weight
    if (r <= 0) return type
  }
  return ResourceType.GRUNT
}

export function createCell(position: Position, resourceType: ResourceType | null): Cell {
  return {
    position,
    type: resourceType ? CellType.RESOURCE : CellType.SHADOWED,
    resourceType,
    originalResourceType: resourceType,
    resourceAmount: RESOURCE_START_AMOUNT,
    isDepleted: false,
    depletionCycles: 0,
    abandonedCycles: 0,
    ownerId: null,
    fabricOwnerId: null,
    fabricProgress: 0,
    fabricCost: 0,
    fabricComplete: false,
    attackProgress: 0,
    attackedBy: null,
  }
}

export function generateMap(width: number, height: number): Cell[][] {
  const map: Cell[][] = []
  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      const resourceType = weightedRandom()
      row.push(createCell({ x, y }, resourceType))
    }
    map.push(row)
  }
  return map
}

export function getCell(map: Cell[][], pos: Position): Cell | undefined {
  if (pos.y < 0 || pos.y >= map.length) return undefined
  const row = map[pos.y]
  if (!row) return undefined
  if (pos.x < 0 || pos.x >= row.length) return undefined
  return row[pos.x]
}

export function getNeighbors(pos: Position): Position[] {
  return [
    { x: pos.x - 1, y: pos.y },
    { x: pos.x + 1, y: pos.y },
    { x: pos.x, y: pos.y - 1 },
    { x: pos.x, y: pos.y + 1 },
  ]
}

export function getDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function findEmptyEdgeCell(map: Cell[][], ownedPositions: Position[]): Position | null {
  const candidates = new Set<string>()
  for (const pos of ownedPositions) {
    for (const neighbor of getNeighbors(pos)) {
      const cell = getCell(map, neighbor)
      if (cell && !cell.ownerId && cell.type !== CellType.SHADOWED) {
        candidates.add(`${neighbor.x},${neighbor.y}`)
      }
    }
  }
  if (candidates.size === 0) return null
  const arr = Array.from(candidates)
  const parts = arr[Math.floor(Math.random() * arr.length)]!.split(",").map(Number)
  return { x: parts[0] ?? 0, y: parts[1] ?? 0 }
}
