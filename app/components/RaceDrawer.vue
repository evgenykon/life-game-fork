<script setup lang="ts">
import type { RaceData, CellData } from "~/utils/game-types"
import { CellType, RESOURCE_YIELDS } from "~/utils/game-types"

const props = defineProps<{
  race: RaceData | null
  cells: CellData[][] | null
}>()

const emit = defineEmits<{
  close: []
}>()

const MAX = 20
const W = 260
const H = 120
const PAD_L = 4
const PAD_R = 4
const PAD_T = 12
const PAD_B = 16

function sliceLast(arr: number[]): number[] {
  return arr.length > MAX ? arr.slice(-MAX) : arr
}

function polylinePoints(data: number[]): string {
  if (data.length < 2) return ""
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = (W - PAD_L - PAD_R) / Math.max(data.length - 1, 1)
  return data
    .map((v, i) => {
      const x = PAD_L + i * stepX
      const y = H - PAD_B - ((v - min) / range) * (H - PAD_T - PAD_B)
      return `${x},${y}`
    })
    .join(" ")
}

function chartYLabels(data: number[]): { min: number; max: number } {
  if (data.length === 0) return { min: 0, max: 1 }
  return { min: Math.min(...data, 0), max: Math.max(...data, 1) }
}

function xTickLabels(len: number, totalLen: number): { label: string; x: number }[] {
  if (len < 2) return []
  const stepX = (W - PAD_L - PAD_R) / Math.max(len - 1, 1)
  const labels: { label: string; x: number }[] = []
  const tickCount = Math.min(len, 5)
  const step = Math.max(1, Math.floor((len - 1) / (tickCount - 1)))
  for (let i = 0; i < len && labels.length < tickCount; i += step) {
    const cycle = totalLen - len + i
    labels.push({ label: String(cycle), x: PAD_L + i * stepX })
  }
  if (labels.length > 0 && labels[labels.length - 1]!.x < W - PAD_R - 10) {
    labels.push({ label: String(totalLen - 1), x: W - PAD_R })
  }
  return labels
}

const window = computed(() => {
  const r = props.race
  if (!r) return null
  return {
    meal: sliceLast(r.history.meal),
    water: sliceLast(r.history.water),
    material: sliceLast(r.history.material),
    territory: sliceLast(r.history.territory),
  }
})

const resourceLines = computed(() => {
  const w = window.value
  if (!w) return null
  return {
    meal: polylinePoints(w.meal),
    water: polylinePoints(w.water),
    material: polylinePoints(w.material),
  }
})

const territoryLine = computed(() => {
  const w = window.value
  if (!w) return null
  return polylinePoints(w.territory)
})

const resLabels = computed(() => {
  const w = window.value
  if (!w) return { min: 0, max: 1 }
  const all = [...w.meal, ...w.water, ...w.material]
  return chartYLabels(all)
})

const terrLabels = computed(() => {
  const w = window.value
  if (!w) return { min: 0, max: 1 }
  return chartYLabels(w.territory)
})

const resXTicks = computed(() => {
  const r = props.race
  const w = window.value
  return w && r ? xTickLabels(w.meal.length, r.history.meal.length) : []
})

const terrXTicks = computed(() => {
  const r = props.race
  const w = window.value
  return w && r ? xTickLabels(w.territory.length, r.history.territory.length) : []
})

const sortedPriorities = computed(() => {
  const p = props.race?.priorities
  if (!p) return []
  const labels: Record<string, string> = {
    expansion: "расширение",
    building: "строительство",
    war: "война",
    reinforcement: "укрепление",
  }
  return Object.entries(p)
    .sort(([, a], [, b]) => b - a)
    .map(([key, val]) => ({ label: labels[key] ?? key, value: val }))
})

const resourceShortage = computed(() => {
  const r = props.race
  const c = props.cells
  if (!r || !c) return 0
  const h = c.length
  const w = c[0]?.length ?? 0
  const maxDist = w + h

  function nearestDist(yieldKey: "meal" | "water" | "material"): number {
    let best = maxDist
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = c[y]![x]!
        if (!cell.resourceType) continue
        const yields = RESOURCE_YIELDS[cell.resourceType]
        if (!yields || yields[yieldKey] <= 0) continue
        for (const base of r.baseCells) {
          const d = Math.abs(base.x - x) + Math.abs(base.y - y)
          if (d < best) best = d
        }
      }
    }
    return best
  }

  const mealDist = nearestDist("meal")
  const waterDist = nearestDist("water")
  const materialDist = nearestDist("material")

  const shortage = Math.max(
    (maxDist - mealDist) / maxDist,
    (maxDist - waterDist) / maxDist,
    (maxDist - materialDist) / maxDist
  )

  return Math.round((1 - shortage) * 100)
})

const currentAction = computed(() => {
  const r = props.race
  const c = props.cells
  if (!r || !c) return "—"
  const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]
  const w = c[0]?.length ?? 0
  const h = c.length

  for (const pos of r.controlledCells) {
    for (const d of dirs) {
      const nx = pos.x + d.x
      const ny = pos.y + d.y
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const cell = c[ny]![nx]!
      if (cell.captureProgress > 0 && cell.capturedBy === r.id) {
        return `Захват: ${cell.captureProgress}/${cell.captureCost}`
      }
      if (cell.attackProgress > 0 && cell.attackedBy === r.id) {
        return `Атака: ${cell.attackProgress}/5`
      }
    }
  }

  for (const pos of r.controlledCells) {
    const cell = c[pos.y]![pos.x]!
    if (cell.fabricOwnerId === r.id && !cell.fabricComplete) {
      return `Фабрика: ${cell.fabricProgress}/${cell.fabricCost}`
    }
  }

  const ownedSet = new Set(r.controlledCells.map((p) => `${p.x},${p.y}`))
  let hasExpandTarget = false
  let hasAttackTarget = false

  for (const pos of r.controlledCells) {
    for (const d of dirs) {
      const nx = pos.x + d.x
      const ny = pos.y + d.y
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const key = `${nx},${ny}`
      if (ownedSet.has(key)) continue
      const cell = c[ny]![nx]!
      if (cell.ownerId === null && cell.type === CellType.RESOURCE) {
        hasExpandTarget = true
      }
      if (cell.ownerId !== null && cell.ownerId !== r.id) {
        hasAttackTarget = true
      }
    }
  }

  if (hasExpandTarget) return "Готовится к захвату"
  if (hasAttackTarget) return "Готовится к атаке"
  return "Ожидает"
})
</script>

<template>
  <div
    v-if="race"
    class="flex h-full w-80 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold" :style="{ color: race.color }">{{ race.name }}</h2>
      <button class="btn btn-ghost btn-sm" @click="emit('close')">
        <Icon name="i-mdi-close" />
      </button>
    </div>

    <div>
      <h3 class="mb-1 text-xs font-medium text-muted-foreground">Ресурсы</h3>
      <svg :width="W" :height="H" class="w-full">
        <text x="2" y="10" fill="#9ca3af" font-size="8">{{ resLabels.max }}</text>
        <text x="2" :y="H - PAD_B + 2" fill="#9ca3af" font-size="8">{{ resLabels.min }}</text>
        <polyline
          v-if="resourceLines?.meal"
          :points="resourceLines.meal"
          fill="none"
          stroke="#f59e0b"
          stroke-width="1.5"
        />
        <polyline
          v-if="resourceLines?.water"
          :points="resourceLines.water"
          fill="none"
          stroke="#3b82f6"
          stroke-width="1.5"
        />
        <polyline
          v-if="resourceLines?.material"
          :points="resourceLines.material"
          fill="none"
          stroke="#a855f7"
          stroke-width="1.5"
        />
        <text
          v-for="tick in resXTicks"
          :key="tick.label"
          :x="tick.x"
          :y="H - 2"
          fill="#9ca3af"
          font-size="8"
          text-anchor="middle"
        >
          {{ tick.label }}
        </text>
      </svg>
      <div class="mt-1 flex gap-3 text-xs text-muted-foreground">
        <span><span class="inline-block h-2 w-2 rounded-full bg-amber-400" /> meal</span>
        <span><span class="inline-block h-2 w-2 rounded-full bg-blue-500" /> water</span>
        <span><span class="inline-block h-2 w-2 rounded-full bg-purple-500" /> material</span>
      </div>
    </div>

    <div>
      <h3 class="mb-1 text-xs font-medium text-muted-foreground">Территория</h3>
      <svg :width="W" :height="H" class="w-full">
        <text x="2" y="10" fill="#9ca3af" font-size="8">{{ terrLabels.max }}</text>
        <text x="2" :y="H - PAD_B + 2" fill="#9ca3af" font-size="8">{{ terrLabels.min }}</text>
        <polyline
          v-if="territoryLine"
          :points="territoryLine"
          fill="none"
          :stroke="race.color"
          stroke-width="1.5"
        />
        <text
          v-for="tick in terrXTicks"
          :key="tick.label"
          :x="tick.x"
          :y="H - 2"
          fill="#9ca3af"
          font-size="8"
          text-anchor="middle"
        >
          {{ tick.label }}
        </text>
      </svg>
    </div>

    <div class="text-xs text-muted-foreground">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <div class="text-xs font-semibold text-amber-400">{{ race.resources.meal }}</div>
          <div class="text-[10px]">meal</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-blue-400">{{ race.resources.water }}</div>
          <div class="text-[10px]">water</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-purple-400">{{ race.resources.material }}</div>
          <div class="text-[10px]">material</div>
        </div>
      </div>
      <div class="mt-2 grid grid-cols-2 gap-2 text-center">
        <div>
          <div class="text-xs font-semibold">{{ race.controlledCells.length }}</div>
          <div class="text-[10px]">клеток</div>
        </div>
        <div>
          <div class="text-xs font-semibold">{{ race.baseCells.length }}</div>
          <div class="text-[10px]">баз</div>
        </div>
      </div>
    </div>

    <div class="text-xs">
      <h3 class="mb-1 font-medium text-muted-foreground">Стратегия</h3>
      <div class="space-y-0.5 text-muted-foreground">
        <div v-for="item in sortedPriorities" :key="item.label" class="flex justify-between">
          <span>{{ item.label }}</span>
          <span class="tabular-nums">{{ item.value }}%</span>
        </div>
        <div class="flex justify-between border-t border-border pt-1">
          <span :class="resourceShortage > 50 ? 'text-orange-400' : ''">нехватка ресурсов</span>
          <span :class="resourceShortage > 50 ? 'text-orange-400' : ''" class="tabular-nums">{{ resourceShortage }}%</span>
        </div>
      </div>
    </div>

    <div class="text-xs">
      <h3 class="mb-1 font-medium text-muted-foreground">Текущее действие</h3>
      <div class="text-muted-foreground">{{ currentAction }}</div>
    </div>
  </div>
</template>
