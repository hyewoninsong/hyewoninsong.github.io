# SuperFont 개인정보처리방침 — 광고(AdMob) · ATT · 광고 제거 구매를 적는다

Date: 2026-10-25
Status: Accepted · 사후 기록 (변경은 PR #508, 2026-10-25 시행 판 · 기록은 daily audit 2026-10-25)

## Context

SuperFont iOS 앱에 메인 화면 아래 AdMob 배너, "광고 제거" 1회 구매(Apple 결제), UMP 동의 창, ATT 권한 요청이 들어갔다.
방침은 아직 Firebase(Analytics · Crashlytics)만 적고 있었고, App Store 개인정보 표도 광고 전 매니페스트 그대로였다.

## Decision

- 제3자 항목에 `Google AdMob (Google LLC)` 를 더한다. 기기 식별자는 IDFA(추적을 허용했을 때만) · IDFV 로 적고, 폰트 설치 흐름(마법사)에는 광고가 없다고 밝힌다.
- 4장 "추적 및 광고 식별자": 스플래시가 끝난 뒤 처음 광고를 보여 주기 전에 ATT 를 한 번 묻는다. 거부하면 IDFA 를 읽지 않고 맞춤이 아닌 광고만 나온다. 동의가 필요한 지역은 UMP 동의 창이 ATT 보다 먼저 뜨고, 선택은 **광고 제거 화면 → 광고 개인정보 설정** 에서 바꾼다 (SuperFont 에는 설정 화면이 없다). 광고 제거 구매자에게는 두 창을 띄우지 않는다.
- Firebase Analytics 는 IDFA 없는 구성이라고 따로 적는다 — 광고 식별자는 광고 SDK 만 읽는다.
- 광고 제거 구매는 "연 위치와 구매 방법(구매 · 복원)만 기록, 금액 · 거래 번호는 기록하지 않음, 결제는 Apple" 로 적는다.
- App Store 개인정보 표는 앱 매니페스트(`PrivacyInfo.xcprivacy`)의 수집 항목 6개를 그대로 옮긴다. 기기 ID · 광고 데이터 · 제품 상호작용 · 대략적 위치 = 추적 사용, 충돌 · 기타 진단 = 추적 안 함. 전부 신원 연결 없음.
- 시행일은 2026-10-25 (ko · en 같음). SuperTimetable(2026-10-30, 7일 전 고지)과 달리 바로 시행한다.

## Consequences

- 공통 방침(`/{lang}/privacy/`)의 "앱별 방침에 따로 밝힌 경우(SuperTimetable 앱의 광고)를 제외하고 광고 식별자를 수집하지 않으며" 문장이 SuperFont 를 빠뜨린 채 남았다. 공통 방침은 SuperFont 방침으로 링크하지도 않는다. `tests/privacy-pages.test.mjs` 에 `todo` 로 걸어 두었다 — 공통 방침을 고치는 PR 에서 `todo` 를 뗀다.

## Guidance

SuperFont 의 매니페스트나 ASC 라벨이 바뀌면 이 표도 같은 PR 에서 고친다. 행 수와 추적 행 수는 테스트가 본다.
SuperTimetable 의 같은 결정은 `2026-10-23-timetable-ios-admob-privacy.md`.
