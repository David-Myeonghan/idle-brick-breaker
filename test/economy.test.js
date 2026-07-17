import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brickHP, CONFIG } from '../src/config.js';
import { upgradeCost, canAfford, applyUpgrade, brickReward } from '../src/economy.js';

test('brickHP grows exponentially per stage', () => {
  assert.equal(brickHP(0), 10);
  assert.equal(brickHP(1), Math.round(10 * 1.15));
  assert.ok(brickHP(10) > brickHP(9));
});

test('upgradeCost grows with level', () => {
  const c0 = upgradeCost('ballDamage', 0);
  const c1 = upgradeCost('ballDamage', 1);
  assert.equal(c0, CONFIG.upgradeBaseCost.ballDamage);
  assert.ok(c1 > c0);
});

test('canAfford compares gold to cost', () => {
  assert.equal(canAfford(100, 50), true);
  assert.equal(canAfford(40, 50), false);
});

test('applyUpgrade deducts gold and bumps level when affordable', () => {
  const state = { gold: 1000, upgrades: { ballCount: 0, ballDamage: 0, tapDamage: 0 } };
  const cost = upgradeCost('ballCount', 0);
  const { ok, state: next } = applyUpgrade(state, 'ballCount');
  assert.equal(ok, true);
  assert.equal(next.upgrades.ballCount, 1);
  assert.equal(next.gold, 1000 - cost);
});

test('applyUpgrade fails and leaves state unchanged when broke', () => {
  const state = { gold: 0, upgrades: { ballCount: 0, ballDamage: 0, tapDamage: 0 } };
  const { ok, state: next } = applyUpgrade(state, 'ballCount');
  assert.equal(ok, false);
  assert.equal(next.gold, 0);
  assert.equal(next.upgrades.ballCount, 0);
});

test('brickReward is positive and grows with stage', () => {
  assert.ok(brickReward(0) > 0);
  assert.ok(brickReward(5) > brickReward(0));
});
