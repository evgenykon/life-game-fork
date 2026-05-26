<script setup lang="ts">
import type { GameAction } from "~/utils/game-engine"

const props = defineProps<{
  map: Cell[][]
  selectedAction: GameAction["type"] | null
  isWaitingAction: boolean
  cellSize: number | "fit"
}>()

const emit = defineEmits<{
  cellClick: [pos: Position]
}>()

function handleCellClick(pos: Position) {
  emit("cellClick", pos)
}

const gridSize = computed(() => props.map[0]?.length ?? 1)
const gridHeight = computed(() => props.map.length ?? 1)

const containerRef = ref<HTMLElement | null>(null)
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
})

const { getResolvedCellSize } = useZoom()

const resolvedCellSize = computed(() =>
  getResolvedCellSize(containerWidth.value, containerHeight.value, gridSize.value, gridHeight.value),
)
</script>

<template>
  <div ref="containerRef" class="h-full w-full overflow-auto bg-black">
    <div
      class="grid"
      :style="{
        gridTemplateColumns: `repeat(${gridSize}, ${resolvedCellSize}px)`,
        gridTemplateRows: `repeat(${gridHeight}, ${resolvedCellSize}px)`,
      }"
    >
      <template v-for="(row, y) in map" :key="y">
        <GameCell
          v-for="(cell, x) in row"
          :key="`${x}-${y}`"
          :cell="cell"
          :cell-size="resolvedCellSize"
          :is-selected-action="isWaitingAction && selectedAction !== null"
          @click="handleCellClick"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.grid > * {
  border: 1px dashed rgba(161, 98, 7, 0.3);
}
</style>
