# SuperMusicNote Android 개인정보처리방침 — 배너 광고(AdMob) · 광고 제거 구매를 적는다

Date: 2026-10-26
Status: Accepted · 사후 기록 (변경은 PR #530, 2026-10-26 시행 판 · 기록은 daily audit 2026-10-26)

## Context

SuperMusicNote Android 앱에 화면 아래 AdMob 배너와 "광고 제거" 1회 구매(Google Play 결제)가 들어갔다.
2026-10-02 판 방침은 "앱은 광고를 표시하거나 결제를 처리하지 않는다", "광고 ID 를 수집하지 않는다(AD_ID 권한 미선언)" 고 적고 있었다.

## Decision

- Firebase Analytics 단락에 배너 광고와 광고 제거 구매가 있다고 밝힌다. "광고 ID 를 수집하지 않는다" 는 **Firebase Analytics 에 한정**한 문장으로 좁힌다 — 광고 ID 는 광고 SDK 만 읽는다.
- Google AdMob 단락을 새로 둔다: AAID · 앱 세트 ID · IP 로 추정한 대략적 위치 · 광고 상호작용 · 기기·앱·진단 정보, 맞춤 광고 가능성, EEA·영국·스위스 동의 창, **설정 → 광고 개인정보 설정**, 기기 광고 ID 삭제·재설정.
- 광고 제거 구매는 분석 이벤트로 "연 위치(설정·배너 자리)와 구매·복원 여부" 를 남기고, Google Play 가 자동으로 보내는 구매 기록(상품·가격)도 수집된다고 적는다. 결제는 Google Play 가 처리하고 앱은 광고 제거 여부만 기기에 둔다. 구매 뒤에는 광고 요청과 광고 데이터 수집이 멈춘다.
- 기기 밖으로 나가는 데이터·삭제 방법·방침 범위 문장에 광고 데이터와 Google Play 결제를 더한다.
- 시행일은 2026-10-26 (ko · en 같음).

## Consequences

- 공통 방침(`/{lang}/privacy/`)의 광고 식별자 예외 문장은 여전히 SuperTimetable 만 적는다. SuperFont 와 같이 `tests/privacy-pages.test.mjs` 에 `todo` 로 걸어 두었다.
- `docs/specs/website.md` 의 "SuperMusicNote Android 는 광고 ID 를 수집하지 않음" 서술을 이 판에 맞춰 고쳤다.

## Guidance

Play 데이터 보안 양식(앱 저장소의 `fastlane/data_safety.csv` 등)과 방침이 같은 말을 해야 한다. 같은 결정의 선례는 `2026-10-16-timetable-android-admob-privacy.md` · `2026-10-25-superfont-ios-admob-privacy.md`.
