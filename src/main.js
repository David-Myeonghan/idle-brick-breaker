import { CONFIG } from './config.js';
import { makeBricks, isCleared, nextStage } from './stage.js';
import { stepBall, bounceWalls, collideBrick } from './physics.js';
import { applyUpgrade, brickReward, upgradeCost } from './economy.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { createLoop } from './loop.js';
import { createPersistence, toSaveData } from './persistence.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// 표시 크기만 뷰포트에 맞게 스케일. 내부 해상도(canvas.width/height)는 가상 400x600 고정 →
// 물리·입력 좌표 일관 유지. toVirtual이 getBoundingClientRect 기반이라 자동 대응.
function fit() {
  const margin = 8;
  const availW = window.innerWidth - margin * 2;
  const availH = window.innerHeight - margin * 2;
  const scale = Math.min(availW / CONFIG.virtualW, availH / CONFIG.virtualH);
  canvas.style.width = `${CONFIG.virtualW * scale}px`;
  canvas.style.height = `${CONFIG.virtualH * scale}px`;
}
window.addEventListener('resize', fit);
fit();

function spawnBalls(count) {
  const balls = [];
  for (let i = 0; i < count; i++) {
    // 각 공마다 다른 발사 각도 → 벽돌 커버리지 개선(단일 궤적 주기성 완화)
    const angle = (-Math.PI / 3) - (i * 0.5);
    const speed = CONFIG.ballSpeed;
    balls.push({
      x: CONFIG.virtualW / 2,
      y: CONFIG.virtualH - 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return balls;
}

function freshState() {
  return {
    stage: 0,
    gold: 0,
    bricks: makeBricks(0),
    balls: spawnBalls(CONFIG.startBalls),
    upgrades: { ballCount: CONFIG.startBalls, ballDamage: 0, tapDamage: 0 },
    stats: { totalBricksBroken: 0, totalGold: 0, playTimeSec: 0 },
  };
}

const storage = (() => {
  try { return window.localStorage; }
  catch { return { getItem: () => null, setItem: () => {} }; }
})();
const persistence = createPersistence(storage);

let state = freshState();

function ballDamage() { return CONFIG.baseBallDamage + state.upgrades.ballDamage * CONFIG.ballDamagePerLevel; }
function tapDamage() { return CONFIG.baseTapDamage + state.upgrades.tapDamage * CONFIG.tapDamagePerLevel; }

function currentCosts() {
  return {
    ballCount: upgradeCost('ballCount', state.upgrades.ballCount),
    ballDamage: upgradeCost('ballDamage', state.upgrades.ballDamage),
    tapDamage: upgradeCost('tapDamage', state.upgrades.tapDamage),
  };
}

function syncBallCount() {
  while (state.balls.length < state.upgrades.ballCount) {
    state.balls.push(spawnBalls(1)[0]);
  }
}

function awardBrick() {
  const r = brickReward(state.stage);
  state.gold += r;
  state.stats.totalGold += r;
  state.stats.totalBricksBroken += 1;
}

function update(dt) {
  state.stats.playTimeSec += dt;
  syncBallCount();
  for (let i = 0; i < state.balls.length; i++) {
    let ball = bounceWalls(stepBall(state.balls[i], dt));
    for (const brick of state.bricks) {
      if (brick.hp <= 0) continue;
      const res = collideBrick(ball, brick, ballDamage());
      if (res.hit) {
        ball = res.ball;
        if (res.brickHp <= 0 && brick.hp > 0) awardBrick();
        brick.hp = res.brickHp;
        break;
      }
    }
    state.balls[i] = ball;
  }
  if (isCleared(state.bricks)) {
    state = { ...nextStage(state), balls: state.balls };
  }
}

function onTap(pos) {
  for (const brick of state.bricks) {
    if (brick.hp <= 0) continue;
    if (pos.x >= brick.x && pos.x <= brick.x + brick.w &&
        pos.y >= brick.y && pos.y <= brick.y + brick.h) {
      const before = brick.hp;
      brick.hp = Math.max(0, brick.hp - tapDamage());
      if (brick.hp <= 0 && before > 0) awardBrick();
      break;
    }
  }
}

function onUpgrade(kind) {
  const { ok, state: next } = applyUpgrade(state, kind);
  if (ok) state = { ...next, bricks: state.bricks, balls: state.balls };
}

attachInput(canvas, { onUpgrade, onTap });

const loop = createLoop({ update, render: () => render(ctx, state, currentCosts()) });

(async () => {
  const saved = await persistence.load();
  if (saved) {
    state = {
      ...freshState(),
      stage: saved.stage,
      gold: saved.gold,
      upgrades: saved.upgrades,
      stats: saved.stats,
      bricks: makeBricks(saved.stage),
      balls: spawnBalls(saved.upgrades.ballCount),
    };
  }
  loop.start();
})();

setInterval(() => { persistence.save(toSaveData(state, Date.now())); }, 5000);
window.addEventListener('beforeunload', () => persistence.save(toSaveData(state, Date.now())));
