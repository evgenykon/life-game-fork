export type GameAction =
  | { type: "occupy"; target: Position }
  | { type: "build_factory"; target: Position }
  | { type: "build_base"; target: Position }
  | { type: "attack"; target: Position }
  | { type: "skip" }

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state))
}

export function initGameState(mapWidth: number, mapHeight: number, raceCount: number): GameState {
  const map = generateMap(mapWidth, mapHeight)
  const races: Race[] = []

  for (let i = 0; i < raceCount; i++) {
    const race: Race = {
      id: `race_${i}`,
      name: `Race ${i + 1}`,
      resources: { ...RACE_START_RESOURCES },
      baseCells: [],
      controlledCells: [],
      alive: true,
    }
    races.push(race)
  }

  const placed = new Set<string>()
  for (const race of races) {
    let pos: Position
    let attempts = 0
    do {
      pos = {
        x: Math.floor(Math.random() * mapWidth),
        y: Math.floor(Math.random() * mapHeight),
      }
      attempts++
    } while (
      (placed.has(`${pos.x},${pos.y}`) || map[pos.y]![pos.x]!.type !== CellType.RESOURCE) &&
      attempts < 100
    )

    placed.add(`${pos.x},${pos.y}`)
    const cell = map[pos.y]![pos.x]!
    cell.type = CellType.BASE
    cell.ownerId = race.id
    cell.resourceType = null
    cell.originalResourceType = null
    race.baseCells.push(pos)
    race.controlledCells.push(pos)
  }

  const state: GameState = {
    map,
    races,
    currentRaceIndex: 0,
    cycle: 1,
    turnPhase: TurnPhase.WAITING_ACTION,
    logs: [],
    actedThisCycle: [],
  }

  updateShadowedCells(state)
  return state
}

function log(state: GameState, message: string) {
  state.logs.push(`[Cycle ${state.cycle}] ${message}`)
}

function getRace(state: GameState, raceId: string): Race | undefined {
  return state.races.find((r) => r.id === raceId)
}

function currentRace(state: GameState): Race | undefined {
  return state.races[state.currentRaceIndex]
}

function isAdjacentToRace(state: GameState, pos: Position, raceId: string): boolean {
  const race = getRace(state, raceId)
  if (!race) return false
  for (const owned of race.controlledCells) {
    if (getDistance(owned, pos) === 1) return true
  }
  return false
}

export function validateAction(state: GameState, action: GameAction): string | null {
  const race = currentRace(state)
  if (!race || !race.alive) return "Race is dead or not found"
  if (state.turnPhase !== TurnPhase.WAITING_ACTION) return "Not waiting for action"

  switch (action.type) {
    case "occupy": {
      const cell = getCell(state.map, action.target)
      if (!cell) return "Cell out of bounds"
      if (cell.type !== CellType.RESOURCE) return "Can only occupy resource cells"
      if (cell.ownerId) return "Cell already occupied"
      if (!isAdjacentToRace(state, action.target, race.id)) return "Cell must be adjacent"
      return null
    }
    case "build_factory": {
      const cell = getCell(state.map, action.target)
      if (!cell) return "Cell out of bounds"
      if (cell.ownerId !== race.id) return "Cell not owned by your race"
      if (cell.type !== CellType.RESOURCE && cell.type !== CellType.BASE) return "Cannot build factory here"
      if (cell.type === CellType.BASE) return "Cannot build factory on base"
      if (cell.fabricOwnerId) return "Factory already exists or under construction"
      const config = cell.resourceType ? RESOURCE_CONFIGS[cell.resourceType] : null
      if (!config || config.factoryCost === Infinity) return "Cannot build factory on this resource"
      return null
    }
    case "build_base": {
      const cell = getCell(state.map, action.target)
      if (!cell) return "Cell out of bounds"
      if (cell.ownerId !== race.id) return "Cell not owned by your race"
      if (cell.type !== CellType.RESOURCE) return "Can only build base on resource cells"
      const totalCells = state.map.flat().length
      const maxBases = Math.floor(totalCells / BASE_MAX_RATIO)
      if (race.baseCells.length >= maxBases) return `Max bases reached (1 per ${BASE_MAX_RATIO} cells)`
      if (
        race.resources.meal < BASE_BUILD_COST.meal ||
        race.resources.water < BASE_BUILD_COST.water ||
        race.resources.material < BASE_BUILD_COST.material
      ) {
        return "Not enough resources to start building base"
      }
      return null
    }
    case "attack": {
      const cell = getCell(state.map, action.target)
      if (!cell) return "Cell out of bounds"
      if (!cell.ownerId || cell.ownerId === race.id) return "Cannot attack own or unoccupied cell"
      if (!isAdjacentToRace(state, action.target, race.id)) return "Target must be adjacent"
      return null
    }
    case "skip":
      return null
    default:
      return "Unknown action"
  }
}

export function applyAction(state: GameState, action: GameAction): GameState {
  const validationError = validateAction(state, action)
  if (validationError) return state

  const s = cloneState(state)
  const race = currentRace(s)!

  switch (action.type) {
    case "occupy": {
      const cell = getCell(s.map, action.target)!
      cell.ownerId = race.id
      race.controlledCells.push(action.target)
      log(s, `${race.name} occupied ${action.target.x},${action.target.y}`)
      break
    }
    case "build_factory": {
      const cell = getCell(s.map, action.target)!
      const config = RESOURCE_CONFIGS[cell.resourceType!]
      cell.fabricOwnerId = race.id
      cell.fabricCost = config.factoryCost
      cell.fabricProgress = 1
      cell.type = CellType.FABRIC
      race.resources.material -= 1
      log(s, `${race.name} started building factory at ${action.target.x},${action.target.y} (${cell.fabricProgress}/${cell.fabricCost})`)
      break
    }
    case "build_base": {
      const cell = getCell(s.map, action.target)!
      race.resources.meal -= BASE_BUILD_COST.meal
      race.resources.water -= BASE_BUILD_COST.water
      race.resources.material -= BASE_BUILD_COST.material
      cell.type = CellType.BASE
      cell.ownerId = race.id
      cell.resourceType = null
      cell.originalResourceType = null
      race.baseCells.push(action.target)
      race.controlledCells.push(action.target)
      log(s, `${race.name} built a base at ${action.target.x},${action.target.y}`)
      break
    }
    case "attack": {
      const cell = getCell(s.map, action.target)!
      cell.attackedBy = race.id
      cell.attackProgress = 1
      log(s, `${race.name} started attacking ${action.target.x},${action.target.y}`)
      break
    }
    case "skip":
      log(s, `${race.name} skipped turn`)
      break
  }

  if (!s.actedThisCycle.includes(race.id)) {
    s.actedThisCycle.push(race.id)
  }

  updateShadowedCells(s)
  return s
}

function updateShadowedCells(state: GameState) {
  const controlled = new Set<string>()
  for (const race of state.races) {
    if (!race.alive) continue
    for (const pos of race.controlledCells) {
      controlled.add(`${pos.x},${pos.y}`)
      for (const neighbor of getNeighbors(pos)) {
        controlled.add(`${neighbor.x},${neighbor.y}`)
      }
    }
  }

  for (let y = 0; y < state.map.length; y++) {
    const row = state.map[y]!
    for (let x = 0; x < row.length; x++) {
      const cell = row[x]!
      const key = `${x},${y}`
      if (!controlled.has(key) && !cell.ownerId && cell.type !== CellType.BASE) {
        cell.type = CellType.SHADOWED
      } else if (cell.type === CellType.SHADOWED && controlled.has(key)) {
        cell.type = CellType.RESOURCE
      }
    }
  }
}

function processResourceCycles(state: GameState) {
  for (let y = 0; y < state.map.length; y++) {
    const row = state.map[y]!
    for (let x = 0; x < row.length; x++) {
      const cell = row[x]!
      if (!cell.resourceType || !cell.originalResourceType) continue
      const config = RESOURCE_CONFIGS[cell.resourceType]

      if (cell.isDepleted) {
        cell.depletionCycles++
        if (
          config.restorationCycles > 0 &&
          cell.depletionCycles >= config.restorationCycles
        ) {
          cell.isDepleted = false
          cell.depletionCycles = 0
          cell.resourceType = cell.originalResourceType
          cell.resourceAmount = RESOURCE_START_AMOUNT
          log(state, `Resource at ${x},${y} restored to ${cell.originalResourceType}`)
        }
      }

      if (!cell.fabricOwnerId) {
        cell.abandonedCycles++
        if (cell.abandonedCycles >= ABANDON_CYCLES && cell.resourceType !== config.abandonedType) {
          cell.resourceType = config.abandonedType
          cell.originalResourceType = config.abandonedType
          cell.isDepleted = false
          cell.depletionCycles = 0
          cell.resourceAmount = RESOURCE_START_AMOUNT
          log(state, `Resource at ${x},${y} abandoned, became ${config.abandonedType}`)
        }
      } else {
        cell.abandonedCycles = 0
      }
    }
  }
}

function processFabricProduction(state: GameState) {
  for (let y = 0; y < state.map.length; y++) {
    const row = state.map[y]!
    for (let x = 0; x < row.length; x++) {
      const cell = row[x]!
      if (!cell.fabricOwnerId) continue
      if (!cell.fabricComplete) {
        cell.fabricProgress++
        const race = getRace(state, cell.fabricOwnerId)
        if (race && race.alive) {
          race.resources.material -= 1
        }
        if (cell.fabricProgress >= cell.fabricCost) {
          cell.fabricComplete = true
          log(state, `Factory at ${x},${y} completed`)
        }
        continue
      }

      if (cell.isDepleted) {
        const ownerId = cell.fabricOwnerId
        cell.fabricOwnerId = null
        cell.fabricProgress = 0
        cell.fabricCost = 0
        cell.fabricComplete = false
        cell.type = CellType.RESOURCE
        if (ownerId) {
          const race = getRace(state, ownerId)
          if (race) {
            race.resources.material += FABRIC_RETURN_MATERIAL
            log(state, `Factory at ${x},${y} depleted, race got ${FABRIC_RETURN_MATERIAL} material`)
          }
        }
        continue
      }

      if (cell.resourceType && cell.resourceAmount > 0) {
        const config = RESOURCE_CONFIGS[cell.resourceType]
        if (config.value && cell.fabricOwnerId) {
          const race = getRace(state, cell.fabricOwnerId)
          if (race && race.alive) {
            cell.resourceAmount--
            for (const resource of config.value) {
              race.resources[resource]++
            }
            if (cell.resourceAmount <= 0) {
              const ownerId = cell.fabricOwnerId
              cell.isDepleted = true
              cell.resourceType = config.depletedType
              cell.fabricOwnerId = null
              cell.fabricProgress = 0
              cell.fabricCost = 0
              cell.fabricComplete = false
              cell.type = CellType.RESOURCE
              if (ownerId) {
                const race = getRace(state, ownerId)
                if (race) {
                  race.resources.material += FABRIC_RETURN_MATERIAL
                }
              }
              log(state, `Resource at ${x},${y} depleted, became ${config.depletedType}`)
            }
          }
        }
      }
    }
  }
}

function processBaseUpkeep(state: GameState) {
  for (const race of state.races) {
    if (!race.alive) continue
    for (const _ of race.baseCells) {
      race.resources.meal -= BASE_UPKEEP.meal
      race.resources.water -= BASE_UPKEEP.water
    }
  }
}

function processAttack(state: GameState) {
  for (let y = 0; y < state.map.length; y++) {
    const row = state.map[y]!
    for (let x = 0; x < row.length; x++) {
      const cell = row[x]!
      if (!cell.attackedBy) continue
      const attacker = getRace(state, cell.attackedBy)
      if (!attacker || !attacker.alive) {
        cell.attackedBy = null
        cell.attackProgress = 0
        continue
      }

      cell.attackProgress++

      if (cell.type === CellType.BASE) {
        if (cell.attackProgress >= BASE_CAPTURE_CYCLES) {
          const prevOwner = getRace(state, cell.ownerId!)
          if (prevOwner) {
            prevOwner.baseCells = prevOwner.baseCells.filter(
              (p) => !(p.x === x && p.y === y),
            )
            prevOwner.controlledCells = prevOwner.controlledCells.filter(
              (p) => !(p.x === x && p.y === y),
            )
          }
          cell.ownerId = attacker.id
          cell.attackedBy = null
          cell.attackProgress = 0
          attacker.baseCells.push({ x, y })
          attacker.controlledCells.push({ x, y })
          if (cell.fabricOwnerId) {
            const race = getRace(state, cell.fabricOwnerId)
            if (race && race.resources) {
              race.resources.material += FABRIC_RETURN_MATERIAL
            }
            cell.fabricOwnerId = null
            cell.fabricProgress = 0
            cell.fabricCost = 0
            cell.fabricComplete = false
          }
          log(state, `${attacker.name} captured base at ${x},${y}`)
        }
      } else if (cell.type === CellType.FABRIC) {
        if (cell.attackProgress >= cell.fabricCost) {
          cell.ownerId = attacker.id
          cell.fabricOwnerId = attacker.id
          cell.attackedBy = null
          cell.attackProgress = 0
          cell.fabricProgress = cell.fabricCost
          cell.fabricComplete = true
          attacker.controlledCells.push({ x, y })
          log(state, `${attacker.name} captured factory at ${x},${y}`)
        }
      } else if (cell.type === CellType.RESOURCE) {
        const targetRaces = state.races.filter((r) => r.id !== cell.attackedBy && r.alive)
        for (const targetRace of targetRaces) {
          if (targetRace.id !== cell.ownerId) continue
          if (cell.attackProgress >= BASE_DESTROY_CYCLES) {
            cell.attackedBy = null
            cell.attackProgress = 0
            cell.ownerId = null
            targetRace.controlledCells = targetRace.controlledCells.filter(
              (p) => !(p.x === x && p.y === y),
            )
            cell.type = CellType.RESOURCE
            cell.resourceAmount = RESOURCE_START_AMOUNT
            cell.isDepleted = false
            cell.depletionCycles = 0
            log(state, `${attacker.name} destroyed cell at ${x},${y}`)
          }
        }
      }
    }
  }
}

function checkDeathConditions(state: GameState) {
  for (const race of state.races) {
    if (!race.alive) continue
    if (race.resources.meal <= 0 || race.resources.water <= 0 || race.baseCells.length === 0) {
      race.alive = false
      for (const pos of race.controlledCells) {
        const cell = getCell(state.map, pos)
        if (cell) {
          cell.ownerId = null
          cell.fabricOwnerId = null
          cell.fabricProgress = 0
          cell.fabricCost = 0
          cell.fabricComplete = false
          if (cell.type === CellType.BASE) {
            cell.type = CellType.RESOURCE
          }
        }
      }
      log(state, `${race.name} has been eliminated!`)
    }
  }
}

export function nextTurn(state: GameState): GameState {
  const s = cloneState(state)
  const aliveRaces = s.races.filter((r) => r.alive)

  if (aliveRaces.length <= 1) {
    s.turnPhase = TurnPhase.COMPLETED
    if (aliveRaces.length === 1 && aliveRaces[0]) {
      log(s, `${aliveRaces[0].name} wins!`)
    } else {
      log(s, "No races left — draw!")
    }
    return s
  }

  const startIdx = s.currentRaceIndex
  let nextIdx = (startIdx + 1) % s.races.length

  while (nextIdx !== startIdx && !s.races[nextIdx]!.alive) {
    nextIdx = (nextIdx + 1) % s.races.length
  }

  if (!s.races[nextIdx]!.alive) {
    s.turnPhase = TurnPhase.COMPLETED
    log(s, "No races left — draw!")
    return s
  }

  s.currentRaceIndex = nextIdx

  const allAliveActed = aliveRaces.every((r) => s.actedThisCycle.includes(r.id))
  if (allAliveActed) {
    s.turnPhase = TurnPhase.WAITING_ACTION
    return s
  }

  s.turnPhase = TurnPhase.WAITING_ACTION
  return s
}

export function endCycle(state: GameState): GameState {
  const s = cloneState(state)
  s.cycle++
  s.currentRaceIndex = 0
  s.turnPhase = TurnPhase.WAITING_ACTION

  processBaseUpkeep(s)
  processFabricProduction(s)
  processResourceCycles(s)
  processAttack(s)
  checkDeathConditions(s)
  updateShadowedCells(s)

  const aliveRaces2 = s.races.filter((r) => r.alive)
  if (aliveRaces2.length <= 1) {
    s.turnPhase = TurnPhase.COMPLETED
    if (aliveRaces2.length === 1 && aliveRaces2[0]) {
      log(s, `${aliveRaces2[0].name} wins!`)
    } else {
      log(s, "No races left — draw!")
    }
  }

  return s
}
