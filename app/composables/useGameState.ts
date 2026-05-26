export const useGameState = () => {
  const state = ref<GameState | null>(null)
  const selectedAction = ref<GameAction["type"] | null>(null)
  const validationError = ref<string | null>(null)

  function init(width: number, height: number, races: number) {
    state.value = initGameState(width, height, races)
    selectedAction.value = null
    validationError.value = null
  }

  function selectAction(action: GameAction["type"] | null) {
    selectedAction.value = action
    validationError.value = null
  }

  function clickCell(pos: Position) {
    if (!state.value || !selectedAction.value) return
    const action: GameAction = { type: selectedAction.value, target: pos }
    const err = validateAction(state.value, action)
    if (err) {
      validationError.value = err
      return
    }
    state.value = applyAction(state.value, action)
    selectedAction.value = null
    validationError.value = null
  }

  function skipTurn() {
    if (!state.value) return
    state.value = applyAction(state.value, { type: "skip" })
    selectedAction.value = null
  }

  function advanceToNextAliveRace() {
    if (!state.value || state.value.turnPhase === TurnPhase.COMPLETED) return false

    const aliveIds = state.value.races.filter((r) => r.alive).map((r) => r.id)
    const allActed = aliveIds.every((id) => state.value!.actedThisCycle.includes(id))
    if (allActed) return false // cycle done

    let cycles = 0
    while (cycles < state.value.races.length * 2) {
      state.value = nextTurn(state.value)
      if (state.value.turnPhase === TurnPhase.COMPLETED) return false
      if (state.value.currentRaceIndex === 0) {
        const allDone = aliveIds.every((id) => state.value!.actedThisCycle.includes(id))
        if (allDone) return false
      }
      cycles++
    }
    return true
  }

  function advanceCycle() {
    if (!state.value) return
    state.value = endCycle(state.value)
  }

  const currentRace = computed(() => {
    if (!state.value) return null
    return state.value.races[state.value.currentRaceIndex] ?? null
  })

  const isGameOver = computed(() => {
    return state.value?.turnPhase === TurnPhase.COMPLETED
  })

  const playerRace = computed(() => {
    return state.value?.races[0] ?? null
  })

  const isPlayerTurn = computed(() => {
    return state.value?.currentRaceIndex === 0 && state.value?.turnPhase === TurnPhase.WAITING_ACTION
  })

  const playerCanAct = computed(() => {
    if (!state.value || !isPlayerTurn.value) return false
    return !state.value.actedThisCycle.includes(state.value.races[0]!.id)
  })

  const allAliveActed = computed(() => {
    if (!state.value) return false
    const aliveIds = state.value.races.filter((r) => r.alive).map((r) => r.id)
    if (aliveIds.length === 0) return false
    return aliveIds.every((id) => state.value!.actedThisCycle.includes(id))
  })

  return {
    state,
    selectedAction,
    validationError,
    currentRace,
    playerRace,
    isGameOver,
    isPlayerTurn,
    playerCanAct,
    allAliveActed,
    init,
    selectAction,
    clickCell,
    skipTurn,
    advanceToNextAliveRace,
    advanceCycle,
  }
}
