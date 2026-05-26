<script setup lang="ts">
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "effus-ui"

const props = defineProps<{
  mapWidth: number
  mapHeight: number
  raceCount: number
  resourceDensity: number
  isRunning: boolean
  isPaused: boolean
}>()

const emit = defineEmits<{
  settingsChange: [{ width: number; height: number }]
  gameStart: []
  gameRestart: []
  togglePause: []
  openBalance: []
}>()

const mapWidth = ref(props.mapWidth)
const mapHeight = ref(props.mapHeight)
const raceCount = ref(props.raceCount)
const resourceDensity = ref(props.resourceDensity)

const emitSettings = useDebounceFn(() => {
  emit("settingsChange", { width: mapWidth.value, height: mapHeight.value })
}, 300)

function handleRestart() {
  emit("gameRestart")
}
</script>

<template>
  <div class="flex h-full w-72 flex-col gap-4 overflow-y-auto">
    <Card>
      <CardHeader>
        <CardTitle class="text-xl font-semibold">Стартовые параметры</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <Label>Ширина</Label>
          <Input :value="mapWidth" type="number" :disabled="isRunning" @update:value="(v) => { mapWidth = Number(v); emitSettings() }" />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Высота</Label>
          <Input :value="mapHeight" type="number" :disabled="isRunning" @update:value="(v) => { mapHeight = Number(v); emitSettings() }" />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Количество рас</Label>
          <Input :value="raceCount" type="number" :disabled="isRunning" @update:value="(v) => raceCount = Number(v)" />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Плотность ресурсов (%)</Label>
          <Input :value="resourceDensity" type="number" :disabled="isRunning" @update:value="(v) => resourceDensity = Number(v)" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="flex flex-col gap-2 pt-4">
        <Button
          variant="default"
          class="flex items-center"
          @click="isRunning ? emit('togglePause') : emit('gameStart')"
        >
          <Icon :name="isRunning && !isPaused ? 'i-mdi-pause' : 'i-mdi-play'" class="mr-1" />
          {{ !isRunning ? "Старт" : isPaused ? "Продолжить" : "Пауза" }}
        </Button>
        <Button variant="outline" class="flex items-center" :disabled="!isRunning" @click="handleRestart">
          <Icon name="i-mdi-restart" class="mr-1" />
          Рестарт
        </Button>
        <Button variant="outline" class="flex items-center" @click="emit('openBalance')">
          <Icon name="i-mdi-chart-box-outline" class="mr-1" />
          Баланс
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
