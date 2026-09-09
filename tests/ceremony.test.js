import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATEGORIES } from '../src/categories.js';
import { STAGE_1_VOTES, STAGE_2_VOTES, processData, getFilteredStage1Data, getHonorableMentionsList } from '../src/data.js';
import { INITIAL_STATE, ceremonyReducer, getWinners } from '../src/ceremony.js';

// Captured from main at 1a64292 before changing the application.
const original = JSON.parse(readFileSync(new URL('./fixtures/2025-results.json', import.meta.url)));

test('the original ballots and honorable mentions are preserved', () => {
  assert.deepEqual([STAGE_1_VOTES, STAGE_2_VOTES], original.ballots);
  assert.deepEqual(getHonorableMentionsList(), original.honorable);
});
test('all nomination totals match the original ceremony', () => {
  assert.deepEqual(processData(STAGE_1_VOTES), original.nominations);
});
test('all final totals, ties, zero-vote candidates and ranking rules are preserved', () => {
  assert.deepEqual(processData(STAGE_2_VOTES, true), original.final);
});
test('the shortlist includes every tie at the fifth-place cutoff', () => {
  const entries = [9, 8, 7, 6, 5, 5, 4].map(count => ({ count }));
  assert.deepEqual(getFilteredStage1Data(entries), entries.slice(0, 6));
  assert.deepEqual(getFilteredStage1Data([]), []);
});
test('winner selection includes ties and never crowns zero-vote candidates', () => {
  const tied = [{ name: 'A', count: 4 }, { name: 'B', count: 4 }, { name: 'C', count: 3 }];
  assert.deepEqual(getWinners(tied), tied.slice(0, 2));
  assert.deepEqual(getWinners([{ name: 'A', count: 0 }]), []);
  assert.deepEqual(getWinners([]), []);
});
test('the full ceremony visits all 14 categories before the summary', () => {
  let state = ceremonyReducer(INITIAL_STATE, { type: 'start' });
  assert.equal(ceremonyReducer(state, { type: 'previous' }), state);
  for (let index = 0; index < CATEGORIES.length; index++) {
    assert.equal(state.stage, 'awards');
    assert.equal(state.categoryIndex, index);
    assert.equal(state.revealed, false);
    const revealed = ceremonyReducer(state, { type: 'reveal' });
    assert.equal(revealed.revealed, CATEGORIES[index].id !== 'honorable');
    state = ceremonyReducer(revealed, { type: 'next' });
  }
  assert.equal(state.stage, 'summary');
  assert.deepEqual(ceremonyReducer(state, { type: 'restart' }), INITIAL_STATE);
});
test('previous navigation resets the reveal without modifying the prior state', () => {
  const state = { stage: 'awards', categoryIndex: 3, revealed: true };
  assert.deepEqual(ceremonyReducer(state, { type: 'previous' }), { stage: 'awards', categoryIndex: 2, revealed: false });
  assert.equal(state.revealed, true);
  assert.equal(ceremonyReducer(INITIAL_STATE, { type: 'reveal' }), INITIAL_STATE);
  assert.equal(ceremonyReducer(INITIAL_STATE, { type: 'next' }), INITIAL_STATE);
});
