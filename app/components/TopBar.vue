<script setup lang="ts">
import { ResourceType, RESOURCE_ICONS } from "~/utils/game-types"
import { ICON_COLORS } from "~/utils/icon-paths"

const props = defineProps<{
  cycle: number
  aliveCount: number
  totalRaces: number
  resourceTotals: Record<string, number>
  resourceTypeOrder: ResourceType[]
}>()

const { cellSize, zoomIn, zoomOut } = useZoom()

const isMinZoom = computed(() => cellSize.value === "fit")
const isMaxZoom = computed(() => cellSize.value === 50)

const zoomLabel = computed(() => (cellSize.value === "fit" ? "fit" : `${cellSize.value}px`))
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1.5">
        <span class="text-sm tabular-nums font-semibold">{{ cycle }}</span>
        <span class="text-xs text-muted-foreground">цикл</span>
      </div>
    <div class="flex items-center gap-1.5">
      <span class="text-sm tabular-nums font-semibold">{{ aliveCount }}/{{ totalRaces }}</span>
      <span class="text-xs text-muted-foreground">расы</span>
    </div>
    </div>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div
        v-for="rt in resourceTypeOrder"
        :key="rt"
        v-show="resourceTotals[rt] !== undefined"
        class="flex items-center gap-1 text-xs"
      >
        <Icon
          :name="RESOURCE_ICONS[rt]"
          :color="ICON_COLORS[RESOURCE_ICONS[rt]] ?? '#fff'"
          class="h-4 w-4"
        />
        <span class="tabular-nums">{{ resourceTotals[rt] ?? 0 }}</span>
      </div>
    </div>

    <div class="flex items-center gap-1 shrink-0">
      <button variant="outline" size="sm" :disabled="isMinZoom" class="btn btn-outline btn-sm" @click="zoomOut">
        <Icon name="i-mdi-minus" />
      </button>
      <span class="px-2 text-xs tabular-nums text-muted-foreground">{{ zoomLabel }}</span>
      <button variant="outline" size="sm" :disabled="isMaxZoom" class="btn btn-outline btn-sm" @click="zoomIn">
        <Icon name="i-mdi-plus" />
      </button>
    </div>

    <div class="h-5 w-px bg-white/20" />
  </div>
</template>
