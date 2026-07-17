import { CONFIG, brickHP } from './config.js';

export function makeBricks(stage, cols = 7, rows = 4) {
  const pad = 6;
  const topMargin = 60;
  const w = (CONFIG.virtualW - pad * (cols + 1)) / cols;
  const h = 22;
  const hp = brickHP(stage);
  const bricks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: pad + c * (w + pad),
        y: topMargin + r * (h + pad),
        w, h, hp, maxHp: hp,
      });
    }
  }
  return bricks;
}

export function isCleared(bricks) {
  return bricks.every(b => b.hp <= 0);
}

export function nextStage(state) {
  const stage = state.stage + 1;
  return { ...state, stage, bricks: makeBricks(stage) };
}
