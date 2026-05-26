export enum CellType {
  BASE = "base",
  RESOURCE = "resource",
  FABRIC = "fabric",
  SHADOWED = "shadowed",
}

export enum ResourceType {
  FIELD = "FIELD",
  FOREST = "FOREST",
  GRUNT = "GRUNT",
  ROCK = "ROCK",
  MINERAL = "MINERAL",
  SWAMP = "SWAMP",
  SAND = "SAND",
  SNOW = "SNOW",
  WATER = "WATER",
}

export enum RaceResource {
  MEAL = "meal",
  WATER = "water",
  MATERIAL = "material",
}

export enum TurnPhase {
  WAITING_ACTION = "waiting_action",
  EXECUTING = "executing",
  COMPLETED = "completed",
}

export interface Position {
  x: number
  y: number
}

export interface ResourceStock {
  meal: number
  water: number
  material: number
}

export interface ResourceConfig {
  labelRu: string
  restorationCycles: number
  depletedType: ResourceType
  abandonedType: ResourceType
  value: RaceResource[] | null
  factoryCost: number
}

export const RESOURCE_CONFIGS: Record<ResourceType, ResourceConfig> = {
  [ResourceType.FIELD]: {
    labelRu: "поле зерна",
    restorationCycles: 5,
    depletedType: ResourceType.GRUNT,
    abandonedType: ResourceType.FOREST,
    value: [RaceResource.MEAL],
    factoryCost: 5,
  },
  [ResourceType.FOREST]: {
    labelRu: "лес",
    restorationCycles: 10,
    depletedType: ResourceType.GRUNT,
    abandonedType: ResourceType.FOREST,
    value: [RaceResource.MATERIAL],
    factoryCost: 5,
  },
  [ResourceType.GRUNT]: {
    labelRu: "почва",
    restorationCycles: 10,
    depletedType: ResourceType.SAND,
    abandonedType: ResourceType.FOREST,
    value: null,
    factoryCost: Infinity,
  },
  [ResourceType.ROCK]: {
    labelRu: "камень",
    restorationCycles: 30,
    depletedType: ResourceType.SAND,
    abandonedType: ResourceType.ROCK,
    value: [RaceResource.MATERIAL],
    factoryCost: 10,
  },
  [ResourceType.MINERAL]: {
    labelRu: "минералы",
    restorationCycles: 30,
    depletedType: ResourceType.ROCK,
    abandonedType: ResourceType.MINERAL,
    value: [RaceResource.MATERIAL],
    factoryCost: 10,
  },
  [ResourceType.SWAMP]: {
    labelRu: "болото",
    restorationCycles: 5,
    depletedType: ResourceType.GRUNT,
    abandonedType: ResourceType.SWAMP,
    value: [RaceResource.MEAL, RaceResource.MATERIAL],
    factoryCost: 10,
  },
  [ResourceType.SAND]: {
    labelRu: "песок",
    restorationCycles: 0,
    depletedType: ResourceType.SAND,
    abandonedType: ResourceType.GRUNT,
    value: null,
    factoryCost: Infinity,
  },
  [ResourceType.SNOW]: {
    labelRu: "снег",
    restorationCycles: 5,
    depletedType: ResourceType.GRUNT,
    abandonedType: ResourceType.SNOW,
    value: [RaceResource.WATER],
    factoryCost: 10,
  },
  [ResourceType.WATER]: {
    labelRu: "вода",
    restorationCycles: 5,
    depletedType: ResourceType.SWAMP,
    abandonedType: ResourceType.WATER,
    value: [RaceResource.WATER],
    factoryCost: 5,
  },
}

export interface Cell {
  position: Position
  type: CellType
  resourceType: ResourceType | null
  originalResourceType: ResourceType | null
  resourceAmount: number
  isDepleted: boolean
  depletionCycles: number
  abandonedCycles: number
  ownerId: string | null
  fabricOwnerId: string | null
  fabricProgress: number
  fabricCost: number
  fabricComplete: boolean
  attackProgress: number
  attackedBy: string | null
}

export interface Race {
  id: string
  name: string
  resources: ResourceStock
  baseCells: Position[]
  controlledCells: Position[]
  alive: boolean
}

export const BASE_BUILD_COST: ResourceStock = {
  meal: 20,
  water: 20,
  material: 20,
}

export const BASE_BUILD_CYCLES = 20
export const BASE_DESTROY_CYCLES = 10
export const BASE_CAPTURE_CYCLES = 10
export const BASE_UPKEEP: ResourceStock = {
  meal: 5,
  water: 5,
  material: 0,
}
export const BASE_MAX_RATIO = 10 // 1 base per 10 cells
export const RESOURCE_START_AMOUNT = 100
export const FABRIC_RETURN_MATERIAL = 5
export const ABANDON_CYCLES = 50
export const SHADOW_RANGE = 2
export const RACE_START_RESOURCES: ResourceStock = {
  meal: 100,
  water: 100,
  material: 100,
}

export interface GameState {
  map: Cell[][]
  races: Race[]
  currentRaceIndex: number
  cycle: number
  turnPhase: TurnPhase
  logs: string[]
  actedThisCycle: string[] // race ids that have acted this cycle
}
