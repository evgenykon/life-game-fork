<script setup lang="ts">
const props = defineProps<{
  map: Cell[][]
  selectedAction: GameAction["type"] | null
  isWaitingAction: boolean
}>()

const emit = defineEmits<{
  cellClick: [pos: Position]
}>()

function handleCellClick(pos: Position) {
  emit("cellClick", pos)
}

const gridSize = computed(() => props.map[0]?.length ?? 1)

const containerRef = ref<HTMLElement | null>(null)
const gridHeight = ref(0)

function updateGridSize() {
  if (containerRef.value) {
    gridHeight.value = containerRef.value.clientWidth
  }
}

onMounted(() => {
  updateGridSize()
  const observer = new ResizeObserver(updateGridSize)
  if (containerRef.value) observer.observe(containerRef.value)
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div
    ref="containerRef"
    class="h-full overflow-auto bg-black"
  >
    <div
      class="grid"
      :style="{
        height: gridHeight + 'px',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }"
    >
      <template v-for="(row, y) in map" :key="y">
        <GameCell
          v-for="(cell, x) in row"
          :key="`${x}-${y}`"
          :cell="cell"
          :is-selected-action="isWaitingAction && selectedAction !== null"
          @click="handleCellClick"
        />
      </template>
    </div>
  </div>
</template>
