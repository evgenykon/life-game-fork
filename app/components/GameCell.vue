<script setup lang="ts">
const props = defineProps<{
  cell: Cell
  cellSize: number
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
</script>

<template>
  <button
    class="flex items-center justify-center text-xs"
    :class="[cell.isDepleted ? 'opacity-50' : '', isSelectedAction ? 'ring-1 ring-cyan-400' : '']"
    :style="{ width: cellSize + 'px', height: cellSize + 'px' }"
    @click="emit('click', cell.position)"
  >
    <Icon v-if="icon" :name="icon" :class="cell.type === CellType.BASE || cell.type === CellType.FABRIC ? 'text-lg' : 'text-sm'" />
  </button>
</template>
