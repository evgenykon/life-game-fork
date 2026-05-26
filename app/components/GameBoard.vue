<script setup lang="ts">
import { RESOURCE_ICONS, RESOURCE_YIELDS, RESOURCE_CAPTURE_COST, RESOURCE_FABRIC_COST, CellType } from "~/utils/game-types"
import { ICON_PATHS, ICON_COLORS } from "~/utils/icon-paths"
import type { CellData, RaceData, Position } from "~/utils/game-types"

const props = defineProps<{
  cellSize: number | "fit"
  cells: CellData[][] | null
  races: RaceData[]
}>()

const emit = defineEmits<{
  selectRace: [raceId: string]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const GRID_SIZE = 20

const containerWidth = ref(0)
const containerHeight = ref(0)

let resizeTimer: ReturnType<typeof setTimeout> | null = null
const iconCache = new Map<string, HTMLCanvasElement>()

const hoverCell = ref<{ x: number; y: number; cell: CellData } | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

function updateSize() {
  if (containerRef.value) {
    const w = containerRef.value.clientWidth
    const h = containerRef.value.clientHeight
    if (Math.abs(w - containerWidth.value) > 2 || Math.abs(h - containerHeight.value) > 2) {
      containerWidth.value = w
      containerHeight.value = h
    }
  }
}

const resolvedCellSize = computed(() => {
  if (props.cellSize === "fit") {
    const w = Math.floor(containerWidth.value / GRID_SIZE)
    const h = Math.floor(containerHeight.value / GRID_SIZE)
    return Math.max(1, Math.min(w, h))
  }
  return props.cellSize
})

const ownerColorMap = computed(() => {
  const map: Record<string, { color: string; tintColor: string; borderColor: string }> = {}
  for (const race of props.races) {
    map[race.id] = { color: race.color, tintColor: race.tintColor, borderColor: race.borderColor }
  }
  return map
})

const DIRS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
]

function manhattan(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

const expandTargets = computed(() => {
  const targets: Record<string, { x: number; y: number }> = {}
  if (!props.cells) return targets
  const width = props.cells[0]?.length ?? 0
  const height = props.cells.length

  for (const race of props.races) {
    if (!race.alive) continue

    const hasAction = props.cells?.some((row) =>
      row.some(
        (c) =>
          (c.captureProgress > 0 && c.capturedBy === race.id && c.ownerId === null) ||
          (c.attackProgress > 0 && c.attackedBy === race.id)
      )
    ) || race.controlledCells.some((p) => {
      const c = props.cells?.[p.y]?.[p.x]
      return c?.fabricOwnerId === race.id && !c.fabricComplete
    })
    if (hasAction) continue

    const ownedSet = new Set(race.controlledCells.map((p) => `${p.x},${p.y}`))
    const candidates: Array<{ x: number; y: number }> = []

    for (const pos of race.controlledCells) {
      for (const dir of DIRS) {
        const nx = pos.x + dir.x
        const ny = pos.y + dir.y
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const key = `${nx},${ny}`
        if (ownedSet.has(key)) continue

        const cell = props.cells[ny]?.[nx]
        if (!cell || cell.ownerId !== null || cell.type !== CellType.RESOURCE || cell.captureProgress > 0) continue

        if (!candidates.some((c) => c.x === nx && c.y === ny)) {
          candidates.push({ x: nx, y: ny })
        }
      }
    }

    if (candidates.length === 0) continue

    const bases = race.baseCells
    let best = candidates[0]!
    let bestDist = -1
    for (const c of candidates) {
      let minDist = Infinity
      for (const b of bases) {
        const d = manhattan(b, c)
        if (d < minDist) minDist = d
      }
      if (minDist > bestDist || (minDist === bestDist && (c.x * 7 + c.y * 13) % 2 === 0)) {
        bestDist = minDist
        best = c
      }
    }
    targets[race.id] = best
  }

  return targets
})

const attackTargets = computed(() => {
  const targets: Record<string, { x: number; y: number }> = {}
  if (!props.cells) return targets
  const width = props.cells[0]?.length ?? 0
  const height = props.cells.length

  for (const race of props.races) {
    if (!race.alive) continue

    const hasAction = props.cells?.some((row) =>
      row.some(
        (c) =>
          (c.captureProgress > 0 && c.capturedBy === race.id && c.ownerId === null) ||
          (c.attackProgress > 0 && c.attackedBy === race.id)
      )
    ) || race.controlledCells.some((p) => {
      const c = props.cells?.[p.y]?.[p.x]
      return c?.fabricOwnerId === race.id && !c.fabricComplete
    })
    if (hasAction) continue

    const ownedSet = new Set(race.controlledCells.map((p) => `${p.x},${p.y}`))
    const candidates: Position[] = []
    for (const pos of race.controlledCells) {
      for (const dir of DIRS) {
        const nx = pos.x + dir.x
        const ny = pos.y + dir.y
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const key = `${nx},${ny}`
        if (ownedSet.has(key)) continue
        const cell = props.cells[ny]?.[nx]
        if (!cell || cell.ownerId === null || cell.ownerId === race.id) continue
        if (cell.attackProgress > 0 && cell.attackedBy !== race.id) continue
        if (!candidates.some((c) => c.x === nx && c.y === ny)) {
          candidates.push({ x: nx, y: ny })
        }
      }
    }
    if (candidates.length === 0) continue

    let best = candidates[0]!
    let bestScore = -Infinity
    for (const c of candidates) {
      const cell = props.cells[c.y]![c.x]!
      let score = 0
      if (cell.type === CellType.BASE) score += 100
      if (cell.fabricComplete) score += 50
      if (cell.fabricOwnerId && !cell.fabricComplete) score += 10
      if (cell.resourceType) {
        const yields = RESOURCE_YIELDS[cell.resourceType]
        score += yields.meal + yields.water + yields.material * 2
      }
      if (score > bestScore || (score === bestScore && (c.x * 7 + c.y * 13) % 2 === 0)) {
        bestScore = score
        best = c
      }
    }
    targets[race.id] = best
  }
  return targets
})

function renderIcon(iconName: string, size: number, color: string): HTMLCanvasElement | null {
  const cacheKey = `v4-${iconName}-${size}-${color}`
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!

  const data = ICON_PATHS[iconName]
  if (!data) return null

  const offscreen = document.createElement("canvas")
  offscreen.width = size
  offscreen.height = size
  const ctx = offscreen.getContext("2d")!

  const path = new Path2D(data.d)

  const iconSize = size * 0.8
  const offset = (size - iconSize) / 2
  const scale = iconSize / Math.max(data.vbW, data.vbH)

  ctx.translate(offset, offset)
  ctx.scale(scale, scale)
  ctx.fillStyle = color
  ctx.fill(path)

  iconCache.set(cacheKey, offscreen)
  return offscreen
}

function drawGrid() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext("2d")!
  const size = resolvedCellSize.value
  const totalSize = GRID_SIZE * size

  canvas.width = totalSize
  canvas.height = totalSize

  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, totalSize, totalSize)

  ctx.strokeStyle = "rgba(161, 98, 7, 0.3)"
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])

  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * size + 0.5
    ctx.beginPath()
    ctx.moveTo(pos, 0)
    ctx.lineTo(pos, totalSize)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, pos)
    ctx.lineTo(totalSize, pos)
    ctx.stroke()
  }

  ctx.setLineDash([])

  if (hoverCell.value) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.strokeRect(hoverCell.value.x * size, hoverCell.value.y * size, size, size)
  }

  if (props.cells) {
    const targetSet = new Set<string>()
    for (const pos of Object.values(expandTargets.value)) {
      targetSet.add(`${pos.x},${pos.y}`)
    }

    const atkTargetSet = new Set<string>()
    for (const pos of Object.values(attackTargets.value)) {
      atkTargetSet.add(`${pos.x},${pos.y}`)
    }

    for (let y = 0; y < props.cells.length && y < GRID_SIZE; y++) {
      const row = props.cells[y]
      if (!row) continue
      for (let x = 0; x < row.length && x < GRID_SIZE; x++) {
        const cell = row[x]
        if (!cell) continue

        const ownerColor = cell.ownerId ? ownerColorMap.value[cell.ownerId] : null
        if (ownerColor) {
          ctx.fillStyle = ownerColor.tintColor
          ctx.fillRect(x * size, y * size, size, size)
          ctx.strokeStyle = ownerColor.borderColor
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.strokeRect(x * size + 0.5, y * size + 0.5, size - 1, size - 1)
        }

        if (targetSet.has(`${x},${y}`)) {
          const raceId = Object.keys(expandTargets.value).find(
            (id) => expandTargets.value[id]!.x === x && expandTargets.value[id]!.y === y
          )
          const color = raceId ? ownerColorMap.value[raceId]?.color : null
          if (color) {
            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.setLineDash([4, 4])
            ctx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2)
            ctx.setLineDash([])
          }
        }

        if (atkTargetSet.has(`${x},${y}`)) {
          const raceId = Object.keys(attackTargets.value).find(
            (id) => attackTargets.value[id]!.x === x && attackTargets.value[id]!.y === y
          )
          const color = raceId ? ownerColorMap.value[raceId]?.color : null
          if (color) {
            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.setLineDash([6, 4])
            ctx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2)
            ctx.setLineDash([])
          }
        }

        if (cell.captureProgress > 0 && cell.captureCost > 0) {
          const captureColor = cell.capturedBy ? ownerColorMap.value[cell.capturedBy]?.color ?? "#fff" : "#fff"
          ctx.fillStyle = captureColor
          const barW = Math.max(2, size - 4)
          const barH = 3
          const filled = (cell.captureProgress / cell.captureCost) * barW
          ctx.fillRect(x * size + 2, y * size + size - barH - 2, filled, barH)
          ctx.strokeStyle = captureColor
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.strokeRect(x * size + 2, y * size + size - barH - 2, barW, barH)
        }

        if (cell.attackProgress > 0 && cell.attackedBy) {
          const atkColor = ownerColorMap.value[cell.attackedBy]?.color ?? "#ff4444"
          ctx.fillStyle = atkColor
          const barW = Math.max(2, size - 4)
          const barH = 3
          const filled = (cell.attackProgress / 5) * barW
          ctx.globalAlpha = 0.8
          ctx.fillRect(x * size + 2, y * size + 2, filled, barH)
          ctx.globalAlpha = 1
          ctx.strokeStyle = atkColor
          ctx.lineWidth = 1
          ctx.setLineDash([])
          ctx.strokeRect(x * size + 2, y * size + 2, barW, barH)
        }

        if (cell.fabricOwnerId && !cell.fabricComplete && cell.fabricCost > 0) {
          const fabColor = ownerColorMap.value[cell.fabricOwnerId]?.color ?? "#fff"
          const barW = Math.max(2, size - 4)
          const barH = 2
          const filled = (cell.fabricProgress / cell.fabricCost) * barW
          ctx.fillStyle = fabColor
          ctx.globalAlpha = 0.6
          ctx.fillRect(x * size + 2, y * size + 2, filled, barH)
          ctx.globalAlpha = 1
        }

        const icon = cell.type === CellType.BASE
          ? "i-mdi-home"
          : cell.fabricComplete
            ? "i-mdi-factory"
            : cell.resourceType
              ? RESOURCE_ICONS[cell.resourceType]
              : null

        if (icon && size >= 8) {
          const color = (cell.type === CellType.BASE || cell.fabricComplete) && ownerColor
            ? ownerColor.color
            : ICON_COLORS[icon] ?? "rgba(255,255,255,0.7)"
          const iconCanvas = renderIcon(icon, size, color)
          if (iconCanvas) {
            ctx.drawImage(iconCanvas, x * size, y * size, size, size)
          }
        }
      }
    }
  }
}

function handleMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas || !props.cells) return
  const rect = canvas.getBoundingClientRect()
  const size = resolvedCellSize.value
  const x = Math.floor((e.clientX - rect.left + canvas.parentElement!.scrollLeft) / size)
  const y = Math.floor((e.clientY - rect.top + canvas.parentElement!.scrollTop) / size)

  const cell = props.cells[y]?.[x]
  if (cell) {
    hoverCell.value = { x, y, cell }
    tooltipPos.value = { x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 8 }
  } else {
    hoverCell.value = null
  }
  drawGrid()
}

function handleMouseLeave() {
  hoverCell.value = null
  drawGrid()
}

function handleClick(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas || !props.cells) return
  const rect = canvas.getBoundingClientRect()
  const size = resolvedCellSize.value
  const x = Math.floor((e.clientX - rect.left + canvas.parentElement!.scrollLeft) / size)
  const y = Math.floor((e.clientY - rect.top + canvas.parentElement!.scrollTop) / size)
  const cell = props.cells[y]?.[x]
  if (cell && cell.type === CellType.BASE && cell.ownerId) {
    emit("selectRace", cell.ownerId)
  }
}

const tooltipText = computed(() => {
  if (!hoverCell.value) return ""
  const { cell } = hoverCell.value
  const lines: string[] = []
  if (cell.type === CellType.BASE) lines.push("База")
  else if (cell.resourceType) lines.push(cell.resourceType)
  if (cell.captureProgress > 0 && cell.captureCost > 0) lines.push(`Захват: ${cell.captureProgress}/${cell.captureCost}`)
  if (cell.attackProgress > 0 && cell.attackedBy) {
    const attacker = props.races.find((r) => r.id === cell.attackedBy)
    if (attacker) lines.push(`Атака: ${attacker.name} ${cell.attackProgress}/5`)
  }
  if (cell.resourceAmount > 0) lines.push(`Ресурс: ${cell.resourceAmount}`)
  if (!cell.ownerId && cell.resourceType) {
    const capCost = RESOURCE_CAPTURE_COST[cell.resourceType]
    if (capCost > 0) lines.push(`Захват: ${capCost} циклов`)
    const fabCost = RESOURCE_FABRIC_COST[cell.resourceType]
    if (fabCost !== null && fabCost > 0) lines.push(`Фабрика: ${fabCost} циклов`)
  }
  if (cell.fabricOwnerId) {
    if (cell.fabricComplete) lines.push("Фабрика: готова")
    else lines.push(`Фабрика: ${cell.fabricProgress}/${cell.fabricCost}`)
  }
  if (cell.ownerId) {
    const race = props.races.find((r) => r.id === cell.ownerId)
    if (race) {
      lines.push(`Владелец: ${race.name}`)
      if (cell.type === CellType.BASE) {
        lines.push(`Приоритеты: exp ${race.priorities.expansion} / bld ${race.priorities.building} / war ${race.priorities.war} / rnf ${race.priorities.reinforcement}`)
        lines.push(`Ресурсы: meal ${race.resources.meal} water ${race.resources.water} material ${race.resources.material}`)
      }
    }
  }
  return lines.join("\n")
})

watch([resolvedCellSize, containerWidth, containerHeight, () => props.cells, ownerColorMap, expandTargets, attackTargets], drawGrid, { flush: "post" })

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  iconCache.clear()
  updateSize()
  resizeObserver = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(updateSize, 100)
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
  nextTick(drawGrid)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (resizeTimer) clearTimeout(resizeTimer)
})
</script>

<template>
  <div ref="containerRef" class="relative h-full w-full overflow-auto bg-black">
    <canvas ref="canvasRef" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @click="handleClick" />
    <div
      v-if="hoverCell && tooltipText"
      class="pointer-events-none absolute z-10 whitespace-pre rounded bg-card px-2 py-1 text-xs text-card-foreground shadow-lg"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      {{ tooltipText }}
    </div>
  </div>
</template>
