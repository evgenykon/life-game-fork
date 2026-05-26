const CELL_SIZES = ['fit', 5, 10, 15, 20, 25, 30, 35, 40, 45, 50] as const
export type CellSize = (typeof CELL_SIZES)[number]

let sharedCellSize: Ref<CellSize> | null = null

export const useZoom = () => {
  if (!sharedCellSize) {
    sharedCellSize = ref<CellSize>('fit')
  }

  const size = sharedCellSize

  function zoomIn() {
    const idx = CELL_SIZES.indexOf(size.value)
    if (idx < CELL_SIZES.length - 1) {
      size.value = CELL_SIZES[idx + 1]!
    }
  }

  function zoomOut() {
    const idx = CELL_SIZES.indexOf(size.value)
    if (idx > 0) {
      size.value = CELL_SIZES[idx - 1]!
    }
  }

  function zoomBy(delta: number) {
    const idx = CELL_SIZES.indexOf(size.value)
    const next = idx + (delta < 0 ? 1 : -1)
    if (next >= 0 && next < CELL_SIZES.length) {
      size.value = CELL_SIZES[next]!
    }
  }

  function getResolvedCellSize(containerWidth: number, containerHeight: number, gridW: number, gridH: number) {
    if (size.value === 'fit') {
      const w = Math.floor(containerWidth / gridW)
      const h = Math.floor(containerHeight / gridH)
      return Math.max(1, Math.min(w, h))
    }
    return size.value
  }

  function adjustScrollForZoom(
    el: HTMLElement,
    mouseX: number,
    mouseY: number,
    oldSize: number,
    newSize: number,
  ) {
    const ratio = newSize / oldSize
    const centerX = el.scrollLeft + el.clientWidth / 2
    const centerY = el.scrollTop + el.clientHeight / 2
    el.scrollLeft = Math.round(centerX * ratio - el.clientWidth / 2)
    el.scrollTop = Math.round(centerY * ratio - el.clientHeight / 2)
  }

  return { cellSize: size, zoomIn, zoomOut, zoomBy, getResolvedCellSize, adjustScrollForZoom }
}
