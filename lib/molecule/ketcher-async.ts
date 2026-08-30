import type { Ketcher } from 'ketcher-core';

export type ObservableKetcher = Pick<Ketcher, 'eventBus'>;
export const KETCHER_FAILURE_EVENT = 'FAILURE';

/**
 * Ketcher wraps editor mutations in `runAsyncAction`, which reports failures on
 * its event bus and resolves the public promise. Convert that signal back into
 * a rejection so caller loading and error states remain truthful.
 */
export async function runKetcherMutation(
  ketcher: ObservableKetcher,
  operation: () => Promise<unknown>
): Promise<void> {
  let failed = false;
  const handleFailure = () => {
    failed = true;
  };

  ketcher.eventBus.addListener(KETCHER_FAILURE_EVENT, handleFailure);
  try {
    await operation();
    if (failed) throw new Error('Ketcher could not complete the operation.');
  } finally {
    ketcher.eventBus.removeListener(KETCHER_FAILURE_EVENT, handleFailure);
  }
}
