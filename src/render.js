import { CONFIG } from './config.js';
import { BALL_RADIUS } from './physics.js';

const BTN_H = 40;
const BTN_GAP = 6;

export function upgradeButtons() {
  const kinds = [
    { kind: 'ballCount', label: '공 추가' },
    { kind: 'ballDamage', label: '공 데미지' },
    { kind: 'tapDamage', label: '탭 데미지' },
  ];
  const w = (CONFIG.virtualW - BTN_GAP * (kinds.length + 1)) / kinds.length;
  const y = CONFIG.virtualH - BTN_H - BTN_GAP;
  return kinds.map((k, i) => ({
    ...k, x: BTN_GAP + i * (w + BTN_GAP), y, w, h: BTN_H,
  }));
}

// costs: { ballCount, ballDamage, tapDamage } — 각 업그레이드 다음 레벨 비용(표시용)
export function render(ctx, state, costs = {}) {
  const { virtualW, virtualH } = CONFIG;
  ctx.fillStyle = '#10141f';
  ctx.fillRect(0, 0, virtualW, virtualH);

  // 벽돌 (HP 비율로 색 농도)
  for (const b of state.bricks) {
    if (b.hp <= 0) continue;
    const ratio = b.hp / b.maxHp;
    const r = Math.round(80 + 120 * ratio);
    const g = Math.round(90 * ratio + 40);
    ctx.fillStyle = `rgb(${r}, ${g}, 255)`;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }

  // 공
  ctx.fillStyle = '#ffd95b';
  for (const ball of state.balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  // HUD 상단
  ctx.fillStyle = '#e6ebff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Stage ${state.stage + 1}`, 10, 24);
  ctx.textAlign = 'right';
  ctx.fillText(`\u{1F4B0} ${Math.floor(state.gold)}`, virtualW - 10, 24);

  // 업그레이드 버튼
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  for (const btn of upgradeButtons()) {
    const cost = costs[btn.kind];
    const affordable = cost == null || state.gold >= cost;
    ctx.fillStyle = affordable ? '#26335c' : '#1a2033';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = affordable ? '#9fb0ff' : '#5a6488';
    ctx.fillText(`${btn.label} Lv.${state.upgrades[btn.kind]}`, btn.x + btn.w / 2, btn.y + 16);
    if (cost != null) ctx.fillText(`\u{1F4B0}${cost}`, btn.x + btn.w / 2, btn.y + 32);
  }
  ctx.textAlign = 'left';
}
