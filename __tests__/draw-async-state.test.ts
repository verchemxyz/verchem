import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import {
  KETCHER_FAILURE_EVENT,
  runKetcherMutation,
} from '@/lib/molecule/ketcher-async';

type TestFn = () => void | Promise<void>;

const tests: Array<{ name: string; fn: TestFn }> = [];
const drawPageSource = readFileSync(
  new URL('../app/draw/page.tsx', import.meta.url),
  'utf8'
);

function test(name: string, fn: TestFn) {
  tests.push({ name, fn });
}

test('Ketcher mutation resolves and removes its failure listener on success', async () => {
  const eventBus = new EventEmitter();
  await runKetcherMutation({ eventBus }, async () => undefined);
  assert.equal(eventBus.listenerCount(KETCHER_FAILURE_EVENT), 0);
});

test('Ketcher mutation converts its swallowed FAILURE event into a rejection', async () => {
  const eventBus = new EventEmitter();
  await assert.rejects(
    runKetcherMutation({ eventBus }, async () => {
      eventBus.emit(KETCHER_FAILURE_EVENT);
    }),
    /could not complete/
  );
  assert.equal(eventBus.listenerCount(KETCHER_FAILURE_EVENT), 0);
});

test('Ketcher mutation preserves direct promise rejections and removes its listener', async () => {
  const eventBus = new EventEmitter();
  await assert.rejects(
    runKetcherMutation({ eventBus }, async () => {
      throw new Error('direct failure');
    }),
    /direct failure/
  );
  assert.equal(eventBus.listenerCount(KETCHER_FAILURE_EVENT), 0);
});

test('/draw invalidates stale shared loads and always settles current loading state', () => {
  assert.match(
    drawPageSource,
    /const requestId = shareLoadRequestRef\.current \+ 1;[\s\S]*?requestId === shareLoadRequestRef\.current/,
    'Shared loads need a monotonic request identity'
  );
  assert.match(
    drawPageSource,
    /if \(error\) \{[\s\S]*?setIsLoadingShared\(false\);[\s\S]*?if \(!key\) \{[\s\S]*?setIsLoadingShared\(false\);/,
    'Invalid or removed URL parameters must settle an aborted loading overlay'
  );
  assert.match(
    drawPageSource,
    /return \(\) => \{\s*controller\.abort\(\);[\s\S]*?shareLoadRequestRef\.current \+= 1;/,
    'Effect cleanup must abort fetch and invalidate non-cancellable Ketcher continuations'
  );
});

test('/draw serializes URL canvas replacements so the newest load runs last', () => {
  assert.match(
    drawPageSource,
    /const mutation = shareMutationQueueRef\.current[\s\S]*?runKetcherMutation\(ketcher, \(\) => ketcher\.setMolecule\(source\)\)[\s\S]*?shareMutationQueueRef\.current = mutation;/
  );
});

test('/draw detects event-bus failures for shared loads and tidy', () => {
  assert.match(
    drawPageSource,
    /runKetcherMutation\(ketcher, \(\) => ketcher\.setMolecule\(source\)\)/
  );
  assert.match(
    drawPageSource,
    /runKetcherMutation\(ketcher, \(\) => ketcher\.layout\(\)\)/
  );
});

test('/draw never downloads an export from a superseded structure revision', () => {
  assert.match(
    drawPageSource,
    /const exportRevision = structureRevisionRef\.current;[\s\S]*?const value = await prepare\(\);[\s\S]*?exportRevision !== structureRevisionRef\.current[\s\S]*?return;[\s\S]*?download\(value\);/
  );
});

test('/draw does not open Save after a stale session check', () => {
  assert.match(
    drawPageSource,
    /const requestedRevision = structureRevisionRef\.current;[\s\S]*?await fetch\('\/api\/session'\);[\s\S]*?requestedRevision !== structureRevisionRef\.current[\s\S]*?return;[\s\S]*?setIsSaveModalOpen\(true\);/
  );
});

async function runTests() {
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
    } catch (error: unknown) {
      failed += 1;
      console.error(`  ❌ ${name}`);
      console.error('    ', error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n${tests.length - failed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

void runTests();
