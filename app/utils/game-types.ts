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

export const RESOURCE_WEIGHTS: Record<ResourceType, number> = {
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

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  [ResourceType.FIELD]: "i-pinhead:plant",
  [ResourceType.FOREST]: "i-material-symbols-light:forest-rounded",
  [ResourceType.GRUNT]: "i-ph:dots-nine-thin",
  [ResourceType.ROCK]: "i-uil:mountains",
  [ResourceType.MINERAL]: "i-mdi-gem",
  [ResourceType.SWAMP]: "i-mdi-water-outline",
  [ResourceType.SAND]: "i-fluent:grid-dots-16-regular",
  [ResourceType.SNOW]: "i-mdi-snowflake",
  [ResourceType.WATER]: "i-mdi-water",
}

export const RESOURCE_AMOUNT = 100
export const RACE_START_RESOURCES = { meal: 100, water: 100, material: 100 }
export const MIN_RACE_DISTANCE = 5

export interface Position {
  x: number
  y: number
}

export interface CellData {
  type: CellType
  resourceType: ResourceType | null
  resourceAmount: number
  ownerId: string | null
  fabricOwnerId: string | null
  fabricProgress: number
  fabricCost: number
  fabricComplete: boolean
  attackProgress: number
  attackedBy: string | null
  depletionCycles: number
  abandonedCycles: number
  isDepleted: boolean
}

export interface RaceData {
  id: string
  name: string
  resources: { meal: number; water: number; material: number }
  baseCells: Position[]
  controlledCells: Position[]
  alive: boolean
}

export interface MapMeta {
  width: number
  height: number
  density: number
  raceCount: number
  cycle: number
  races: RaceData[]
}
