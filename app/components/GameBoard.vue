<script setup lang="ts">
import { RESOURCE_ICONS, CellType } from "~/utils/game-types"
import { ICON_COLORS } from "~/utils/icon-paths"
import type { CellData } from "~/utils/game-types"

const props = defineProps<{
  cellSize: number | "fit"
  cells: CellData[][] | null
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

async function renderIcon(iconName: string, size: number, color: string): Promise<HTMLCanvasElement> {
  const cacheKey = `v3-${iconName}-${size}-${color}`
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!

  const iconSize = size * 0.6
  const offset = (size - iconSize) / 2

  const raw = iconName.replace('i-', '')
  let collection: string
  let name: string
  
  if (raw.includes(':')) {
    [collection, name] = raw.split(':')
  } else {
    const parts = raw.split('-')
    collection = parts[0]!
    name = parts.slice(1).join('-')
  }
  
  const url = `https://api.iconify.design/${collection}/${name}.svg?color=${encodeURIComponent(color)}`

  const response = await fetch(url)
  const svgText = await response.text()

  const blob = new Blob([svgText], { type: 'image/svg+xml' })
  const imgUrl = URL.createObjectURL(blob)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = imgUrl
  })
  URL.revokeObjectURL(imgUrl)

  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  const ctx = offscreen.getContext('2d')!
  ctx.drawImage(img, offset, offset, iconSize, iconSize)
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
    for (let y = 0; y < props.cells.length && y < GRID_SIZE; y++) {
      const row = props.cells[y]
      if (!row) continue
      for (let x = 0; x < row.length && x < GRID_SIZE; x++) {
        const cell = row[x]
        if (!cell) continue

        const icon = cell.type === CellType.BASE
          ? "i-mdi-home"
          : cell.resourceType
            ? RESOURCE_ICONS[cell.resourceType]
            : null

        if (icon && size >= 8) {
          const color = ICON_COLORS[icon] ?? "rgba(255,255,255,0.7)"
          renderIcon(icon, size, color).then((iconCanvas) => {
            if (props.cells?.[y]?.[x]) {
              ctx.drawImage(iconCanvas, x * size, y * size, size, size)
            }
          })
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

const tooltipText = computed(() => {
  if (!hoverCell.value) return ""
  const { cell } = hoverCell.value
  const lines: string[] = []
  if (cell.type === CellType.BASE) lines.push("База")
  else if (cell.resourceType) lines.push(cell.resourceType)
  if (cell.resourceAmount > 0) lines.push(`Ресурс: ${cell.resourceAmount}`)
  if (cell.fabricOwnerId) lines.push(`Фабрика: ${cell.fabricProgress}/${cell.fabricCost}`)
  if (cell.ownerId) lines.push(`Владелец: ${cell.ownerId}`)
  return lines.join("\n")
})

watch([resolvedCellSize, containerWidth, containerHeight, () => props.cells], drawGrid, { flush: "post" })

onMounted(() => {
  iconCache.clear()
  updateSize()
  const observer = new ResizeObserver(() => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(updateSize, 100)
  })
  if (containerRef.value) observer.observe(containerRef.value)
  onUnmounted(() => {
    observer.disconnect()
    if (resizeTimer) clearTimeout(resizeTimer)
  })
  nextTick(drawGrid)
})
</script>

<template>
  <div ref="containerRef" class="relative h-full w-full overflow-auto bg-black">
    <canvas ref="canvasRef" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" />
    <div
      v-if="hoverCell && tooltipText"
      class="pointer-events-none absolute z-10 whitespace-pre rounded bg-card px-2 py-1 text-xs text-card-foreground shadow-lg"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      {{ tooltipText }}
    </div>
  </div>
</template>
