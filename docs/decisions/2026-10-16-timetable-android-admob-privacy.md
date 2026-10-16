# SuperTimetable 개인정보처리방침에 Android 광고(AdMob)를 더한다

Date: 2026-10-16
Status: Accepted

## Context

SuperTimetable Android 앱에 메인 화면 하단 배너 광고(Google AdMob)가 들어갔다(timetable_android PR #216).
기존 방침은 "광고 식별자를 수집하지 않으며 앱에는 광고가 없습니다" 였고, 공통 방침도 모든 앱에 같은 문장을 썼다.
Play 데이터 보안 양식(`timetable_android/fastlane/data_safety.csv`)과 방침이 같은 말을 해야 한다.

## Decision

- 앱 방침에 "Google AdMob — Android 앱만" 항목을 둔다: IP 주소(대략적 위치) · 광고 ID와 앱 세트 ID · 광고 상호작용 · 진단 정보.
  출처는 Google 의 AdMob Play 데이터 공개 문서(developers.google.com/admob/android/privacy/play-data-disclosure).
- 광고 정보는 Google 이 직접 받아 처리하는 **제3자 제공**으로 적는다(Play 양식의 "공유" 와 같다).
- 동의 창(UMP)과 앱 안 "광고 개인정보 설정", 기기 광고 ID 삭제를 이용자 권리에 적는다.
- iOS 앱은 광고 · IDFA 없음 그대로다 — 문장을 플랫폼별로 나눈다.
- 공통 방침의 "광고 식별자를 수집하지 않는다" 는 앱별 예외를 밝힌다.
- 시행일은 방침이 스스로 약속한 "7일 전 고지" 에 맞춰 2026-10-23.
