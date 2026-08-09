export interface UpdateLifecycleState {
  hadController: boolean
  updateAvailable: boolean
  applying: boolean
}

export interface UpdateLifecycleTransition {
  state: UpdateLifecycleState
  reload: boolean
  postSkipWaiting: boolean
}

const clearedState = (hadController: boolean): UpdateLifecycleState => ({
  hadController,
  updateAvailable: false,
  applying: false,
})

/** Every controlled window clears stale UI when a replacement takes control. */
export function controllerChanged(
  current: UpdateLifecycleState
): UpdateLifecycleTransition {
  return {
    state: clearedState(true),
    reload: current.hadController || current.updateAvailable || current.applying,
    postSkipWaiting: false,
  }
}

/** Re-read registration.waiting before posting; a recorded worker may be stale. */
export function updateRequested(
  current: UpdateLifecycleState,
  hasLiveWaitingWorker: boolean
): UpdateLifecycleTransition {
  if (!hasLiveWaitingWorker) {
    return {
      state: clearedState(current.hadController),
      reload: current.hadController,
      postSkipWaiting: false,
    }
  }

  return {
    state: { ...current, updateAvailable: true, applying: true },
    reload: false,
    postSkipWaiting: true,
  }
}

/** Recover if controllerchange was missed: retry a live waiter or reload current. */
export function updateRecovery(
  current: UpdateLifecycleState,
  hasLiveWaitingWorker: boolean
): UpdateLifecycleTransition {
  if (hasLiveWaitingWorker) {
    return {
      state: { ...current, updateAvailable: true, applying: false },
      reload: false,
      postSkipWaiting: false,
    }
  }

  return {
    state: clearedState(current.hadController),
    reload: current.hadController,
    postSkipWaiting: false,
  }
}
