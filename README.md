# Idle Brick Breaker

방치형 벽돌깨기 토이 게임. Vanilla JS + Canvas, 빌드/의존성 없음.

공이 자동으로 튀며 벽돌을 깨고(방치), 화면을 탭하면 직접 타격(아케이드). 골드로 3종 업그레이드하며 스테이지를 진행한다.

## 로컬 실행

ES 모듈을 쓰므로 정적 서버가 필요합니다(더블클릭 `file://` 불가):

```bash
nvm use          # .nvmrc → Node 20
npm run serve    # 표시된 주소 접속
```

## 테스트

```bash
npm test         # Node 20 내장 test runner (node --test)
```

## 배포

GitHub Pages로 이 폴더를 서빙. 티스토리에는 배포 URL을 iframe으로 임베드.

## 문서

- 설계: [docs/design.md](docs/design.md)
- 구현 플랜: [docs/plan.md](docs/plan.md)
- 발전 계획: [docs/roadmap.md](docs/roadmap.md)
