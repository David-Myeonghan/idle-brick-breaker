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
