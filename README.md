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
npm.cmd run collect:briefing     # 재무 브리핑 데이터 수집 스크립트 (아래 "재무 브리핑" 참고)
npm.cmd run collect:indicators   # 오늘의 경제지표 수집 스크립트 (아래 "오늘의 경제지표" 참고)
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
  collect-briefing/    재무 브리핑 데이터 수집 스크립트 (GitHub Actions에서 실행)
  collect-indicators/  오늘의 경제지표 수집 스크립트 (GitHub Actions에서 실행)
public/
  data/briefings/    재무 브리핑 정적 JSON (YYYY-MM.json, index.json)
  data/indicators/   오늘의 경제지표 정적 JSON (latest.json, history/{id}.json)
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

## 오늘의 경제지표

재무 브리핑 화면 하단에 있는, 환율·주식·유가·국내 기름값·금·코인·거시지표 카드 섹션.
서술형 재무 브리핑(월간, 사람 검수)과 달리 **숫자 + 공식 출처만 다루는 별도 파이프라인**이라
사람 검수 없이 자동 검증만으로 매일 갱신된다. 화면 상단의 "오늘의 변화"(일간)·"이번 주
요약"(주간)도 이 지표를 규칙 기반 문장으로 요약한 것이다(§8B/§8C, LLM 호출 없음).

### 데이터 흐름

```
공식 API(환율·주식·국내유가) → GitHub Actions 수집·검증(scripts/collect-indicators)
  → 이상치·빈 응답 차단, 기존 정상 데이터 보존 → lint/test/build 통과 시에만 main에 직접 커밋
  → 기존 deploy.yml이 빌드·배포 → public/data/indicators/*.json이 정적 파일로 배포됨
  → 앱이 같은 출처의 JSON을 fetch(+ 코인만 예외: 브라우저가 업비트 API를 직접 호출)
```

재무 브리핑과 달리 **draft PR 없이 main에 바로 커밋한다** — 서술 없는 순수 수치·출처
데이터라 사실 검수가 필요하지 않다고 판단했기 때문이다(사용자와 합의). 대신 워크플로가
지표 데이터 파일만 커밋 범위로 삼고(앱 소스코드는 건드리지 않음), 커밋 전에
`lint`/`test`/`build`를 모두 통과해야 한다.

### 지표별 실제 출처와 현재 상태

| 카테고리 | 출처 | 상태 |
|---|---|---|
| 환율(원/달러·원/100엔·원/유로) | 한국수출입은행 환율정보 API | 구현 완료(`EXIMBANK_API_KEY` 필요) — 최근 7일 안에서 최신 영업일 조회, 인증 오류(result=3)·호출 한도 초과(result=4)를 데이터 없음과 구분 |
| 국내 휘발유·경유 | 한국석유공사 오피넷 API | 구현 완료(`OPINET_API_KEY` 필요) — 실제 GitHub Actions 실행에서 관측된 `RESULT.OIL 배열이 비어 있거나 없는 응답 형식 오류`를 계기로, "정말 빈 배열(발표 전)"/"OIL 필드 자체가 없는 오류 응답"/"결과 1건이라 배열이 아닌 단일 객체"/"JSON 요청에 XML 응답"을 각각 구분하도록 수정 |
| 국제유가(WTI·Brent) | 미국 EIA Open Data API v2 | 구현 완료(`EIA_API_KEY` 필요) — series id(RWTC/RBRTE)는 EIA 공식 페이지에서 확인. 다만 유효한 키로 실응답을 받아보지는 못했다(다음 workflow_dispatch 실행에서 확인 필요). 두바이유는 공식 무료 API가 없어 미지원 |
| 코인(BTC/ETH) | 업비트 공개 시세 API | 구현 완료(키 불필요, 브라우저 직접 호출) |
| 거시지표(기준금리·물가·실업률·성장률) | 기존 재무 브리핑에서 파생 | 구현 완료(새 수집 없음) |
| KOSPI·KOSDAQ | 금융위원회_지수시세정보(공공데이터포털) | 구현 완료(`DATA_GO_KR_API_KEY` 필요) — 활용자가이드로 확인한 `GetMarketIndexInfoService/getStockMarketIndex` 엔드포인트·필드(basDt/idxNm/clpr/vs/fltRt) 사용. idxNm의 정확한 문자열 표기까지는 이 세션에서 실응답으로 확인하지 못해 "코스피"/"코스닥" 정확 일치로 매칭한다 — 다르면 다음 실행의 invalid_response 사유에 실제 idxNm 값이 그대로 남는다 |
| KRX 금시장(국내 금) | 금융위원회_일반상품시세정보(공공데이터포털) | 구현 완료(`DATA_GO_KR_API_KEY` 필요) — `GetGeneralProductInfoService/getGoldPriceInfo`에서 "금 99.99_1Kg"(단축코드 04020000)만 선택해 원/kg → 원/g으로 환산. 국제 금(Alpha Vantage, 미구현)과 별도 지표(`gold-krx`)로 관리 |
| 해외 주가지수(S&P 500·NASDAQ Composite) | — | **미구현** — FRED의 SP500·NASDAQCOM 두 시리즈 모두 "재배포 전 서면 사전승인 필요"로 분류돼 있어 그대로 쓸 수 없다. Alpha Vantage의 지수 전용 API(INDEX_DATA)는 프리미엄 전용이고, SPY·QQQ 같은 ETF로 대체 표시하는 것은 금지 조건에 해당해 시도하지 않았다 |
| 국제 금 | — | **미구현** — Alpha Vantage의 신규 Gold/Silver 엔드포인트가 무료인지 공식 문서로 확정하지 못해 보류했다 |

KOSPI·KOSDAQ·KRX 금시장은 이 세션에서 유효한 `DATA_GO_KR_API_KEY`로 실응답을 받아
검증하지는 못했다 — 키를 등록한 뒤 `workflow_dispatch`(그룹 `domestic`)로 한 번 확인이
필요하다. data.go.kr 공통 응답 봉투 파싱(JSON/XML, resultCode 분류)은
`scripts/collect-indicators/sources/dataGoKrEnvelope.ts`에 공유 로직으로 분리했다.
해외지수·국제 금은 여전히 미구현이며, 유료 라이선스(Alpha Vantage 유료 플랜, IEX Cloud,
Twelve Data 등)를 쓸지, S&P/Nasdaq에 재배포 서면 허가를 직접 요청할지를 사용자가 먼저
정해야 한다.

### 자동 갱신 (GitHub Actions)

`.github/workflows/collect-indicators.yml`은 공급자별 실제 발표 시각에 맞춰 그룹을 나눠
실행한다(§13):

| 그룹 | 대상 | 실행 시각(KST) |
|---|---|---|
| domestic | 환율·KOSPI·KOSDAQ·KRX 금 | 평일 16:30 |
| fuel | 국내 휘발유·경유 | 매일 07:00 |
| global | 해외지수·WTI·Brent | 평일 09:00 |

세 cron이 한 워크플로에 등록돼 있고, `github.event.schedule`로 어느 그룹인지 판단한다.
Actions 탭에서 **Run workflow**로 그룹을 지정해 수동 실행할 수도 있다(비우면 전체 수집).
로컬에서 직접 실행하려면:

```powershell
npm.cmd run collect:indicators              # 전체
npm.cmd run collect:indicators -- --group=fuel   # 그룹 지정
```

예약 실행은 GitHub Actions 사정으로 지연될 수 있으므로, 화면에는 예약 시각이 아니라 실제
수집된 `updatedAt`·`referenceDate`를 표시한다.

각 소스 어댑터는 값을 못 얻은 이유를 `ProviderResult`(`scripts/collect-indicators/types.ts`)
로 구분해서 반환한다 — 키 미등록/인증 오류/호출 한도 초과/미발표/응답 형식 오류/미구현/기타
실패. 워크플로 실행마다 Job Summary에 공급자별 결과 표가 남고, 화면에는 그중 "시도조차
안 한 것"(키 미등록·미구현)은 "데이터 연동 준비 중", "시도했지만 이번엔 실패한 것"(인증
오류·호출 한도·형식 오류 등)은 "일시적으로 불러올 수 없음"으로 구분해서 보여준다(§14).

### 필요한 GitHub Secrets

이 저장소에는 **현재 등록된 Secret이 하나도 없다** — 아래 키는 모두 사용자가 각 발급처에서
직접 신청해 GitHub 저장소 Settings → Secrets and variables → Actions에 등록해야 한다.

| Secret | 용도 | 발급처 |
|---|---|---|
| `EXIMBANK_API_KEY` | 환율 | https://www.data.go.kr/data/3068846/openapi.do |
| `OPINET_API_KEY` | 국내 휘발유·경유 | https://www.data.go.kr/data/15150932/openapi.do |
| `EIA_API_KEY` | WTI·Brent 국제유가 | https://www.eia.gov/opendata/register.php |
| `DATA_GO_KR_API_KEY` | KOSPI·KOSDAQ·KRX 금시장 | https://www.data.go.kr/data/15094807/openapi.do, https://www.data.go.kr/data/15094805/openapi.do |

`ALPHA_VANTAGE_API_KEY`는 확인된 무료·정식 용도가 없어 더 이상 이 수집기가 참조하지
않는다(위 "미구현" 항목 참고) — 해외지수·국제 금을 유료 API로 구현하기로 결정하면 그때
다시 필요해질 수 있다.

각 변수의 상세 설명(필수 여부, 미설정 시 동작)은 `.env.example`을 참고한다.

### 캐시와 오프라인

정적 JSON(`public/data/indicators/`)은 재무 브리핑과 동일하게 서비스워커 빌드 시점
프리캐시로 오프라인 지원을 받는다. 코인만 예외로, 기기 IndexedDB(`indicatorCryptoCache`
테이블)에 15분 TTL로 캐시해 화면 진입 시 stale-while-revalidate로 갱신한다 — 15분이
지나지 않았으면 재요청하지 않고, 오프라인이면 마지막 캐시값과 "오프라인 저장값" 표시를
그대로 보여준다. 이 캐시는 재조회하면 다시 채워지는 값이라 백업 대상에서 제외했다(전체
초기화 시에는 함께 비워진다).

### 한계

- 위 표의 "스텁" 지표 4종은 API 존재·이용조건만 확인했고, 정확한 요청 엔드포인트(또는
  시리즈 ID, 심볼 지원 범위)를 이 세션에서 확인하지 못해 추측으로 채우지 않았다
  (`collect-briefing`의 BOK ECOS·KOSIS 스텁과 동일한 원칙).
- `DATA_GO_KR_API_KEY`를 설정해도, 활용신청이 각 API별로 승인돼야 실제 호출이
  가능하다(보통 즉시~단기 승인).
