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
export const MIN_RACE_DISTANCE = 4
export const RACE_MAINTENANCE = { meal: 3, water: 2, material: 1 }
export const DEPLETION_RECOVERY_CYCLES = 10

export const RESOURCE_FABRIC_COST: Record<ResourceType, number | null> = {
  [ResourceType.FIELD]: 5,
  [ResourceType.FOREST]: 5,
  [ResourceType.GRUNT]: null,
  [ResourceType.ROCK]: 10,
  [ResourceType.MINERAL]: 10,
  [ResourceType.SWAMP]: 10,
  [ResourceType.SAND]: null,
  [ResourceType.SNOW]: 10,
  [ResourceType.WATER]: 5,
}

export const RESOURCE_CAPTURE_COST: Record<ResourceType, number> = {
  [ResourceType.FIELD]: 5,
  [ResourceType.FOREST]: 5,
  [ResourceType.GRUNT]: 1,
  [ResourceType.ROCK]: 10,
  [ResourceType.MINERAL]: 10,
  [ResourceType.SWAMP]: 10,
  [ResourceType.SAND]: 1,
  [ResourceType.SNOW]: 10,
  [ResourceType.WATER]: 5,
}

export const RESOURCE_YIELDS: Record<ResourceType, { meal: number; water: number; material: number }> = {
  [ResourceType.FIELD]: { meal: 2, water: 0, material: 0 },
  [ResourceType.FOREST]: { meal: 1, water: 0, material: 1 },
  [ResourceType.GRUNT]: { meal: 0, water: 0, material: 0 },
  [ResourceType.ROCK]: { meal: 0, water: 0, material: 2 },
  [ResourceType.MINERAL]: { meal: 0, water: 0, material: 3 },
  [ResourceType.SWAMP]: { meal: 0, water: 0, material: 0 },
  [ResourceType.SAND]: { meal: 0, water: 0, material: 0 },
  [ResourceType.SNOW]: { meal: 0, water: 1, material: 0 },
  [ResourceType.WATER]: { meal: 0, water: 2, material: 0 },
}

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
  captureProgress: number
  captureCost: number
  capturedBy: string | null
  attackProgress: number
  attackedBy: string | null
  depletionCycles: number
  abandonedCycles: number
  isDepleted: boolean
}

export const RACE_COLORS: Array<{ color: string; tintColor: string; borderColor: string }> = [
  { color: "#ef4444", tintColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.4)" },
  { color: "#3b82f6", tintColor: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.4)" },
  { color: "#22c55e", tintColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.4)" },
  { color: "#a855f7", tintColor: "rgba(168,85,247,0.12)", borderColor: "rgba(168,85,247,0.4)" },
  { color: "#f97316", tintColor: "rgba(249,115,22,0.12)", borderColor: "rgba(249,115,22,0.4)" },
  { color: "#ec4899", tintColor: "rgba(236,72,153,0.12)", borderColor: "rgba(236,72,153,0.4)" },
  { color: "#14b8a6", tintColor: "rgba(20,184,166,0.12)", borderColor: "rgba(20,184,166,0.4)" },
  { color: "#eab308", tintColor: "rgba(234,179,8,0.12)", borderColor: "rgba(234,179,8,0.4)" },
]

export interface RaceData {
  id: string
  name: string
  color: string
  tintColor: string
  borderColor: string
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
