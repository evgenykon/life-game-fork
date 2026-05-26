export const useGameState = () => {
  const state = ref<{ running: boolean } | null>(null)

  function start() {
    state.value = { running: true }
  }

  function stop() {
    state.value = null
  }

  return { state, start, stop }
}
