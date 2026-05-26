<script setup lang="ts">
import { ResourceType } from "~/utils/game-types"
import { balance } from "~/utils/balance"
import { Button } from "effus-ui"

const { cells, races, meta, isRunning, isPaused, gameOver, winner, startGame, togglePause, stopGame } = useGameState()
const { cellSize } = useZoom()

const settingsWidth = ref(20)
const settingsHeight = ref(20)
const settingsRaceCount = ref(3)
const settingsDensity = ref(40)

const selectedRaceId = ref<string | null>(null)
const menuOpen = ref(false)
const showBalanceModal = ref(false)

const winnerRace = computed(() => races.value.find((r) => r.name === winner.value))

const resourceTypes = Object.values(ResourceType)
const draftBalance = ref<typeof balance>(JSON.parse(JSON.stringify(balance)))

function polylinePoints(data: number[], w: number, h: number): string {
  if (data.length < 2) return ""
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = (w - 8) / Math.max(data.length - 1, 1)
  return data
    .map((v, i) => {
      const x = 4 + i * stepX
      const y = h - 4 - ((v - min) / range) * (h - 8)
      return `${x},${y}`
    })
    .join(" ")
}

function dominantPriorityLabel(race: typeof races.value[number]): string {
  const labels: Record<string, string> = {
    expansion: "расширение",
    building: "строительство",
    war: "война",
    reinforcement: "укрепление",
  }
  const entries = Object.entries(race.priorities).sort(([, a], [, b]) => b - a)
  const top = entries[0]
  return top ? `${labels[top[0]] ?? top[0]} ${top[1]}%` : "—"
}

function openBalanceModal() {
  draftBalance.value = JSON.parse(JSON.stringify(balance))
  showBalanceModal.value = true
}

function submitBalance() {
  Object.assign(balance, draftBalance.value)
  showBalanceModal.value = false
}

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
      </template>

      <div class="relative shrink-0">
        <button class="btn btn-ghost btn-sm" @click="menuOpen = !menuOpen">
          <Icon name="i-mdi-menu" />
        </button>
        <div
          v-if="menuOpen"
          class="absolute right-0 top-full z-30 mt-1 w-40 rounded border border-border bg-card py-1 shadow-lg"
        >
          <button class="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent" @click="togglePause(); menuOpen = false">
            <Icon :name="isPaused ? 'i-mdi-play' : 'i-mdi-pause'" class="h-4 w-4" />
            {{ isPaused ? "Продолжить" : "Пауза" }}
          </button>
          <button class="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent" @click="handleGameRestart(); menuOpen = false">
            <Icon name="i-mdi-restart" class="h-4 w-4" />
            Рестарт
          </button>
          <hr class="mx-2 my-1 border-border" />
          <button class="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent" @click="stopGame(); menuOpen = false">
            <Icon name="i-mdi-stop" class="h-4 w-4" />
            Стоп
          </button>
        </div>
        <div
          v-if="menuOpen"
          class="fixed inset-0 z-20"
          @click="menuOpen = false"
        />
      </div>
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
          <div v-if="winnerRace" class="flex w-80 flex-col gap-4 rounded-lg bg-card p-6 shadow-xl">
            <h2 class="text-center text-xl font-bold" :style="{ color: winnerRace.color }">
              {{ winner }}
            </h2>

            <div class="flex flex-col gap-3 text-xs text-muted-foreground">
              <div>
                <div class="mb-1 font-medium text-foreground">Ресурсы</div>
                <svg width="260" height="80" class="w-full">
                  <polyline v-if="polylinePoints(winnerRace.history.meal, 260, 80)" :points="polylinePoints(winnerRace.history.meal, 260, 80)" fill="none" stroke="#f59e0b" stroke-width="1.5" />
                  <polyline v-if="polylinePoints(winnerRace.history.water, 260, 80)" :points="polylinePoints(winnerRace.history.water, 260, 80)" fill="none" stroke="#3b82f6" stroke-width="1.5" />
                  <polyline v-if="polylinePoints(winnerRace.history.material, 260, 80)" :points="polylinePoints(winnerRace.history.material, 260, 80)" fill="none" stroke="#a855f7" stroke-width="1.5" />
                </svg>
              </div>

              <div>
                <div class="mb-1 font-medium text-foreground">Территория</div>
                <svg width="260" height="80" class="w-full">
                  <polyline v-if="polylinePoints(winnerRace.history.territory, 260, 80)" :points="polylinePoints(winnerRace.history.territory, 260, 80)" fill="none" :stroke="winnerRace.color" stroke-width="1.5" />
                </svg>
              </div>

              <div class="flex justify-between">
                <span>Клеток</span>
                <span class="tabular-nums font-semibold">{{ winnerRace.controlledCells.length }}</span>
              </div>
              <div class="flex justify-between">
                <span>Приоритет</span>
                <span class="tabular-nums font-semibold">{{ dominantPriorityLabel(winnerRace) }}</span>
              </div>
            </div>

            <button class="btn btn-primary btn-sm" @click="handleGameRestart">
              Новая игра
            </button>
          </div>

          <div v-else class="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-xl">
            <p class="text-xl font-bold">Ничья — все расы погибли</p>
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
          @open-balance="openBalanceModal"
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

  <div
    v-if="showBalanceModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    @click="showBalanceModal = false"
  >
    <div
      class="flex max-h-[80vh] w-96 flex-col rounded-lg border border-border bg-card shadow-xl"
      @click.stop
    >
      <div class="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 class="text-lg font-semibold">Баланс</h2>
        <button class="btn btn-ghost btn-sm" @click="showBalanceModal = false">
          <Icon name="i-mdi-close" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-6 py-4">

      <div class="space-y-4 text-xs text-muted-foreground">
        <div>
          <div class="mb-1 font-medium text-foreground">Общее</div>
          <div class="space-y-1">
            <label class="flex items-center justify-between gap-2">
              <span>Ресурс на клетку</span>
              <input v-model.number="draftBalance.RESOURCE_AMOUNT" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
            <label class="flex items-center justify-between gap-2">
              <span>Стартовые ресурсы расы</span>
              <span class="flex gap-1">
                <input v-model.number="draftBalance.RACE_START_RESOURCES.meal" class="w-12 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" title="meal" />
                <input v-model.number="draftBalance.RACE_START_RESOURCES.water" class="w-12 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" title="water" />
                <input v-model.number="draftBalance.RACE_START_RESOURCES.material" class="w-12 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" title="material" />
              </span>
            </label>
            <label class="flex items-center justify-between gap-2">
              <span>Мин. дистанция рас</span>
              <input v-model.number="draftBalance.MIN_RACE_DISTANCE" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
            <label class="flex items-center justify-between gap-2">
              <span>Восстановление истощения</span>
              <input v-model.number="draftBalance.DEPLETION_RECOVERY_CYCLES" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
          </div>
        </div>

        <div>
          <div class="mb-1 font-medium text-foreground">Содержание расы / цикл</div>
          <div class="flex gap-2">
            <label class="flex items-center gap-1">
              <span>meal</span>
              <input v-model.number="draftBalance.RACE_MAINTENANCE.meal" class="w-12 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
            <label class="flex items-center gap-1">
              <span>water</span>
              <input v-model.number="draftBalance.RACE_MAINTENANCE.water" class="w-12 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
            <label class="flex items-center gap-1">
              <span>material</span>
              <input v-model.number="draftBalance.RACE_MAINTENANCE.material" class="w-12 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
          </div>
        </div>

        <div>
          <div class="mb-1 font-medium text-foreground">Захват / Фабрика (циклов)</div>
          <div class="space-y-1">
            <div v-for="rt in resourceTypes" :key="rt" class="flex items-center justify-between gap-2">
              <span>{{ rt }}</span>
              <span class="flex items-center gap-1">
                <input v-model.number="draftBalance.RESOURCE_CAPTURE_COST[rt]" class="w-12 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" title="захват" />
                <template v-if="draftBalance.RESOURCE_FABRIC_COST[rt] !== null">
                  <input v-model.number="draftBalance.RESOURCE_FABRIC_COST[rt]" class="w-12 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" title="фабрика" />
                </template>
                <span v-else class="text-[10px] text-muted-foreground">нет фаб</span>
              </span>
            </div>
          </div>
        </div>

        <div>
          <div class="mb-1 font-medium text-foreground">Доход с фабрики / цикл</div>
          <div class="space-y-1">
            <div v-for="rt in resourceTypes" :key="rt" class="flex items-center justify-between gap-2">
              <span>{{ rt }}</span>
              <span v-if="draftBalance.RESOURCE_YIELDS[rt].meal || draftBalance.RESOURCE_YIELDS[rt].water || draftBalance.RESOURCE_YIELDS[rt].material" class="flex gap-1">
                <label class="flex items-center gap-0.5">
                  <span class="text-[10px]">m</span>
                  <input v-model.number="draftBalance.RESOURCE_YIELDS[rt].meal" class="w-10 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
                </label>
                <label class="flex items-center gap-0.5">
                  <span class="text-[10px]">w</span>
                  <input v-model.number="draftBalance.RESOURCE_YIELDS[rt].water" class="w-10 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
                </label>
                <label class="flex items-center gap-0.5">
                  <span class="text-[10px]">mat</span>
                  <input v-model.number="draftBalance.RESOURCE_YIELDS[rt].material" class="w-10 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
                </label>
              </span>
              <span v-else class="text-[10px] text-muted-foreground">нет</span>
            </div>
          </div>
        </div>

        <div>
          <div class="mb-1 font-medium text-foreground">Бой</div>
          <div class="space-y-1">
            <label class="flex items-center justify-between gap-2">
              <span>Длительность атаки</span>
              <input v-model.number="draftBalance.ATTACK_DURATION" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
            <label class="flex items-center justify-between gap-2">
              <span>Освобождение (окружён)</span>
              <input v-model.number="draftBalance.LIBERATION_DURATION" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
            <label class="flex items-center justify-between gap-2">
              <span>Порог войны (приоритет)</span>
              <input v-model.number="draftBalance.WAR_THRESHOLD" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
          </div>
        </div>

        <div>
          <div class="mb-1 font-medium text-foreground">Реприоритизация</div>
          <div class="space-y-1">
            <label class="flex items-center justify-between gap-2">
              <span>Порог истощения (%)</span>
              <input v-model.number="draftBalance.REPRIORITIZE_THRESHOLD" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
            <label class="flex items-center justify-between gap-2">
              <span>Перезарядка (циклов)</span>
              <input v-model.number="draftBalance.REPRIORITIZE_COOLDOWN" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
            <label class="flex items-center justify-between gap-2">
              <span>Сдвиг приоритета</span>
              <input v-model.number="draftBalance.REPRIORITIZE_SHIFT" class="w-16 rounded border border-border bg-black px-1 py-0.5 text-right text-xs tabular-nums" />
            </label>
          </div>
        </div>
      </div>

    </div>

    <div class="flex justify-end gap-2 border-t border-border px-6 py-3">
      <Button variant="outline" class="flex items-center text-xs" @click="showBalanceModal = false">Отмена</Button>
      <Button variant="default" class="flex items-center text-xs" @click="submitBalance">Применить</Button>
    </div>
    </div>
  </div>
</template>
