import type { CellData, MapMeta } from "~/utils/game-types"

export function generateHash(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function clearOldStorage(oldHash: string | null) {
  if (!oldHash) return
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(`${oldHash}-`)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

export function saveMapToStorage(hash: string, width: number, height: number, getCell: (x: number, y: number) => CellData, meta: MapMeta) {
  localStorage.setItem(`${hash}-meta`, JSON.stringify(meta))
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      localStorage.setItem(`${hash}-${x}-${y}`, JSON.stringify(getCell(x, y)))
    }
  }
}

export function loadMapFromStorage(hash: string, width: number, height: number): { meta: MapMeta; cells: CellData[][] } | null {
  try {
    const metaStr = localStorage.getItem(`${hash}-meta`)
    if (!metaStr) return null
    const meta = JSON.parse(metaStr) as MapMeta
    if (meta.width !== width || meta.height !== height) return null

    const cells: CellData[][] = []
    for (let y = 0; y < height; y++) {
      const row: CellData[] = []
      for (let x = 0; x < width; x++) {
        const cellStr = localStorage.getItem(`${hash}-${x}-${y}`)
        if (!cellStr) return null
        row.push(JSON.parse(cellStr))
      }
      cells.push(row)
    }
    return { meta, cells }
  } catch {
    return null
  }
}
