<script setup lang="ts">
import { ResourceType } from "~/utils/game-types"

const { cells, races, meta, isRunning, isPaused, gameOver, winner, startGame, togglePause } = useGameState()
const { cellSize } = useZoom()

const settingsWidth = ref(20)
const settingsHeight = ref(20)
const settingsRaceCount = ref(3)
const settingsDensity = ref(40)

const selectedRaceId = ref<string | null>(null)

function handleSelectRace(raceId: string) {
  selectedRaceId.value = selectedRaceId.value === raceId ? null : raceId
}

function handleCloseDrawer() {
  selectedRaceId.value = null
}

const selectedRace = computed(() => {
  if (!selectedRaceId.value) return null
  return races.value.find((r) => r.id === selectedRaceId.value) ?? null
})

const emptyGridRef = ref<HTMLElement | null>(null)
const emptyGridWidth = ref(0)
const emptyGridHeight = ref(0)

function updateEmptyGridSize() {
  if (emptyGridRef.value) {
    emptyGridWidth.value = emptyGridRef.value.clientWidth
    emptyGridHeight.value = emptyGridRef.value.clientHeight
  }
}

let emptyGridObserver: ResizeObserver | null = null

onMounted(() => {
  updateEmptyGridSize()
  emptyGridObserver = new ResizeObserver(updateEmptyGridSize)
  if (emptyGridRef.value) emptyGridObserver.observe(emptyGridRef.value)
})

onUnmounted(() => {
  if (emptyGridObserver) emptyGridObserver.disconnect()
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

const cycle = computed(() => meta.value?.cycle ?? 0)
const aliveCount = computed(() => races.value.filter((r) => r.alive).length)
const totalRaces = computed(() => races.value.length)

const resourceTotals = computed(() => {
  const totals: Record<string, number> = {}
  if (!cells.value) return totals
  for (const row of cells.value) {
    for (const cell of row) {
      if (cell.resourceType && cell.resourceAmount > 0) {
        totals[cell.resourceType] = (totals[cell.resourceType] ?? 0) + cell.resourceAmount
      }
    }
  }
  return totals
})

const resourceTypeOrder = Object.values(ResourceType)

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
    <header class="flex shrink-0 items-center gap-2 p-3">
      <TopBar
        :cycle="cycle"
        :alive-count="aliveCount"
        :total-races="totalRaces"
        :resource-totals="resourceTotals"
        :resource-type-order="resourceTypeOrder"
        class="flex-1"
      />
      <template v-if="cells">
        <button class="btn btn-primary btn-sm text-xs inline-flex items-center gap-1" @click="togglePause">
          <Icon :name="isPaused ? 'i-mdi-play' : 'i-mdi-pause'" class="h-3.5 w-3.5 shrink-0" />
          {{ isPaused ? "Продолжить" : "Пауза" }}
        </button>
        <button class="btn btn-outline btn-sm text-xs inline-flex items-center gap-1" @click="handleGameRestart">
          <Icon name="i-mdi-restart" class="h-3.5 w-3.5 shrink-0" />
          Рестарт
        </button>
      </template>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <main class="flex-1 overflow-hidden relative">
        <GameBoard
          v-if="cells"
          :cell-size="cellSize"
          :cells="cells"
          :races="races"
          @select-race="handleSelectRace"
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

        <div
          v-if="gameOver"
          class="absolute inset-0 z-20 flex items-center justify-center bg-black/70"
        >
          <div class="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-xl">
            <p class="text-xl font-bold">
              {{ winner ? `Победа: ${winner}` : "Ничья — все расы погибли" }}
            </p>
            <button class="btn btn-primary" @click="handleGameRestart">
              Новая игра
            </button>
          </div>
        </div>
      </main>

      <aside v-if="!cells" class="shrink-0 border-l border-border bg-card p-3">
        <RightPanel
          :map-width="settingsWidth"
          :map-height="settingsHeight"
          :race-count="settingsRaceCount"
          :resource-density="settingsDensity"
          :is-running="isRunning"
          :is-paused="isPaused"
          @settings-change="handleSettingsChange"
          @game-start="handleGameStart"
          @game-restart="handleGameRestart"
          @toggle-pause="togglePause"
        />
      </aside>
      <RaceDrawer
        v-if="selectedRace"
        :race="selectedRace"
        :cells="cells"
        class="shrink-0"
        @close="handleCloseDrawer"
      />
    </div>
  </div>
</template>
