import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeBricks, isCleared, nextStage } from '../src/stage.js';
import { brickHP, CONFIG } from '../src/config.js';

test('makeBricks lays out a grid within virtual width', () => {
  const bricks = makeBricks(0, 7, 4);
  assert.equal(bricks.length, 28);
  for (const b of bricks) {
    assert.ok(b.x >= 0 && b.x + b.w <= CONFIG.virtualW);
    assert.equal(b.hp, brickHP(0));
    assert.equal(b.maxHp, brickHP(0));
  }
});

test('makeBricks HP scales with stage', () => {
  const s0 = makeBricks(0)[0].hp;
  const s3 = makeBricks(3)[0].hp;
  assert.ok(s3 > s0);
});

test('isCleared true only when all hp <= 0', () => {
  const bricks = makeBricks(0, 2, 1);
  assert.equal(isCleared(bricks), false);
  bricks.forEach(b => { b.hp = 0; });
  assert.equal(isCleared(bricks), true);
});

test('nextStage increments stage and regenerates bricks', () => {
  const state = { stage: 0, bricks: makeBricks(0) };
  const next = nextStage(state);
  assert.equal(next.stage, 1);
  assert.equal(next.bricks[0].hp, brickHP(1));
});
