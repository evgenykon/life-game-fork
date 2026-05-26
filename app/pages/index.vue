<script setup lang="ts">
import { Button, Tag, Header } from "effus-ui"

const {
  state,
  selectedAction,
  validationError,
  currentRace,
  playerRace,
  isGameOver,
  playerCanAct,
  allAliveActed,
  init,
  selectAction,
  clickCell,
  skipTurn,
  advanceToNextAliveRace,
  advanceCycle,
} = useGameState()

const mapWidth = ref(20)
const mapHeight = ref(20)
const raceCount = ref(3)

onMounted(() => {
  startGame()
})

function startGame() {
  init(mapWidth.value, mapHeight.value, raceCount.value)
}

function handleCellClick(pos: Position) {
  clickCell(pos)
}

const actionTypes = [
  { type: "occupy" as const, label: "Occupy", icon: "i-mdi-arrow-expand" },
  { type: "build_factory" as const, label: "Factory", icon: "i-mdi-factory" },
  { type: "build_base" as const, label: "Base", icon: "i-mdi-home" },
  { type: "attack" as const, label: "Attack", icon: "i-mdi-sword" },
]

const presets = [
  { w: 15, h: 15, races: 2, label: "Quick" },
  { w: 20, h: 20, races: 3, label: "Standard" },
  { w: 30, h: 30, races: 5, label: "Large" },
  { w: 15, h: 15, races: 4, label: "Crowded" },
]

function applyPreset(p: { w: number; h: number; races: number }) {
  mapWidth.value = p.w
  mapHeight.value = p.h
  raceCount.value = p.races
}
</script>

<template>
  <div class="h-[calc(100vh-8rem)] pt-4">
    <div v-if="state" class="h-full">
      <GameBoard
        :map="state.map"
        :selected-action="selectedAction"
        :is-waiting-action="playerCanAct"
        @cell-click="handleCellClick"
      />
    </div>
    <div v-else class="flex h-full items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
      Generating map...
    </div>
  </div>
    <div v-else class="flex flex-1 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
      Generating map...
    </div>


  </div>
</template>
