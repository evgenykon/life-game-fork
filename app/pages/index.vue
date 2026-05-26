<script setup lang="ts">
const { mapHash, mapWidth, mapHeight, cells, races, meta, isRunning, startGame, loadFromHash } = useGameState()
const { cellSize } = useZoom()

const settingsWidth = ref(20)
const settingsHeight = ref(20)
const settingsRaceCount = ref(3)
const settingsDensity = ref(40)

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

  const hash = window.location.hash.slice(1)
  if (hash && hash.length === 16) {
    loadFromHash(hash, settingsWidth.value, settingsHeight.value)
  }
})

const emptyCellSize = computed(() => {
  if (cellSize.value === "fit") {
    const w = Math.floor(emptyGridWidth.value / settingsWidth.value)
    const h = Math.floor(emptyGridHeight.value / settingsHeight.value)
    return Math.max(1, Math.min(w, h))
  }
  return cellSize.value
})

const gridWidthPx = computed(() => settingsWidth.value * emptyCellSize.value)
const gridHeightPx = computed(() => settingsHeight.value * emptyCellSize.value)

function handleSettingsChange(settings: { width: number; height: number }) {
  settingsWidth.value = settings.width
  settingsHeight.value = settings.height
}

function handleGameStart() {
  startGame(settingsWidth.value, settingsHeight.value, settingsRaceCount.value, settingsDensity.value)
}

function handleGameRestart() {
  startGame(settingsWidth.value, settingsHeight.value, settingsRaceCount.value, settingsDensity.value)
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
          v-if="cells"
          :cell-size="cellSize"
          :cells="cells"
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
          :map-width="settingsWidth"
          :map-height="settingsHeight"
          :race-count="settingsRaceCount"
          :resource-density="settingsDensity"
          :is-running="isRunning"
          @settings-change="handleSettingsChange"
          @game-start="handleGameStart"
          @game-restart="handleGameRestart"
        />
      </aside>
    </div>
  </div>
</template>
