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
  components/  공용 UI 컴포넌트
  db/          Dexie 스키마, repository, 백업/복원
  domain/      잔고·예산·통계 계산 순수 함수 (단위 테스트 대상)
  features/    화면 단위 기능 (transactions, budgets, summary, stats, categories, backup, settings)
  pwa/         서비스워커 등록, 설치 프롬프트
  utils/       날짜·금액 포맷 유틸
```

## 데이터 백업

앱 데이터는 이 기기에만 저장되므로, 브라우저 데이터를 지우거나 앱을 삭제하면 사라질 수 있다.
설정 → 백업/복원에서 주기적으로 JSON 백업을 받아두는 것을 권장한다.
