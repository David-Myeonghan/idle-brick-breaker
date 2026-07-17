# 방치형 벽돌깨기 (Idle Brick Breaker) — 설계 문서

- **작성일**: 2026-07-18
- **목적**: 심심할 때 하는 순수 재미용 토이 게임. 개인 티스토리 블로그에 임베드해서 플레이.
- **상태**: 설계 확정 (구현 전)

## 1. 개요

공이 자동으로 튀며 벽돌을 깨는 **방치형(idle) + 아케이드** 하이브리드 게임.
자리를 비워도 공이 알아서 벽돌을 깨고(방치), 화면을 탭하면 직접 타격으로 개입(아케이드)한다.
골드로 업그레이드하며 스테이지를 진행한다.

- **컨셉**: 클래식 방치형 (웨이브 서바이벌/프레스티지 아님)
- **플랫폼**: 반응형 (데스크탑 + 모바일 브라우저)
- **스택**: Vanilla JS + Canvas, 자기완결형 단일 `index.html`
- **배포**: GitHub Pages (개인 계정) → 티스토리에 `<iframe>` 임베드

## 2. 핵심 게임플레이

### 한 판의 흐름
- 상단에 벽돌 격자, 하단에 공. 공은 자동으로 튀며 벽돌 HP를 깎고 골드를 준다.
- 벽돌 HP 0 → 파괴 + 골드 획득. 그리드 전부 파괴 시 **다음 스테이지**로 진행(벽돌 HP·보상 상승).
- **탭/클릭**: 커서 지점 벽돌에 즉시 데미지("직접 타격"). 연타 가능하되 데미지는 작게 — 방치가 메인, 탭은 보조.

### 성장 곡선 (지수)
- 스테이지 N 벽돌 HP = `baseHP * growth^N` (growth ≈ 1.15)
- 클리어 골드 보상, 업그레이드 비용도 지수 상승 → 방치형 특유의 "조금만 더" 텐션.

### 업그레이드 (상점, 3종으로 최소화)
1. **공 개수** — 동시에 튀는 공 +1 (방치 효율)
2. **공 데미지** — 튕길 때 벽돌 데미지
3. **탭 데미지** — 직접 타격 위력 (능동 개입)

### 명시적 제외 (YAGNI — 나중 확장 포인트)
- 오프라인 수익, 프레스티지/환생, 실제 결제 수익화. 지금은 자리만 남긴다.

## 3. 아키텍처

단일 파일이지만 내부는 역할별 순수 모듈로 분리. **엔진은 DOM/canvas/결제를 모른다**가 핵심 원칙.

### 게임 상태 (single source of truth)
```js
state = {
  stage, gold,
  bricks: [{x, y, w, h, hp, maxHp}],   // 런타임, 저장 안 함
  balls:  [{x, y, vx, vy}],            // 런타임, 저장 안 함
  upgrades: { ballCount, ballDamage, tapDamage },
}
```
모든 로직은 `state`를 읽고 갱신. 렌더는 `state`만 보고 그린다 → 상태와 그리기 완전 분리.

### 모듈 경계 (각각 한 가지 일만)

| 모듈 | 하는 일 | 의존 |
|---|---|---|
| `Config` | 밸런스 상수 (baseHP, growth, 비용 공식) | 없음 |
| `Physics` | 공 이동·벽/벽돌 충돌·반사 계산 (순수) | Config |
| `Economy` | 골드 획득, 업그레이드 비용/적용 (순수) | Config |
| `Stage` | 벽돌 그리드 생성, 클리어 판정, 다음 스테이지 (순수) | Config |
| `Input` | 클릭/터치 → 게임 좌표 변환, 탭 타격 | state |
| `Render` | canvas 그리기 (벽돌·공·HUD) | state |
| `Loop` | requestAnimationFrame, dt 계산, 모듈 조립 | 전부 |
| `Persistence` | 저장/불러오기 (인터페이스, 아래 참조) | state |

### 게임 루프
`requestAnimationFrame` 기반. 고정 timestep 누적(accumulator) 방식으로 프레임률과 무관하게 물리 일관성 유지. dt에 상한(clamp) 적용 → 백그라운드 복귀 시 공 순간이동 방지.

### 반응형
- canvas는 CSS로 컨테이너를 채우고, 내부는 **고정 가상 해상도**(예: 400×600)로 계산.
- 물리는 가상 좌표에서, 그릴 때만 스케일 → 데스크탑·모바일 동일 로직.
- 입력은 마우스·터치 양쪽 리스너.

## 4. 저장 계층 추상화 (미래 Supabase 대비)

### Persistence 인터페이스 (어댑터 패턴)
```js
Persistence = {
  load(): Promise<SaveData | null>,
  save(data: SaveData): Promise<void>,
}
```
- **지금**: `LocalPersistence` (localStorage, Promise로 감싸 인터페이스 통일)
- **나중**: `SupabasePersistence` (동일 인터페이스, 내부에서 Supabase 호출). 게임 코드는 변경 없음.

### SaveData 스키마 (서버 전송 대비 최소 페이로드)
```js
SaveData = {
  version: 1,          // 마이그레이션 대비
  stage, gold,
  upgrades: { ballCount, ballDamage, tapDamage },
  stats: { totalBricksBroken, totalGold, playTimeSec },  // 기록/랭킹 소재
  updatedAt,           // 서버 동기화 충돌 판정용
}
```
- `bricks`·`balls` 런타임 상태는 저장하지 않음 (스테이지·업그레이드로 재구성).
- `version` + `updatedAt`을 지금 넣어두면 나중 동기화·마이그레이션이 거의 공짜.

## 5. 프레임워크 독립 (미래 Next.js + 수익화 대비)

엔진(Config/Physics/Economy/Stage/Loop/state)은 순수 로직으로만 두고, 바깥과는 3개 어댑터로만 접촉:

| 어댑터 | 지금 (바닐라) | 나중 (Next.js) | 엔진 변경 |
|---|---|---|---|
| Render | canvas 2D | canvas를 React가 감쌈 | 없음 |
| Input | DOM 리스너 | React 이벤트 | 없음 |
| Persistence | localStorage | Supabase | 없음 |

- **수익화는 엔진 밖 앱 레이어의 일**: 인게임 골드(`Economy`)와 실제 결제를 분리. 결제·상품·영수증 검증은 미래 Next.js 서버 라우트 + Supabase에서 처리, 지금은 자리만. 결제 결과도 결국 `SaveData` 값 변경이므로 4장 저장 계층으로 연결.

## 6. 배포 & 블로그 임베드

- 게임 = 자기완결 단일 `index.html` → **GitHub Pages** (개인 계정 David-Myeonghan) 배포.
- **티스토리**: HTML 편집 모드에서 `<iframe src="...">` 직접 삽입.
- 단일 self-contained HTML이라 직접 열기·iframe·CodeSandbox 세 경로 모두 그대로 동작 (미래 velog 등 대비).

## 7. 에러 처리 & 견고성

- **저장 손상**: `load()`가 JSON 파싱 실패/버전 불일치 시 예외를 삼키고 **새 게임 폴백** (흰 화면 방지).
- **localStorage 불가** (iframe 샌드박스·시크릿 모드): try/catch 감지, 실패 시 **메모리 저장으로 자동 강등** — 세션 동안 진행 유지, 새로고침 시 초기화. 게임은 항상 돎.
- **탭 백그라운드**: dt 상한(clamp)으로 물리 폭주 방지.

## 8. 테스트 전략

- 순수 로직(`Physics` 충돌·반사, `Economy` 비용/골드, `Stage` HP 성장·클리어)은 DOM 의존 없음 → **순수 함수 단위 테스트** 대상.
- 지금은 콘솔 어서션 수준의 가벼운 테스트 블록, 나중 모듈 분리 시 Vitest로 승격.
- Render/Input은 수동 QA. 토이 규모라 자동화 e2e는 YAGNI.

## 9. 확장 포인트 (지금 구현 안 함, 이음새만)

- Supabase 저장/랭킹 (4장 인터페이스 자리)
- Next.js 이식 (5장 어댑터 경계)
- 수익화 상점 (5장 앱 레이어)
- 프레스티지/오프라인 수익 (2장 제외 항목)
