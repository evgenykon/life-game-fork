<script setup lang="ts">
const props = defineProps<{
  cell: Cell
  isSelectedAction?: boolean
}>()

const emit = defineEmits<{
  click: [pos: Position]
}>()

const icon = computed(() => {
  if (props.cell.type === CellType.SHADOWED) return ""
  if (props.cell.type === CellType.BASE) return "i-mdi-home"
  if (props.cell.type === CellType.FABRIC) return "i-mdi-factory"
  if (props.cell.resourceType) return RESOURCE_ICONS[props.cell.resourceType] ?? "i-mdi-help-circle-outline"
  return "i-mdi-help-circle-outline"
})

const resourceRatio = computed(() => {
  if (!props.cell.resourceType) return 0
  return Math.max(0, props.cell.resourceAmount / RESOURCE_START_AMOUNT)
})

const resourceBarColor = computed(() => {
  if (resourceRatio.value > 0.5) return "bg-green-500"
  if (resourceRatio.value > 0.25) return "bg-yellow-500"
  return "bg-red-500"
})

const buildRatio = computed(() => {
  if (!props.cell.fabricOwnerId || props.cell.fabricComplete) return 0
  return Math.min(1, props.cell.fabricProgress / props.cell.fabricCost)
})

const attackMax = computed(() => {
  if (!props.cell.attackedBy) return 0
  if (props.cell.type === CellType.BASE) return BASE_CAPTURE_CYCLES
  if (props.cell.type === CellType.FABRIC) return props.cell.fabricCost || 10
  return BASE_DESTROY_CYCLES
})

const showResourceBar = computed(() => {
  return props.cell.resourceType && props.cell.type !== CellType.BASE && resourceRatio.value > 0
})

const showBuildBar = computed(() => {
  return buildRatio.value > 0
})

const showAttackBar = computed(() => {
  return props.cell.attackedBy && attackMax.value > 0
})

const boxShadow = computed(() => {
  if (props.isSelectedAction) return "inset 0 0 0 2px #22d3ee"
  if (props.cell.attackedBy) return "inset 0 0 0 2px #ef4444"
  return "none"
})
</script>

<template>
  <button
    class="relative flex cursor-pointer items-center justify-center text-xs transition-all hover:z-10 hover:scale-110"
    :class="cell.isDepleted ? 'opacity-50' : ''"
    :style="{
      backgroundColor: cell.type === CellType.SHADOWED ? '#050505' : '#000',
      border: '1px solid #a16207',
      outline: 0,
      appearance: 'none',
      boxShadow: boxShadow,
    }"
    @click="emit('click', cell.position)"
  >
    <span v-if="icon" :class="[icon, cell.type === CellType.BASE || cell.type === CellType.FABRIC ? 'text-lg' : 'text-sm']" />

    <div
      v-if="showResourceBar"
      class="pointer-events-none absolute bottom-0 left-0 right-0 h-0.5"
    >
      <div
        class="h-full transition-all"
        :class="resourceBarColor"
        :style="{ width: `${resourceRatio * 100}%` }"
      />
    </div>

    <div
      v-if="showBuildBar"
      class="pointer-events-none absolute top-0 left-0 right-0 h-0.5"
    >
      <div
        class="h-full bg-cyan-400 transition-all"
        :style="{ width: `${buildRatio * 100}%` }"
      />
    </div>

    <div
      v-if="showAttackBar"
      class="pointer-events-none absolute top-0 left-0 right-0 h-0.5"
    >
      <div
        class="h-full bg-red-500 transition-all"
        :style="{ width: `${Math.min(1, props.cell.attackProgress / attackMax) * 100}%` }"
      />
    </div>

    <span
      v-if="cell.ownerId && cell.type !== CellType.BASE"
      class="pointer-events-none absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full border border-black"
      :style="{ backgroundColor: RACE_COLORS_HEX[Number(cell.ownerId.replace('race_', '')) % RACE_COLORS_HEX.length] }"
    />
  </button>
</template>
