import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSaveData, parseSave, createPersistence, SAVE_VERSION } from '../src/persistence.js';

const sampleState = {
  stage: 3, gold: 500,
  bricks: [{ x: 1 }], balls: [{ x: 2 }],
  upgrades: { ballCount: 2, ballDamage: 1, tapDamage: 0 },
  stats: { totalBricksBroken: 40, totalGold: 900, playTimeSec: 120 },
};

test('toSaveData strips runtime state and stamps version/updatedAt', () => {
  const sd = toSaveData(sampleState, 1000);
  assert.equal(sd.version, SAVE_VERSION);
  assert.equal(sd.updatedAt, 1000);
  assert.equal(sd.stage, 3);
  assert.equal(sd.upgrades.ballCount, 2);
  assert.equal(sd.bricks, undefined);
  assert.equal(sd.balls, undefined);
});

test('parseSave returns null on garbage', () => {
  assert.equal(parseSave('not json'), null);
});

test('parseSave returns null on version mismatch', () => {
  assert.equal(parseSave(JSON.stringify({ version: 999, stage: 1 })), null);
});

test('parseSave round-trips valid data', () => {
  const raw = JSON.stringify(toSaveData(sampleState, 1000));
  const sd = parseSave(raw);
  assert.equal(sd.stage, 3);
  assert.equal(sd.gold, 500);
});

test('createPersistence uses injected storage', async () => {
  const mem = {};
  const storage = {
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = v; },
  };
  const p = createPersistence(storage);
  await p.save(toSaveData(sampleState, 1000));
  const loaded = await p.load();
  assert.equal(loaded.stage, 3);
});

test('createPersistence falls back to memory when storage throws', async () => {
  const badStorage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  const p = createPersistence(badStorage);
  await p.save(toSaveData(sampleState, 1000));
  const loaded = await p.load();
  assert.equal(loaded.stage, 3);
});

test('createPersistence load returns null when empty', async () => {
  const mem = {};
  const storage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; } };
  const p = createPersistence(storage);
  assert.equal(await p.load(), null);
});
