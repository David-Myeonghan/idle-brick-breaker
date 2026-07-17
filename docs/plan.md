# 방치형 벽돌깨기 (Idle Brick Breaker) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공이 자동으로 튀며 벽돌을 깨고 골드로 업그레이드하는 방치형 아케이드 게임을 만들어 GitHub Pages에 배포하고 티스토리에 임베드한다.

**Architecture:** 순수 게임 로직(Config/Physics/Economy/Stage)은 DOM을 모르는 ES 모듈로 두고 `node:test`로 단위 테스트한다. 브라우저 어댑터(Render/Input/Loop)와 저장 계층(Persistence)은 인터페이스로 분리해 미래 Supabase/Next.js 이식 이음새를 남긴다. `index.html`이 `src/main.js`를 모듈로 로드하고, 폴더 전체를 GitHub Pages로 서빙한다(HTTPS라 ES 모듈 정상 동작).

**Tech Stack:** Vanilla JS (ES modules), Canvas 2D, `node:test` (Node 내장, 의존성 0), GitHub Pages.

## Global Constraints

- 런타임 의존성 0. 개발용 의존성도 `node:test`만 사용(별도 설치 불필요, Node 18+).
- 물리·경제·스테이지 로직은 순수 함수 — DOM/canvas/localStorage 참조 금지.
- 가상 해상도 400×600 (가로×세로 아님: width 400, height 600) 기준으로 모든 게임 좌표 계산.
- 성장 상수: `baseHP = 10`, `growth = 1.15`, 스테이지 N 벽돌 HP = `round(baseHP * growth^N)` (N은 0부터).
- 업그레이드 3종만: `ballCount`, `ballDamage`, `tapDamage`. 그 외 기능(프레스티지·오프라인 수익·결제) 금지(YAGNI).
- SaveData에 런타임 상태(`bricks`, `balls`) 저장 금지. `version:1`, `updatedAt` 필수.
- 커밋은 각 태스크 내 명시된 파일만 `git add`.

---

## File Structure

- `index.html` — canvas + `<script type="module" src="./src/main.js">`
- `src/config.js` — 밸런스 상수 + 비용/HP 공식 (순수)
- `src/economy.js` — 골드 획득, 업그레이드 비용/적용 (순수)
- `src/stage.js` — 벽돌 그리드 생성, 클리어 판정, 다음 스테이지 (순수)
- `src/physics.js` — 공 이동, 벽/벽돌 충돌·반사 (순수)
- `src/persistence.js` — SaveData 직렬화, LocalPersistence, 메모리 폴백
- `src/render.js` — canvas 그리기 (어댑터)
- `src/input.js` — 포인터 → 가상 좌표, 탭 타격 (어댑터)
- `src/loop.js` — rAF 루프, accumulator, dt clamp (어댑터)
- `src/main.js` — 전체 조립
- `test/economy.test.js`, `test/stage.test.js`, `test/physics.test.js`, `test/persistence.test.js`
- `package.json` — `"test": "node --test"`
- `README.md` — 실행/배포/임베드 안내

---

### Task 1: 프로젝트 스캔폴드 + 빈 캔버스

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.js`
- Create: `README.md`
- Create: `.gitignore`

**Interfaces:**
- Consumes: 없음
- Produces: `index.html`이 `./src/main.js`를 module로 로드. `main.js`는 `#game` canvas에 접근.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "idle-brick-breaker",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test",
    "serve": "npx --yes serve ."
  }
}
```

- [ ] **Step 2: .gitignore 작성**

```
node_modules/
.DS_Store
```

- [ ] **Step 3: index.html 작성**

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Idle Brick Breaker</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0b0e14; overflow: hidden; }
    #wrap { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
    #game { background: #10141f; touch-action: none; max-width: 100%; max-height: 100%; }
  </style>
</head>
<body>
  <div id="wrap"><canvas id="game" width="400" height="600"></canvas></div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: src/main.js 최소 구현 (캔버스 클리어만)**

```js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#10141f';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#5b7cff';
ctx.font = '16px sans-serif';
ctx.fillText('loading…', 20, 30);
```

- [ ] **Step 5: README.md 작성**

```markdown
# Idle Brick Breaker

방치형 벽돌깨기 토이 게임. Vanilla JS + Canvas.

## 로컬 실행
ES 모듈을 쓰므로 정적 서버가 필요합니다(더블클릭 file:// 불가):
`npm run serve` 후 표시된 주소 접속.

## 테스트
`npm test` (Node 18+ 내장 test runner)

## 배포
GitHub Pages로 이 폴더를 서빙. 티스토리에는 배포 URL을 iframe으로 임베드:
`<iframe src="https://<user>.github.io/idle-brick-breaker/" width="400" height="600" style="border:0;max-width:100%"></iframe>`
```

- [ ] **Step 6: 로컬 서버로 확인**

Run: `cd ~/projects/idle-brick-breaker && npm run serve`
Expected: 브라우저에서 어두운 캔버스 + "loading…" 텍스트 표시.

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore index.html src/main.js README.md
git commit -m "chore: scaffold project with empty canvas"
```

---

### Task 2: Config + Economy (순수 로직 + 테스트)

**Files:**
- Create: `src/config.js`
- Create: `src/economy.js`
- Test: `test/economy.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `config.js`: `export const CONFIG = { baseHP:10, growth:1.15, virtualW:400, virtualH:600, upgradeBaseCost:{ballCount:50,ballDamage:25,tapDamage:15}, upgradeCostGrowth:1.35 }`
  - `config.js`: `export function brickHP(stage) -> number`
  - `economy.js`: `export function upgradeCost(kind, level) -> number`
  - `economy.js`: `export function canAfford(gold, cost) -> boolean`
  - `economy.js`: `export function applyUpgrade(state, kind) -> {ok:boolean, state}` (골드 차감 + 레벨 +1; 못 사면 ok:false, state 불변)
  - `economy.js`: `export function brickReward(stage) -> number` (벽돌 1개 파괴 골드)

- [ ] **Step 1: 실패하는 테스트 작성 — test/economy.test.js**

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/config.js'`

- [ ] **Step 3: src/config.js 구현**

```js
export const CONFIG = {
  baseHP: 10,
  growth: 1.15,
  virtualW: 400,
  virtualH: 600,
  upgradeBaseCost: { ballCount: 50, ballDamage: 25, tapDamage: 15 },
  upgradeCostGrowth: 1.35,
  rewardGrowth: 1.15,
};

export function brickHP(stage) {
  return Math.round(CONFIG.baseHP * Math.pow(CONFIG.growth, stage));
}
```

- [ ] **Step 4: src/economy.js 구현**

```js
import { CONFIG } from './config.js';

export function upgradeCost(kind, level) {
  const base = CONFIG.upgradeBaseCost[kind];
  return Math.round(base * Math.pow(CONFIG.upgradeCostGrowth, level));
}

export function canAfford(gold, cost) {
  return gold >= cost;
}

export function applyUpgrade(state, kind) {
  const level = state.upgrades[kind];
  const cost = upgradeCost(kind, level);
  if (!canAfford(state.gold, cost)) return { ok: false, state };
  const next = {
    ...state,
    gold: state.gold - cost,
    upgrades: { ...state.upgrades, [kind]: level + 1 },
  };
  return { ok: true, state: next };
}

export function brickReward(stage) {
  return Math.max(1, Math.round(2 * Math.pow(CONFIG.rewardGrowth, stage)));
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (economy 관련 6개 통과)

- [ ] **Step 6: Commit**

```bash
git add src/config.js src/economy.js test/economy.test.js
git commit -m "feat: add config and economy pure logic with tests"
```

---

### Task 3: Stage (벽돌 그리드 + 클리어 판정 + 테스트)

**Files:**
- Create: `src/stage.js`
- Test: `test/stage.test.js`

**Interfaces:**
- Consumes: `CONFIG`, `brickHP` (config.js)
- Produces:
  - `stage.js`: `export function makeBricks(stage, cols=7, rows=4) -> Array<{x,y,w,h,hp,maxHp}>` (가상 좌표, 상단 배치)
  - `stage.js`: `export function isCleared(bricks) -> boolean` (남은 벽돌 hp>0 없음)
  - `stage.js`: `export function nextStage(state) -> state` (stage+1, bricks 재생성)

- [ ] **Step 1: 실패하는 테스트 작성 — test/stage.test.js**

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/stage.js'`

- [ ] **Step 3: src/stage.js 구현**

```js
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/stage.js test/stage.test.js
git commit -m "feat: add stage generation and clear detection with tests"
```

---

### Task 4: Physics (공 이동 + 충돌·반사 + 테스트)

**Files:**
- Create: `src/physics.js`
- Test: `test/physics.test.js`

**Interfaces:**
- Consumes: `CONFIG`
- Produces:
  - `physics.js`: `export const BALL_RADIUS = 5`
  - `physics.js`: `export function stepBall(ball, dt) -> ball` (위치 갱신; 좌표 변이 순수, 새 객체 반환)
  - `physics.js`: `export function bounceWalls(ball) -> ball` (좌/우/상 벽 반사; 바닥은 반사 — 방치형이라 공 소멸 없음)
  - `physics.js`: `export function collideBrick(ball, brick, damage) -> {hit:boolean, ball, brickHp}` (AABB-원 충돌; 맞으면 속도 반사 + brickHp 감소)

- [ ] **Step 1: 실패하는 테스트 작성 — test/physics.test.js**

```js
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
  const brick = { x: 100, y: 100, w: 40, h: 20, hp: 30, maxHp: 30 };
  const ball = { x: 120, y: 98, vx: 0, vy: -50 };
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/physics.js'`

- [ ] **Step 3: src/physics.js 구현**

```js
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
  // 침투가 더 얕은 축으로 반사
  const next = { ...ball };
  if (Math.abs(dx) > Math.abs(dy)) {
    next.vx = dx >= 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
  } else {
    next.vy = dy >= 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
  }
  return { hit: true, ball: next, brickHp: Math.max(0, brick.hp - damage) };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/physics.js test/physics.test.js
git commit -m "feat: add ball physics and collision with tests"
```

---

### Task 5: Persistence (SaveData + localStorage + 메모리 폴백 + 테스트)

**Files:**
- Create: `src/persistence.js`
- Test: `test/persistence.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `persistence.js`: `export const SAVE_VERSION = 1`
  - `persistence.js`: `export function toSaveData(state, now) -> SaveData` (런타임 상태 제외, version/updatedAt 포함)
  - `persistence.js`: `export function parseSave(raw) -> SaveData | null` (파싱 실패/버전 불일치 시 null)
  - `persistence.js`: `export function createPersistence(storage) -> {load, save}` (storage 주입; 없거나 예외 시 메모리 폴백)

- [ ] **Step 1: 실패하는 테스트 작성 — test/persistence.test.js**

```js
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
  assert.equal(loaded.stage, 3); // 메모리 폴백에 남아있음
});

test('createPersistence load returns null when empty', async () => {
  const mem = {};
  const storage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; } };
  const p = createPersistence(storage);
  assert.equal(await p.load(), null);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/persistence.js'`

- [ ] **Step 3: src/persistence.js 구현**

```js
export const SAVE_VERSION = 1;
const KEY = 'idle-brick-breaker-save';

export function toSaveData(state, now) {
  return {
    version: SAVE_VERSION,
    stage: state.stage,
    gold: state.gold,
    upgrades: { ...state.upgrades },
    stats: { ...state.stats },
    updatedAt: now,
  };
}

export function parseSave(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

// storage: {getItem, setItem} 호환 객체(예: window.localStorage). 접근 실패 시 메모리 폴백.
export function createPersistence(storage) {
  const memory = { value: null };

  async function save(saveData) {
    const raw = JSON.stringify(saveData);
    memory.value = raw;
    try {
      storage.setItem(KEY, raw);
    } catch {
      /* iframe 샌드박스/시크릿 모드 → 메모리에만 유지 */
    }
  }

  async function load() {
    let raw = null;
    try {
      raw = storage.getItem(KEY);
    } catch {
      raw = memory.value;
    }
    if (raw == null) raw = memory.value;
    if (raw == null) return null;
    return parseSave(raw);
  }

  return { load, save };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (전체 태스크 2~5 테스트 모두 통과)

- [ ] **Step 5: Commit**

```bash
git add src/persistence.js test/persistence.test.js
git commit -m "feat: add persistence layer with memory fallback and tests"
```

---

### Task 6: Render (캔버스 그리기)

**Files:**
- Create: `src/render.js`

**Interfaces:**
- Consumes: `CONFIG`, `BALL_RADIUS`
- Produces: `render.js`: `export function render(ctx, state)` — 배경, 벽돌(HP 비율로 색농도), 공, HUD(스테이지·골드·업그레이드 버튼 영역) 그리기. 순수 그리기(상태 변경 없음).
- Produces: `render.js`: `export function upgradeButtons() -> Array<{kind,x,y,w,h,label}>` (가상 좌표; Input이 히트테스트에 재사용)

- [ ] **Step 1: src/render.js 구현**

```js
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

export function render(ctx, state) {
  const { virtualW, virtualH } = CONFIG;
  ctx.fillStyle = '#10141f';
  ctx.fillRect(0, 0, virtualW, virtualH);

  // 벽돌
  for (const b of state.bricks) {
    if (b.hp <= 0) continue;
    const ratio = b.hp / b.maxHp;
    const g = Math.round(80 + 120 * ratio);
    ctx.fillStyle = `rgb(${g}, ${Math.round(90 * ratio + 40)}, 255)`;
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
  ctx.fillText(`Stage ${state.stage + 1}`, 10, 24);
  ctx.textAlign = 'right';
  ctx.fillText(`💰 ${Math.floor(state.gold)}`, virtualW - 10, 24);
  ctx.textAlign = 'left';

  // 업그레이드 버튼
  ctx.font = '12px sans-serif';
  for (const btn of upgradeButtons()) {
    ctx.fillStyle = '#1e2740';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = '#9fb0ff';
    ctx.textAlign = 'center';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + 16);
    ctx.fillText(`Lv.${state.upgrades[btn.kind]}`, btn.x + btn.w / 2, btn.y + 32);
    ctx.textAlign = 'left';
  }
}
```

- [ ] **Step 2: 수동 확인용 임시 배선 (main.js에서 더미 state 렌더)**

`src/main.js`를 임시로 다음과 같이 바꿔 렌더 확인:

```js
import { CONFIG } from './config.js';
import { makeBricks } from './stage.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = {
  stage: 0, gold: 1234,
  bricks: makeBricks(0),
  balls: [{ x: 200, y: 400, vx: 0, vy: 0 }],
  upgrades: { ballCount: 1, ballDamage: 0, tapDamage: 0 },
  stats: {},
};
render(ctx, state);
```

- [ ] **Step 3: 로컬 서버로 시각 확인**

Run: `npm run serve`
Expected: 벽돌 그리드, 공 1개, 상단 Stage/골드, 하단 업그레이드 버튼 3개 표시.

- [ ] **Step 4: Commit**

```bash
git add src/render.js src/main.js
git commit -m "feat: add canvas rendering for bricks, balls, and HUD"
```

---

### Task 7: Input (포인터 → 가상 좌표 + 탭 타격 + 버튼 히트테스트)

**Files:**
- Create: `src/input.js`

**Interfaces:**
- Consumes: `upgradeButtons` (render.js)
- Produces:
  - `input.js`: `export function toVirtual(clientX, clientY, rect, virtualW, virtualH) -> {x,y}` (캔버스 표시 크기 → 가상 좌표 환산; 순수)
  - `input.js`: `export function hitButton(pos, buttons) -> kind | null` (순수)
  - `input.js`: `export function attachInput(canvas, handlers)` — pointerdown 리스너 등록. `handlers = { onUpgrade(kind), onTap({x,y}) }`. 버튼 영역이면 onUpgrade, 아니면 onTap 호출.

- [ ] **Step 1: 순수 함수 테스트를 economy 스타일로 추가 — test/input.test.js**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toVirtual, hitButton } from '../src/input.js';

test('toVirtual scales client coords into virtual space', () => {
  const rect = { left: 0, top: 0, width: 200, height: 300 };
  const p = toVirtual(100, 150, rect, 400, 600);
  assert.equal(p.x, 200);
  assert.equal(p.y, 300);
});

test('hitButton returns kind when inside, null when outside', () => {
  const buttons = [{ kind: 'ballCount', x: 0, y: 0, w: 50, h: 40 }];
  assert.equal(hitButton({ x: 10, y: 10 }, buttons), 'ballCount');
  assert.equal(hitButton({ x: 100, y: 100 }, buttons), null);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/input.js'`

- [ ] **Step 3: src/input.js 구현**

```js
import { CONFIG } from './config.js';
import { upgradeButtons } from './render.js';

export function toVirtual(clientX, clientY, rect, virtualW, virtualH) {
  const x = ((clientX - rect.left) / rect.width) * virtualW;
  const y = ((clientY - rect.top) / rect.height) * virtualH;
  return { x, y };
}

export function hitButton(pos, buttons) {
  for (const b of buttons) {
    if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
      return b.kind;
    }
  }
  return null;
}

export function attachInput(canvas, handlers) {
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const pos = toVirtual(e.clientX, e.clientY, rect, CONFIG.virtualW, CONFIG.virtualH);
    const kind = hitButton(pos, upgradeButtons());
    if (kind) handlers.onUpgrade(kind);
    else handlers.onTap(pos);
  });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/input.js test/input.test.js
git commit -m "feat: add pointer input mapping and hit testing with tests"
```

---

### Task 8: Loop + main 조립 (게임 루프, accumulator, dt clamp, 저장)

**Files:**
- Create: `src/loop.js`
- Modify: `src/main.js` (전체 배선으로 교체)

**Interfaces:**
- Consumes: 전 모듈
- Produces:
  - `loop.js`: `export function createLoop({ update, render, now }) -> {start, stop}` — 고정 timestep(1/60) accumulator, `dt` clamp(최대 0.1s). `now`는 시간 소스(기본 `performance.now`), `raf`는 주입 가능.

- [ ] **Step 1: src/loop.js 구현**

```js
const STEP = 1 / 60;
const MAX_FRAME = 0.1; // 백그라운드 복귀 시 폭주 방지

export function createLoop({ update, render, now = () => performance.now(), raf = requestAnimationFrame }) {
  let running = false;
  let last = 0;
  let acc = 0;

  function frame() {
    if (!running) return;
    const t = now();
    let delta = (t - last) / 1000;
    last = t;
    if (delta > MAX_FRAME) delta = MAX_FRAME;
    acc += delta;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    render();
    raf(frame);
  }

  return {
    start() { if (running) return; running = true; last = now(); acc = 0; raf(frame); },
    stop() { running = false; },
  };
}
```

- [ ] **Step 2: src/main.js 전체 배선으로 교체**

```js
import { CONFIG } from './config.js';
import { makeBricks, isCleared, nextStage } from './stage.js';
import { stepBall, bounceWalls, collideBrick } from './physics.js';
import { applyUpgrade, brickReward } from './economy.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { createLoop } from './loop.js';
import { createPersistence, toSaveData } from './persistence.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function freshState() {
  return {
    stage: 0, gold: 0,
    bricks: makeBricks(0),
    balls: spawnBalls(1),
    upgrades: { ballCount: 1, ballDamage: 0, tapDamage: 0 },
    stats: { totalBricksBroken: 0, totalGold: 0, playTimeSec: 0 },
  };
}

function spawnBalls(count) {
  const balls = [];
  for (let i = 0; i < count; i++) {
    const angle = (-Math.PI / 3) - (i * 0.3);
    const speed = 180;
    balls.push({ x: CONFIG.virtualW / 2, y: CONFIG.virtualH - 120, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
  }
  return balls;
}

const storage = (() => { try { return window.localStorage; } catch { return { getItem: () => null, setItem: () => {} }; } })();
const persistence = createPersistence(storage);

let state = freshState();

function ballDamage() { return 1 + state.upgrades.ballDamage; }
function tapDamage() { return 3 + state.upgrades.tapDamage * 3; }

function syncBallCount() {
  const want = state.upgrades.ballCount;
  while (state.balls.length < want) state.balls.push(spawnBalls(1)[0]);
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

function awardBrick() {
  const r = brickReward(state.stage);
  state.gold += r;
  state.stats.totalGold += r;
  state.stats.totalBricksBroken += 1;
}

function onTap(pos) {
  for (const brick of state.bricks) {
    if (brick.hp <= 0) continue;
    if (pos.x >= brick.x && pos.x <= brick.x + brick.w && pos.y >= brick.y && pos.y <= brick.y + brick.h) {
      brick.hp = Math.max(0, brick.hp - tapDamage());
      if (brick.hp <= 0) awardBrick();
      break;
    }
  }
}

function onUpgrade(kind) {
  const { ok, state: next } = applyUpgrade(state, kind);
  if (ok) { state = { ...next, bricks: state.bricks, balls: state.balls }; }
}

attachInput(canvas, { onUpgrade, onTap });

const loop = createLoop({ update, render: () => render(ctx, state) });

// 저장/불러오기
(async () => {
  const saved = await persistence.load();
  if (saved) {
    state = { ...freshState(), stage: saved.stage, gold: saved.gold, upgrades: saved.upgrades, stats: saved.stats, bricks: makeBricks(saved.stage) };
  }
  loop.start();
})();

setInterval(() => { persistence.save(toSaveData(state, Date.now())); }, 5000);
window.addEventListener('beforeunload', () => persistence.save(toSaveData(state, Date.now())));
```

- [ ] **Step 3: 로컬에서 통합 플레이 확인**

Run: `npm run serve`
Expected: 공이 자동으로 튀며 벽돌 파괴 → 골드 증가, 벽돌 클리어 시 다음 스테이지, 버튼 탭 시 업그레이드(골드 충분할 때 Lv 증가), 벽돌 탭 시 직접 데미지. 새로고침해도 스테이지/골드 유지.

- [ ] **Step 4: 전체 테스트 재확인**

Run: `npm test`
Expected: PASS (순수 모듈 테스트 전부 통과 — main/loop는 수동 QA)

- [ ] **Step 5: Commit**

```bash
git add src/loop.js src/main.js
git commit -m "feat: wire game loop, gameplay, upgrades, and autosave"
```

---

### Task 9: 반응형 캔버스 스케일링

**Files:**
- Modify: `index.html` (리사이즈 처리 스크립트 추가)
- Modify: `src/main.js` (DPR/리사이즈 대응 — 표시 크기만 조정, 내부 해상도는 가상 400×600 고정)

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (시각/레이아웃만)

- [ ] **Step 1: main.js에 리사이즈 로직 추가 (canvas 상단, ctx 얻은 직후)**

```js
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
```

> 내부 `canvas.width/height`는 400×600으로 고정(가상 해상도) — 물리·입력 좌표가 일관 유지되고, CSS 크기만 뷰포트에 맞게 스케일된다. `toVirtual`이 `getBoundingClientRect()` 기반이라 자동 대응됨.

- [ ] **Step 2: 데스크탑/모바일 폭에서 확인**

Run: `npm run serve`
Expected: 창 크기를 바꾸거나 모바일 뷰(개발자도구 반응형)에서 캔버스가 비율 유지하며 화면에 맞게 확대/축소. 탭 좌표가 벽돌/버튼과 정확히 일치.

- [ ] **Step 3: Commit**

```bash
git add index.html src/main.js
git commit -m "feat: responsive canvas scaling with fixed virtual resolution"
```

---

### Task 10: GitHub Pages 배포 + 티스토리 임베드 스니펫

**Files:**
- Modify: `README.md` (실제 배포 URL + 임베드 스니펫 확정)

**Interfaces:**
- Consumes: 없음
- Produces: 공개 배포 URL

- [ ] **Step 1: GitHub Pages 활성화 (main 브랜치 root)**

```bash
gh api -X POST repos/David-Myeonghan/idle-brick-breaker/pages \
  -f "source[branch]=main" -f "source[path]=/" 2>/dev/null \
  || gh api -X PUT repos/David-Myeonghan/idle-brick-breaker/pages -f "source[branch]=main" -f "source[path]=/"
```

Expected: Pages 빌드 시작. `https://david-myeonghan.github.io/idle-brick-breaker/` 로 수 분 내 접속 가능.

- [ ] **Step 2: 배포 확인**

Run: `curl -sI https://david-myeonghan.github.io/idle-brick-breaker/ | head -1`
Expected: `HTTP/2 200`

- [ ] **Step 3: README에 임베드 스니펫 확정**

```markdown
## 티스토리 임베드
HTML 편집 모드에서 아래 삽입:
`<iframe src="https://david-myeonghan.github.io/idle-brick-breaker/" width="400" height="600" style="border:0;max-width:100%;aspect-ratio:2/3" loading="lazy"></iframe>`
```

- [ ] **Step 4: Commit + push**

```bash
git add README.md
git commit -m "docs: add live deploy URL and tistory embed snippet"
git push
```

---

## Self-Review

**Spec coverage:**
- 게임플레이(2장) → Task 3,4,8 ✅
- 성장 곡선/업그레이드(2장) → Task 2 ✅
- 아키텍처 모듈 경계(3장) → Task 2~9 파일 분리 ✅
- 저장 계층 추상화(4장) → Task 5 (인터페이스 주입형) ✅
- 프레임워크 독립(5장) → 어댑터 분리(render/input/persistence) ✅
- 배포/임베드(6장) → Task 10 ✅
- 에러 처리(7장): 저장 손상 폴백 → Task 5 `parseSave`; localStorage 불가 폴백 → Task 5 메모리 폴백; dt clamp → Task 8 `loop.js` ✅
- 테스트(8장) → Task 2,3,4,5,7 `node:test` ✅

**Placeholder scan:** TBD/TODO 없음. 모든 코드 스텝에 실제 구현 포함.

**Type consistency:** `applyUpgrade`가 `{ok, state}` 반환 — Task 2 정의와 Task 8 사용 일치. `collideBrick`이 `{hit, ball, brickHp}` — Task 4 정의와 Task 8 사용 일치. `createPersistence(storage).{load,save}` — Task 5 정의와 Task 8 사용 일치. `upgradeButtons()` — Task 6 정의와 Task 7 재사용 일치.

**주의(실행자용):** `nextStage`/`applyUpgrade`는 새 state를 반환하되 런타임 배열(`balls`)은 보존해야 하므로 main.js에서 `{ ...next, balls: state.balls }` 형태로 병합한다(Task 8 참조).
