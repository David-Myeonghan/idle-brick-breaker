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
