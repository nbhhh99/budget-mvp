# 가계부 (Personal Budget)

수입·지출을 빠르게 기록하고 월별 계획과 실제를 비교하는 개인용 가계부 PWA. 데이터는 기기의
IndexedDB에만 저장되며, 서버나 로그인은 사용하지 않는다.

## 시작하기

Windows PowerShell에서는 실행 정책 문제를 피하기 위해 `npm` 대신 `npm.cmd`를 사용한다.

```powershell
npm.cmd install
npm.cmd run dev       # 개발 서버 (http://localhost:5173)
npm.cmd run build     # 프로덕션 빌드 (dist/)
npm.cmd run preview   # 빌드 결과 미리보기
npm.cmd run lint      # oxlint
npm.cmd run format    # prettier --write
npm.cmd run test      # vitest
npm.cmd run collect:briefing   # 재무 브리핑 데이터 수집 스크립트 (아래 "재무 브리핑" 참고)
```

폰에서 개발 서버에 접속하려면 같은 Wi-Fi에서 `npm.cmd run dev -- --host`로 실행한 뒤
터미널에 표시되는 `Network` 주소로 접속한다.

## 기술 스택

- React + TypeScript + Vite
- Dexie (IndexedDB)
- React Router (HashRouter — 정적 호스팅에서 별도 서버 설정 없이 동작)
- Recharts (통계 화면, 지연 로드)
- vite-plugin-pwa (오프라인 캐싱, 홈 화면 설치)
- Vitest (도메인 계산 로직 단위 테스트)

## 폴더 구조

```
src/
  app/         앱 셸, 홈 화면
  components/  공용 UI 컴포넌트 (lock/ 잠금 기능 포함)
  db/          Dexie 스키마, repository, 백업/복원, 마이그레이션
  domain/      잔고·예산·통계·재무 브리핑 계산/검증 순수 함수 (단위 테스트 대상)
  features/    화면 단위 기능 (transactions, budgets, assets, briefing, learn, stats, categories, backup, settings)
  pwa/         서비스워커 등록, 설치 프롬프트
  utils/       날짜·금액 포맷 유틸
scripts/
  collect-briefing/  재무 브리핑 데이터 수집 스크립트 (GitHub Actions에서 실행)
public/
  data/briefings/    재무 브리핑 정적 JSON (YYYY-MM.json, index.json)
  data/learning/     개념 카드(concepts.json), 이번 달 돈 공부(monthly/YYYY-MM.json, index.json)
  illustrations/     "공부하기" 허브 카드 이미지
```

## 데이터 백업

앱 데이터는 이 기기에만 저장되므로, 브라우저 데이터를 지우거나 앱을 삭제하면 사라질 수 있다.
설정 → 백업/복원에서 주기적으로 JSON 백업을 받아두는 것을 권장한다.

## 공부하기 (경제 흐름 · 개념 카드 · 숫자로 이해하기 · 이번 달 돈 공부)

하단 탭 **공부하기**(`/learn`) 아래에 재무 브리핑과 자산교육 콘텐츠를 모아둔다. 투자 종목
추천이나 매수·매도 시점 제안이 아니라 일반 정보/교육 목적이며, 개인화(자산 유형별 정렬)는
카드를 숨기지 않고 순서만 바꾼다.

- **경제 흐름** (`/learn/briefing`) — 아래 "이번 달 재무 브리핑" 절 참고. 예전 `/briefing`
  경로는 `/learn/briefing`으로 자동 리다이렉트된다.
- **개념 카드** (`/learn/concepts`) — `public/data/learning/concepts.json`에 정적으로
  번들되는 15개 금융 개념(비상자금, 복리, 예금자보호, 연금저축·IRP 등). 시효성 있는
  수치(세액공제 한도, 예금자보호 한도, 국민연금 보험료율 등)는 국세청(nts.go.kr)·
  국민연금공단(nps.or.kr)·예금보험공사(kdic.or.kr) 공식 페이지를 직접 확인해 작성했고,
  나머지 정의성 개념은 금융감독원 e-금융교육센터·한국은행 경제교육을 출처로 표기했다.
  세법·연금 제도는 매년 바뀔 수 있어 `reviewedAt` 기준일을 주기적으로 재검토해야 한다.
- **숫자로 이해하기** (`/learn/calculators`) — 복리/물가 반영/목표저축/저축률 계산기.
  계산식은 `src/domain/learningCalculators.ts`의 순수 함수이며, 입력값은 저장되지 않는다.
- **이번 달 돈 공부** (`/learn/monthly`) — 재무 브리핑의 한 항목을 골라 관련 개념을
  깊이 설명하는 월간 콘텐츠. `public/data/learning/monthly/{yearMonth}.json` +
  `index.json` 구조로, 재무 브리핑과 같은 `draft`/`reviewed` 원칙을 따른다(수동 작성,
  별도 자동 수집 파이프라인 없음 — 시의성 있는 콘텐츠가 아니라 사람이 매달 직접 쓰는
  성격이라 GitHub Actions 대상이 아니다).

학습 진행 상태(안읽음/읽는 중/읽어봄, 저장 여부)는 기기의 Dexie `learningProgress` 테이블에만
저장되고 외부로 전송되지 않는다.

## 이번 달 재무 브리핑

국내외 공식 경제지표·금융제도 변경을 중립적으로 정리하고, 내가 보유한 자산 구성(저축·투자
분류에 지정한 "자산 유형")에 맞춰 관련도 높은 내용을 먼저 보여주는 화면. **투자 종목 추천이나
매수·매도 시점 제안이 아니며, 일반 정보 제공 목적이다.** 화면에는 항상 "공식 자료를 바탕으로
정리한 일반 정보"라는 안내가 표시된다.

### 데이터 흐름

```
공식 자료 → GitHub Actions 수집·검증(scripts/collect-briefing) → draft PR
  → 사람이 문구·수치·출처를 검수하고 status를 "reviewed"로 변경 → PR 병합(main)
  → 기존 deploy.yml이 빌드·배포 → public/data/briefings/*.json이 정적 파일로 배포됨
  → 앱이 같은 출처의 JSON을 fetch → 기기 안에서만 보유 자산 유형과 비교해 우선순위 계산
```

- 수집된 결과는 **항상 `status: "draft"`로 PR이 열리며, main에 직접 반영되지 않는다.**
  사람이 검수 후 `"reviewed"`로 바꿔야 앱 기본 화면에 노출된다(설정 화면 없이 JSON 파일을
  직접 고쳐서 검수한다).
- 사용자의 거래·자산 데이터는 이 흐름 어디에도 등장하지 않는다. 브리핑 JSON을 내려받는
  요청은 `yearMonth`만 포함한 정적 GET 요청이며, 개인화(우선순위 계산)는 그 데이터를 받은
  **이후 브라우저 안에서만** 실행된다.

### 사용한 공식 출처(예시)

- 한국은행(bok.or.kr) — 기준금리
- 미국 연방준비제도(federalreserve.gov) — FOMC 발표
- European Central Bank(ecb.europa.eu) — 정책금리
- 예금보험공사(kdic.or.kr), 대한민국 정책브리핑(korea.kr) — 예금자보호 한도

향후 추가 예정(자동화 미완): 한국은행 ECOS, 통계청 KOSIS, FRED — 아래 "자동 갱신" 참고.

### 자동 갱신 (GitHub Actions)

`.github/workflows/collect-briefing.yml`이 매주 월요일 09:00(KST) 자동 실행되며,
저장소의 Actions 탭에서 **Run workflow**로 수동 실행도 가능하다(연월을 비우면 이번 달
기준으로 수집). 로컬에서 직접 실행하려면:

```powershell
npm.cmd run collect:briefing            # 이번 달
npm.cmd run collect:briefing -- 2026-09 # 특정 연월
```

이미 `status: "reviewed"`로 검수된 달의 파일은 스크립트가 절대 덮어쓰지 않는다.

### 필요한 GitHub Secrets

자동 수집이 완전히 동작하려면 아래 키를 각자 발급받아 저장소 Settings → Secrets and
variables → Actions에 등록해야 한다. **키가 없어도 앱 빌드와 기존 기능은 정상 동작하며,
해당 소스만 자동으로 건너뛴다.**

| Secret | 용도 | 발급처 |
|---|---|---|
| `FRED_API_KEY` | 미국 연방기금금리 등 | https://fred.stlouisfed.org/docs/api/api_key.html |
| `BOK_ECOS_API_KEY` | 한국은행 통계(현재 스텁, 아래 한계 참고) | https://ecos.bok.or.kr/api/ |
| `KOSIS_API_KEY` | 통계청 통계(현재 스텁, 아래 한계 참고) | https://kosis.kr/openapi/ |

### 수동 JSON 작성 방법

`scripts/collect-briefing/manual/{yearMonth}.json`에 `BriefingItem[]` 배열을 직접
작성해두면, 수집 스크립트가 자동 수집 결과와 합쳐서 `public/data/briefings/{yearMonth}.json`을
만든다. 통화정책 회의처럼 빈도가 낮고 API 연동보다 사람이 직접 확인하는 편이 안전한 항목
(제도 변경, 기준금리 결정 등)은 이 방식을 기본으로 쓴다. 각 항목은 반드시 출처
(`sources`, 1개 이상)를 포함해야 하며, `src/domain/briefingSchema.ts`의 검증 규칙을
통과하지 못하면 자동으로 제외된다.

### 데이터 검수 절차

1. 수집 워크플로가 draft PR을 연다.
2. PR에서 `public/data/briefings/{yearMonth}.json`의 각 항목을 확인한다 — 수치, 기준일,
   출처 URL, `factSummary`/`significance`/`assetImplications`/`checklist` 문구가 중립적인지
   (매수·매도 권유나 단정적 표현이 없는지) 점검한다.
3. 문제가 없으면 파일의 `status`를 `"reviewed"`로, `reviewedAt`을 검수 시각으로 바꾼다.
4. PR을 병합한다 → 자동 배포됨.

### 한계 (자동화되지 않은 부분)

- **한국은행 ECOS·통계청 KOSIS 자동 수집은 아직 미구현**이다(`scripts/collect-briefing/sources/bokEcos.ts`,
  `kosis.ts`). 통계표 코드(table_code/item_code, orgId/tblId)를 공식 개발가이드에서 직접
  검색해 확인해야 하는데, 이번 구현 세션에서는 그 방법이 없어 추측으로 채우지 않고 스텁으로
  남겨뒀다. 코드를 확인한 뒤 해당 파일에 실제 요청 로직을 채우면 된다.
- **ECB SDW 자동 수집도 미구현**이다(`sources/ecbSdw.ts`) — 정확한 엔드포인트를 이번 세션에서
  확인하지 못했다. 통화정책 회의는 빈도가 낮아 수동 큐레이션으로도 충분하다고 보고, 우선
  `manual/{yearMonth}.json`으로 대체했다.
- **"금융제도 변경"(예금자보호·연금·세제 등) 항목은 성격상 항상 사람이 직접 조사·작성**해야
  한다 — 단일 공식 API로 조회할 수 있는 대상이 아니기 때문이다.
- 이 앱은 일반 정보를 정리해 보여줄 뿐이며, **금융·세무·법률 자문이 아니다.** 특정 상품
  매수·매도를 권유하지 않고, 수익률·환율·금리의 미래 방향을 단정하지 않는다.
