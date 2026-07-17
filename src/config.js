export const CONFIG = {
  baseHP: 10,
  growth: 1.15,
  virtualW: 400,
  virtualH: 600,

  // 레이아웃 (실측으로 확정: docs/plan.md Balance 참조)
  cols: 7,
  rows: 6,
  topMargin: 50,
  rowGap: 6,
  brickH: 20,

  // 공 (단일 공은 궤적이 주기적이라 커버리지가 나쁨 → 기본 3개 + 높은 기본 데미지로 방치 진행 보장)
  startBalls: 3,
  ballSpeed: 200,
  baseBallDamage: 5,
  ballDamagePerLevel: 3,
  baseTapDamage: 5,
  tapDamagePerLevel: 5,

  // 업그레이드 상점
  upgradeBaseCost: { ballCount: 50, ballDamage: 25, tapDamage: 15 },
  upgradeCostGrowth: 1.35,
  rewardGrowth: 1.15,
};

export function brickHP(stage) {
  return Math.round(CONFIG.baseHP * Math.pow(CONFIG.growth, stage));
}
