import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toVirtual, hitButton } from '../src/input.js';

test('toVirtual scales client coords into virtual space', () => {
  const rect = { left: 0, top: 0, width: 200, height: 300 };
  const p = toVirtual(100, 150, rect, 400, 600);
  assert.equal(p.x, 200);
  assert.equal(p.y, 300);
});

test('toVirtual accounts for canvas offset', () => {
  const rect = { left: 50, top: 20, width: 400, height: 600 };
  const p = toVirtual(50, 20, rect, 400, 600);
  assert.equal(p.x, 0);
  assert.equal(p.y, 0);
});

test('hitButton returns kind when inside, null when outside', () => {
  const buttons = [{ kind: 'ballCount', x: 0, y: 0, w: 50, h: 40 }];
  assert.equal(hitButton({ x: 10, y: 10 }, buttons), 'ballCount');
  assert.equal(hitButton({ x: 100, y: 100 }, buttons), null);
});
