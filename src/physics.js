import { CONFIG } from './config.js';

export const BALL_RADIUS = 5;

export function stepBall(ball, dt) {
  return { ...ball, x: ball.x + ball.vx * dt, y: ball.y + ball.vy * dt };
}

export function bounceWalls(ball) {
  let { x, y, vx, vy } = ball;
  if (x < BALL_RADIUS) { x = BALL_RADIUS; vx = Math.abs(vx); }
  if (x > CONFIG.virtualW - BALL_RADIUS) { x = CONFIG.virtualW - BALL_RADIUS; vx = -Math.abs(vx); }
  if (y < BALL_RADIUS) { y = BALL_RADIUS; vy = Math.abs(vy); }
  if (y > CONFIG.virtualH - BALL_RADIUS) { y = CONFIG.virtualH - BALL_RADIUS; vy = -Math.abs(vy); }
  return { x, y, vx, vy };
}

// 원-AABB 충돌. 맞으면 최소 침투축으로 속도 반사, brickHp 감소.
export function collideBrick(ball, brick, damage) {
  const nearestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
  const nearestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  if (dx * dx + dy * dy > BALL_RADIUS * BALL_RADIUS) {
    return { hit: false, ball, brickHp: brick.hp };
  }
  const next = { ...ball };
  if (Math.abs(dx) > Math.abs(dy)) {
    next.vx = dx >= 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
  } else {
    next.vy = dy >= 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
  }
  return { hit: true, ball: next, brickHp: Math.max(0, brick.hp - damage) };
}
