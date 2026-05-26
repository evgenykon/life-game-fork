<script setup lang="ts">
import { Button, Tag } from "effus-ui"

const { cellSize, zoomIn, zoomOut } = useZoom()

const isMinZoom = computed(() => cellSize.value === "fit")
const isMaxZoom = computed(() => cellSize.value === 50)

const zoomLabel = computed(() => (cellSize.value === "fit" ? "fit" : `${cellSize.value}px`))
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold">—</span>
        <Tag variant="primary">цикл</Tag>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold">—</span>
        <Tag variant="primary">расы</Tag>
      </div>
    </div>

    <div class="flex items-center gap-1">
      <Button variant="outline" size="sm" :disabled="isMinZoom" @click="zoomOut">
        <Icon name="i-mdi-minus" />
      </Button>
      <span class="px-2 text-xs tabular-nums text-muted-foreground">{{ zoomLabel }}</span>
      <Button variant="outline" size="sm" :disabled="isMaxZoom" @click="zoomIn">
        <Icon name="i-mdi-plus" />
      </Button>
    </div>
  </div>
</template>
