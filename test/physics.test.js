import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepBall, bounceWalls, collideBrick, BALL_RADIUS } from '../src/physics.js';
import { CONFIG } from '../src/config.js';

test('stepBall advances position by velocity * dt', () => {
  const ball = { x: 100, y: 100, vx: 60, vy: -30 };
  const next = stepBall(ball, 0.5);
  assert.equal(next.x, 130);
  assert.equal(next.y, 85);
});

test('bounceWalls reflects off left wall', () => {
  const ball = { x: 1, y: 300, vx: -50, vy: 0 };
  const next = bounceWalls(ball);
  assert.ok(next.vx > 0);
  assert.ok(next.x >= BALL_RADIUS);
});

test('bounceWalls reflects off right wall', () => {
  const ball = { x: CONFIG.virtualW - 1, y: 300, vx: 50, vy: 0 };
  const next = bounceWalls(ball);
  assert.ok(next.vx < 0);
});

test('bounceWalls reflects off bottom (idle: no loss)', () => {
  const ball = { x: 200, y: CONFIG.virtualH + 5, vx: 0, vy: 40 };
  const next = bounceWalls(ball);
  assert.ok(next.vy < 0);
  assert.ok(next.y <= CONFIG.virtualH - BALL_RADIUS);
});

test('collideBrick detects hit and reduces hp + reflects vy', () => {
  // 공이 벽돌 아래(하단 y=120)에서 위로 올라와 바닥면에 충돌 → 아래로 반사(vy>0)
  const brick = { x: 100, y: 100, w: 40, h: 20, hp: 30, maxHp: 30 };
  const ball = { x: 120, y: 122, vx: 0, vy: -50 };
  const res = collideBrick(ball, brick, 10);
  assert.equal(res.hit, true);
  assert.equal(res.brickHp, 20);
  assert.ok(res.ball.vy > 0);
});

test('collideBrick misses when far away', () => {
  const brick = { x: 100, y: 100, w: 40, h: 20, hp: 30, maxHp: 30 };
  const ball = { x: 300, y: 400, vx: 0, vy: -50 };
  const res = collideBrick(ball, brick, 10);
  assert.equal(res.hit, false);
  assert.equal(res.brickHp, 30);
});
