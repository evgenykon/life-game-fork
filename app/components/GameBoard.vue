<script setup lang="ts">
const props = defineProps<{
  cellSize: number | "fit"
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const GRID_SIZE = 20

const containerWidth = ref(0)
const containerHeight = ref(0)

let resizeTimer: ReturnType<typeof setTimeout> | null = null

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

function drawGrid() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

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
}

watch([resolvedCellSize, containerWidth, containerHeight], drawGrid, { flush: "post" })

onMounted(() => {
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
  <div ref="containerRef" class="h-full w-full overflow-auto bg-black">
    <canvas ref="canvasRef" />
  </div>
</template>
