<script setup lang="ts">
const { state, selectedAction, playerCanAct, init, clickCell } = useGameState()
const { cellSize } = useZoom()

const mapWidth = ref(100)
const mapHeight = ref(100)
const raceCount = ref(3)
const resourceDensity = ref(40)
const isRunning = ref(false)

const emptyGridRef = ref<HTMLElement | null>(null)
const emptyGridWidth = ref(0)
const emptyGridHeight = ref(0)

function updateEmptyGridSize() {
  if (emptyGridRef.value) {
    emptyGridWidth.value = emptyGridRef.value.clientWidth
    emptyGridHeight.value = emptyGridRef.value.clientHeight
  }
}

onMounted(() => {
  updateEmptyGridSize()
  const observer = new ResizeObserver(updateEmptyGridSize)
  if (emptyGridRef.value) observer.observe(emptyGridRef.value)
  onUnmounted(() => observer.disconnect())
})

const emptyCellSize = computed(() => {
  if (cellSize.value === "fit") {
    const w = Math.floor(emptyGridWidth.value / mapWidth.value)
    const h = Math.floor(emptyGridHeight.value / mapHeight.value)
    return Math.max(1, Math.min(w, h))
  }
  return cellSize.value
})

const gridWidthPx = computed(() => mapWidth.value * emptyCellSize.value)
const gridHeightPx = computed(() => mapHeight.value * emptyCellSize.value)

function handleSettingsChange(settings: { width: number; height: number }) {
  mapWidth.value = settings.width
  mapHeight.value = settings.height
}

function handleGameStart() {
  init(mapWidth.value, mapHeight.value, raceCount.value, resourceDensity.value)
  isRunning.value = true
}

function handleGameRestart() {
  init(mapWidth.value, mapHeight.value, raceCount.value, resourceDensity.value)
}

function handleCellClick(pos: Position) {
  clickCell(pos)
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <header class="shrink-0 p-3">
      <TopBar />
    </header>

    <div class="flex flex-1 overflow-hidden">
      <main class="flex-1 overflow-hidden">
        <GameBoard
          v-if="state"
          :map="state.map"
          :selected-action="selectedAction"
          :is-waiting-action="playerCanAct"
          :cell-size="cellSize"
          @cell-click="handleCellClick"
        />
        <div
          v-else
          ref="emptyGridRef"
          class="h-full w-full overflow-auto bg-black"
        >
          <div
            class="relative"
            :style="{
              width: gridWidthPx + 'px',
              height: gridHeightPx + 'px',
              backgroundImage: `
                linear-gradient(to right, rgba(161, 98, 7, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(161, 98, 7, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: `${emptyCellSize}px ${emptyCellSize}px`,
            }"
          >
            <div
              class="absolute inset-0 pointer-events-none"
              :style="{
                border: '2px solid rgba(161, 98, 7, 0.7)',
              }"
            />
          </div>
        </div>
      </main>

      <aside class="shrink-0 border-l border-border bg-card p-3">
        <RightPanel
          :map-width="mapWidth"
          :map-height="mapHeight"
          :race-count="raceCount"
          :resource-density="resourceDensity"
          :is-running="isRunning"
          @settings-change="handleSettingsChange"
          @game-start="handleGameStart"
          @game-restart="handleGameRestart"
        />
      </aside>
    </div>
  </div>
</template>
