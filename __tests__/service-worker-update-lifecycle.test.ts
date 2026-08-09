import assert from 'node:assert/strict'

import {
  controllerChanged,
  updateRecovery,
  updateRequested,
  type UpdateLifecycleState,
} from '@/lib/pwa/update-lifecycle'

function controlledPrompt(): UpdateLifecycleState {
  return { hadController: true, updateAvailable: true, applying: false }
}

function run(): void {
  // Two controlled windows see the same waiting worker.
  const primaryRequest = updateRequested(controlledPrompt(), true)
  assert.equal(primaryRequest.postSkipWaiting, true)
  assert.equal(primaryRequest.state.applying, true)

  // The activation broadcasts controllerchange to both windows. The secondary
  // did not click Update, but must still clear its prompt and reload.
  const primaryChange = controllerChanged(primaryRequest.state)
  const secondaryChange = controllerChanged(controlledPrompt())
  for (const transition of [primaryChange, secondaryChange]) {
    assert.equal(transition.reload, true)
    assert.equal(transition.state.updateAvailable, false)
    assert.equal(transition.state.applying, false)
  }

  // If a stale click races after another window activated the worker, re-read
  // registration.waiting and reload instead of entering a permanent spinner.
  const staleClick = updateRequested(controlledPrompt(), false)
  assert.equal(staleClick.postSkipWaiting, false)
  assert.equal(staleClick.reload, true)
  assert.equal(staleClick.state.applying, false)

  // If controllerchange is missed, recovery either restores a usable button or
  // reloads the already-controlled page; neither outcome can deadlock.
  const retry = updateRecovery(primaryRequest.state, true)
  assert.equal(retry.reload, false)
  assert.equal(retry.state.updateAvailable, true)
  assert.equal(retry.state.applying, false)

  const activatedWithoutEvent = updateRecovery(primaryRequest.state, false)
  assert.equal(activatedWithoutEvent.reload, true)
  assert.equal(activatedWithoutEvent.state.updateAvailable, false)
  assert.equal(activatedWithoutEvent.state.applying, false)

  // First install has no old controller and therefore does not force a reload.
  const firstInstall = controllerChanged({
    hadController: false,
    updateAvailable: false,
    applying: false,
  })
  assert.equal(firstInstall.reload, false)
  assert.equal(firstInstall.state.hadController, true)

  console.log('Multi-window service-worker lifecycle behavioral tests passed')
}

run()
