import { CellType } from "~/utils/game-types"
import { balance } from "~/utils/balance"
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

  const deficits = calcDeficits(race)
  const bases = race.baseCells
  let best = candidates[0]!
  let bestDist = -1
  for (const c of candidates) {
    const cell = cells[c.y]![c.x]!
    let minDist = Infinity
    for (const b of bases) {
      const d = manhattan(b, c)
      if (d < minDist) minDist = d
    }

    let resourceBonus = 0
    if (cell.resourceType) {
      const yields = balance.RESOURCE_YIELDS[cell.resourceType]
      resourceBonus = yields.meal * deficits.meal + yields.water * deficits.water + yields.material * deficits.material
    }
    const effectiveDist = minDist + resourceBonus * 0.5

    if (effectiveDist > bestDist || (effectiveDist === bestDist && Math.random() < 0.5)) {
      bestDist = effectiveDist
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

function calcDeficits(race: RaceData): { meal: number; water: number; material: number } {
  const cyclesLeft = {
    meal: race.resources.meal / Math.max(1, balance.RACE_MAINTENANCE.meal),
    water: race.resources.water / Math.max(1, balance.RACE_MAINTENANCE.water),
    material: race.resources.material / Math.max(1, balance.RACE_MAINTENANCE.material),
  }
  return {
    meal: Math.max(0, 10 - cyclesLeft.meal),
    water: Math.max(0, 10 - cyclesLeft.water),
    material: Math.max(0, 10 - cyclesLeft.material),
  }
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
  const cost = cell.resourceType ? balance.RESOURCE_CAPTURE_COST[cell.resourceType] : 1
  if (cost > 0) {
    cell.captureProgress = 1
    cell.captureCost = cost
    cell.capturedBy = race.id
  }
}

function tryStartFabric(race: RaceData, cells: CellData[][]) {
  const deficits = calcDeficits(race)
  let bestCell: { pos: Position; cell: CellData; score: number } | null = null
  for (const pos of race.controlledCells) {
    const cell = cells[pos.y]?.[pos.x]
    if (!cell || cell.fabricOwnerId || cell.type !== CellType.RESOURCE || !cell.resourceType) continue
    const cost = balance.RESOURCE_FABRIC_COST[cell.resourceType]

    if (cost === null || cost <= 0) continue

    const yield_ = balance.RESOURCE_YIELDS[cell.resourceType]
    const deficitScore = yield_.meal * deficits.meal + yield_.water * deficits.water + yield_.material * deficits.material
    const isDepleted = cell.isDepleted ? 100 : 0
    const totalScore = deficitScore + (isDepleted * race.priorities.building) / 100

    if (!bestCell || totalScore > bestCell.score) {
      bestCell = { pos, cell, score: totalScore }
    }
  }
  if (bestCell) {
    const { pos, cell } = bestCell
    const cost = balance.RESOURCE_FABRIC_COST[cell.resourceType!]!
    cell.fabricOwnerId = race.id
    cell.fabricProgress = 0
    cell.fabricCost = cost
    cell.fabricComplete = false
  }
}

function findAttackTarget(
  race: RaceData,
  cells: CellData[][]
): Position | null {
  const ownedSet = new Set(race.controlledCells.map((p) => `${p.x},${p.y}`))
  const candidates: Position[] = []
  const width = cells[0]?.length ?? 0
  const height = cells.length

  for (const pos of race.controlledCells) {
    for (const dir of DIRS) {
      const nx = pos.x + dir.x
      const ny = pos.y + dir.y
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const key = `${nx},${ny}`
      if (ownedSet.has(key)) continue
      const cell = cells[ny]?.[nx]
      if (!cell || cell.ownerId === null || cell.ownerId === race.id) continue
      if (cell.attackProgress > 0 && cell.attackedBy !== race.id) continue
      if (!candidates.some((c) => c.x === nx && c.y === ny)) {
        candidates.push({ x: nx, y: ny })
      }
    }
  }

  if (candidates.length === 0) return null

  const deficits = calcDeficits(race)
  let best = candidates[0]!
  let bestScore = -Infinity
  for (const c of candidates) {
    const cell = cells[c.y]![c.x]!
    let score = 0
    if (cell.type === CellType.BASE) score += 100
    if (cell.fabricComplete) score += 50
    if (cell.fabricOwnerId && !cell.fabricComplete) score += 10
    if (cell.resourceType) {
      const yields = balance.RESOURCE_YIELDS[cell.resourceType]
      score += yields.meal * (1 + deficits.meal) + yields.water * (1 + deficits.water) + yields.material * (2 + deficits.material)
    }
    if (score > bestScore || (score === bestScore && Math.random() < 0.5)) {
      bestScore = score
      best = c
    }
  }
  return best
}

function tryStartAttack(race: RaceData, cells: CellData[][]) {
  const target = findAttackTarget(race, cells)
  if (!target) return
  const cell = cells[target.y]![target.x]!
  cell.attackProgress = 1
  cell.attackedBy = race.id
}

function tryReprioritize(race: RaceData, cycle: number) {
  const threshold = balance.RACE_START_RESOURCES.meal * balance.REPRIORITIZE_THRESHOLD / 100
  const lowMeal = race.resources.meal < threshold
  const lowWater = race.resources.water < threshold
  const lowMaterial = race.resources.material < threshold
  if (!lowMeal && !lowWater && !lowMaterial) return
  if (cycle - race.lastReprioritizeCycle < balance.REPRIORITIZE_COOLDOWN) return

  const p = race.priorities
  const entries: [string, number][] = Object.entries(p) as [string, number][]
  entries.sort(([, a], [, b]) => a - b)
  const lowestKey = entries[0]![0]
  const lowestVal = entries[0]![1]

  let boostKey = "expansion"
  if (lowMaterial) boostKey = "building"
  else if (lowMeal || lowWater) boostKey = "expansion"

  const shift = Math.min(balance.REPRIORITIZE_SHIFT, lowestVal)
  if (shift <= 0) return

  p[lowestKey as keyof typeof p] -= shift
  p[boostKey as keyof typeof p] += shift
  race.lastReprioritizeCycle = cycle
}

function tryBoostWar(race: RaceData, cycle: number, newCells: CellData[][]) {
  if (cycle - race.lastWarBoostCycle < 10) return
  const isUnderAttack = newCells.some((row) =>
    row.some((c) => c.attackProgress > 0 && c.attackedBy !== null && c.ownerId === race.id)
  )
  if (!isUnderAttack) return

  const p = race.priorities
  if (p.expansion < 10 || p.building < 10) return
  p.expansion -= 10
  p.building -= 10
  p.war += 20
  race.lastWarBoostCycle = cycle
}

function tryNormalizeWar(race: RaceData, cycle: number) {
  if (race.lastWarBoostCycle < 0) return
  if (cycle - race.lastWarBoostCycle < 50) return
  const p = race.priorities
  if (p.war <= 30) return
  const excess = p.war - 30
  const half = Math.floor(excess / 2)
  p.war = 30
  p.expansion += half
  p.building += excess - half
  race.lastWarBoostCycle = cycle
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

    let attackPos: Position | null = null
    for (const pos of race.controlledCells) {
      for (const dir of DIRS) {
        const nx = pos.x + dir.x
        const ny = pos.y + dir.y
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const cell = newCells[ny]?.[nx]
        if (cell && cell.attackProgress > 0 && cell.attackedBy === race.id) {
          attackPos = { x: nx, y: ny }
          break
        }
      }
      if (attackPos) break
    }

    for (const pos of race.controlledCells) {
      const cell = newCells[pos.y]?.[pos.x]
      if (cell && cell.fabricOwnerId === race.id && !cell.fabricComplete) {
        if (race.resources.material >= 1) {
          race.resources.material -= 1
          cell.fabricProgress++
          if (cell.fabricProgress >= cell.fabricCost) {
            cell.fabricComplete = true
          }
        }
      }
    }

    if (attackPos) {
      const cell = newCells[attackPos.y]![attackPos.x]!
      if (race.resources.material >= 1) {
        race.resources.material -= 1
        cell.attackProgress++

        const isSurrounded = DIRS.every((d) => {
          const nx = attackPos.x + d.x
          const ny = attackPos.y + d.y
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) return true
          return newCells[ny]![nx]!.ownerId === race.id
        })
        const attackCost = isSurrounded ? balance.LIBERATION_DURATION : balance.ATTACK_DURATION

        if (cell.attackProgress >= attackCost) {
          const defenderId = cell.ownerId!
          cell.ownerId = race.id
          cell.attackProgress = 0
          cell.attackedBy = null
          cell.captureProgress = 0
          cell.captureCost = 0
          cell.capturedBy = null
          race.controlledCells.push(attackPos)

          const defender = newRaces.find((r) => r.id === defenderId)
          if (defender) {
            defender.controlledCells = defender.controlledCells.filter(
              (p) => p.x !== attackPos.x || p.y !== attackPos.y
            )
            defender.baseCells = defender.baseCells.filter(
              (p) => p.x !== attackPos.x || p.y !== attackPos.y
            )
            if (defender.baseCells.length === 0) {
              defender.alive = false
            }
          }
        }
      }
    } else if (capturePos) {
      const cell = newCells[capturePos.y]![capturePos.x]!
      cell.captureProgress++
      if (cell.captureProgress >= cell.captureCost) {
        cell.ownerId = race.id
        cell.captureProgress = 0
        cell.captureCost = 0
        cell.capturedBy = null
        cell.attackProgress = 0
        cell.attackedBy = null
        race.controlledCells.push(capturePos)
      }
    } else {
      const hasAttack = findAttackTarget(race, newCells) !== null
      const attackThreshold = Math.max(1, Math.round(10 - race.priorities.war * 0.1))
      const warRoll = race.priorities.war >= balance.WAR_THRESHOLD && hasAttack && race.resources.material >= attackThreshold
      const hasExpand = findExpandTarget(race, newCells, width, height) !== null
      const expansionRoll = race.priorities.expansion > 0 && hasExpand
      const deficits = calcDeficits(race)
      const critical = deficits.meal > 5 || deficits.water > 5 || deficits.material > 5
      const buildThreshold = critical ? 0 : Math.max(1, Math.round(10 - race.priorities.building * 0.1))
      const canBuild = race.resources.material >= buildThreshold

      const weights: Array<{ action: () => void; weight: number }> = []
      if (warRoll) weights.push({ action: () => tryStartAttack(race, newCells), weight: race.priorities.war })
      if (expansionRoll) weights.push({ action: () => tryStartCapture(race, newCells, width, height), weight: race.priorities.expansion })
      if (canBuild) weights.push({ action: () => tryStartFabric(race, newCells), weight: race.priorities.building })

      if (weights.length > 0) {
        const total = weights.reduce((s, w) => s + w.weight, 0)
        let roll = Math.random() * total
        for (const { action, weight } of weights) {
          roll -= weight
          if (roll <= 0) {
            action()
            break
          }
        }
      } else if (!hasAttack && !hasExpand) {
        tryStartFabric(race, newCells)
      }
    }

    for (const pos of race.controlledCells) {
      const cell = newCells[pos.y]?.[pos.x]
      if (!cell || cell.isDepleted) continue
      if (cell.fabricOwnerId !== race.id || !cell.fabricComplete) continue
      if (!cell.resourceType) continue

      const yield_ = balance.RESOURCE_YIELDS[cell.resourceType]
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

    tryReprioritize(race, newMeta.cycle)
    tryBoostWar(race, newMeta.cycle, newCells)
    tryNormalizeWar(race, newMeta.cycle)

    const neededMeal = Math.min(race.resources.meal, balance.RACE_MAINTENANCE.meal)
    const neededWater = Math.min(race.resources.water, balance.RACE_MAINTENANCE.water)
    const neededMaterial = Math.min(race.resources.material, balance.RACE_MAINTENANCE.material)

    race.resources.meal -= neededMeal
    race.resources.water -= neededWater
    race.resources.material -= neededMaterial

    if (neededMeal < balance.RACE_MAINTENANCE.meal || neededWater < balance.RACE_MAINTENANCE.water || neededMaterial < balance.RACE_MAINTENANCE.material) {
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

    race.history.meal.push(race.resources.meal)
    race.history.water.push(race.resources.water)
    race.history.material.push(race.resources.material)
    race.history.territory.push(race.controlledCells.length)
  }

  for (let y = 0; y < newCells.length; y++) {
    for (let x = 0; x < newCells[y].length; x++) {
      const cell = newCells[y][x]
      if (!cell) continue

      if (cell.isDepleted) {
        cell.depletionCycles++
        if (cell.depletionCycles >= balance.DEPLETION_RECOVERY_CYCLES) {
          cell.isDepleted = false
          cell.depletionCycles = 0
          cell.resourceAmount = balance.RESOURCE_AMOUNT
        }
      }
    }
  }

  newMeta.races = newRaces

  const alive = newRaces.filter((r) => r.alive)
  const gameOver = alive.length <= 1
  const winner = gameOver && alive.length === 1 ? alive[0]!.name : null

  return { cells: newCells, races: newRaces, meta: newMeta, gameOver, winner }
}
