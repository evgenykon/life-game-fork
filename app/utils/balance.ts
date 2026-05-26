import { reactive } from "vue"
import { ResourceType } from "~/utils/game-types"

export const balance = reactive({
  RESOURCE_AMOUNT: 200,
  MIN_RACE_DISTANCE: 4,
  DEPLETION_RECOVERY_CYCLES: 10,
  RACE_START_RESOURCES: { meal: 200, water: 200, material: 200 },
  RACE_MAINTENANCE: { meal: 2, water: 1, material: 1 },
  ATTACK_DURATION: 5,
  ATTACK_COST: 1,
  LIBERATION_DURATION: 1,
  WAR_THRESHOLD: 30,
  REPRIORITIZE_THRESHOLD: 30,
  REPRIORITIZE_COOLDOWN: 10,
  REPRIORITIZE_SHIFT: 20,

  RESOURCE_WEIGHTS: {
    [ResourceType.FIELD]: 15,
    [ResourceType.FOREST]: 15,
    [ResourceType.GRUNT]: 20,
    [ResourceType.ROCK]: 10,
    [ResourceType.MINERAL]: 5,
    [ResourceType.SWAMP]: 10,
    [ResourceType.SAND]: 10,
    [ResourceType.SNOW]: 5,
    [ResourceType.WATER]: 10,
  } as Record<ResourceType, number>,

  RESOURCE_CAPTURE_COST: {
    [ResourceType.FIELD]: 5,
    [ResourceType.FOREST]: 5,
    [ResourceType.GRUNT]: 1,
    [ResourceType.ROCK]: 10,
    [ResourceType.MINERAL]: 10,
    [ResourceType.SWAMP]: 10,
    [ResourceType.SAND]: 1,
    [ResourceType.SNOW]: 10,
    [ResourceType.WATER]: 5,
  } as Record<ResourceType, number>,

  RESOURCE_FABRIC_COST: {
    [ResourceType.FIELD]: 5,
    [ResourceType.FOREST]: 5,
    [ResourceType.GRUNT]: null,
    [ResourceType.ROCK]: 10,
    [ResourceType.MINERAL]: 10,
    [ResourceType.SWAMP]: 10,
    [ResourceType.SAND]: null,
    [ResourceType.SNOW]: 10,
    [ResourceType.WATER]: 5,
  } as Record<ResourceType, number | null>,

  RESOURCE_YIELDS: {
    [ResourceType.FIELD]: { meal: 4, water: 0, material: 0 },
    [ResourceType.FOREST]: { meal: 2, water: 0, material: 2 },
    [ResourceType.GRUNT]: { meal: 0, water: 0, material: 0 },
    [ResourceType.ROCK]: { meal: 0, water: 0, material: 3 },
    [ResourceType.MINERAL]: { meal: 0, water: 1, material: 3 },
    [ResourceType.SWAMP]: { meal: 1, water: 1, material: 0 },
    [ResourceType.SAND]: { meal: 0, water: 0, material: 0 },
    [ResourceType.SNOW]: { meal: 0, water: 2, material: 0 },
    [ResourceType.WATER]: { meal: 0, water: 3, material: 0 },
  } as Record<ResourceType, { meal: number; water: number; material: number }>,
})
