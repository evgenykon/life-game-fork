export const RACE_COLORS = [
  "bg-blue-500",
  "bg-red-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
]

export const RACE_COLORS_HEX = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ec4899",
]

export const RESOURCE_COLORS: Partial<Record<ResourceType, string>> = {
  [ResourceType.FIELD]: "bg-yellow-300",
  [ResourceType.FOREST]: "bg-green-700",
  [ResourceType.GRUNT]: "bg-amber-600",
  [ResourceType.ROCK]: "bg-gray-400",
  [ResourceType.MINERAL]: "bg-violet-400",
  [ResourceType.SWAMP]: "bg-emerald-900",
  [ResourceType.SAND]: "bg-yellow-100",
  [ResourceType.SNOW]: "bg-white",
  [ResourceType.WATER]: "bg-blue-400",
}

export const RESOURCE_ICONS: Partial<Record<ResourceType, string>> = {
  [ResourceType.FIELD]: "i-mdi-wheat",
  [ResourceType.FOREST]: "i-mdi-pine-tree",
  [ResourceType.GRUNT]: "i-mdi-earth",
  [ResourceType.ROCK]: "i-mdi-stone",
  [ResourceType.MINERAL]: "i-mdi-crystal",
  [ResourceType.SWAMP]: "i-mdi-swamp",
  [ResourceType.SAND]: "i-mdi-sand",
  [ResourceType.SNOW]: "i-mdi-snowflake",
  [ResourceType.WATER]: "i-mdi-water",
}

function ownerIndex(ownerId: string | null): number | null {
  if (!ownerId) return null
  const match = ownerId.match(/race_(\d+)/)
  return match ? Number.parseInt(match[1]!, 10) : null
}

export function getCellDisplayClass(cell: Cell): string {
  if (cell.type === CellType.SHADOWED) return "bg-gray-900"

  const baseOwner = ownerIndex(cell.ownerId)
  const fabricOwner = ownerIndex(cell.fabricOwnerId)

  if (cell.type === CellType.BASE && baseOwner !== null) {
    return `${RACE_COLORS[baseOwner % RACE_COLORS.length]} opacity-80`
  }

  if (cell.type === CellType.FABRIC && fabricOwner !== null) {
    return `${RACE_COLORS[fabricOwner % RACE_COLORS.length]} opacity-60`
  }

  if (cell.resourceType && RESOURCE_COLORS[cell.resourceType]) {
    return RESOURCE_COLORS[cell.resourceType]!
  }

  return "bg-gray-600"
}

export function getRaceColor(raceIndex: number): string {
  return RACE_COLORS[raceIndex % RACE_COLORS.length] ?? "bg-gray-500"
}
