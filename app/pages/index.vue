<script setup lang="ts">
const {
  state,
  selectedAction,
  playerCanAct,
  playerRace,
  init,
  clickCell,
} = useGameState()

onMounted(() => {
  init(20, 20, 3)
})

function handleCellClick(pos: Position) {
  clickCell(pos)
}
</script>

<template>
  <div class="flex h-[calc(100vh-2rem)] flex-col gap-3">
    <div class="mt-2 flex items-stretch overflow-hidden rounded-lg border border-border bg-card p-2 shadow-sm">
      <div class="flex items-stretch divide-x divide-border">
        <div class="flex flex-col px-3 py-2">
          <span class="text-xs font-bold tabular-nums leading-none text-foreground">{{ state?.cycle ?? "—" }}</span>
          <span class="mt-0.5 text-[10px] leading-none text-muted-foreground">текущий цикл</span>
        </div>
        <div class="flex flex-col px-3 py-2">
          <span class="text-xs font-bold tabular-nums leading-none text-foreground">{{ state ? state.races.filter(r => r.alive).length : "—" }}<span class="text-muted-foreground/40">/{{ state?.races.length ?? "—" }}</span></span>
          <span class="mt-0.5 text-[10px] leading-none text-muted-foreground">рас в игре</span>
        </div>
      </div>
    </div>

    <div class="flex flex-1 gap-4">
      <div v-if="state" class="flex-1">
        <GameBoard
          :map="state.map"
          :selected-action="selectedAction"
          :is-waiting-action="playerCanAct"
          @cell-click="handleCellClick"
        />
      </div>
      <div v-else class="flex flex-1 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        Generating map...
      </div>

      <aside class="flex w-64 shrink-0 flex-col overflow-y-auto rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
      </aside>
    </div>
  </div>
</template>
