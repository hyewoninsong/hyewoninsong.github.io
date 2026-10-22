# SuperTimetable 개인정보처리방침 — iOS 에도 광고(AdMob) · ATT 를 적는다

Date: 2026-10-23
Status: Accepted · supersedes the "iOS 앱은 광고 · IDFA 없음 그대로" line of `2026-10-16-timetable-android-admob-privacy.md`

## Context

iOS 앱에도 하단 AdMob 배너와 "광고 제거" 1회 구매가 들어갔다(Timetable PR #1054, 2026-10-22).
iOS 앱은 UMP 동의 뒤, 기능 소개 · 튜토리얼이 끝난 다음 ATT 권한을 묻는다. 앱 안 "설정 → 광고 개인정보 설정" 은 iOS 에도 있다.
방침은 아직 "iOS 앱에는 광고가 없고 IDFA 를 수집하지 않는다" 였고, App Store 개인정보 표도 광고 전 매니페스트 그대로였다.

## Decision

- AdMob 항목에서 "Android 앱만" 을 뗐다. 기기 식별자는 플랫폼별로 적는다: iOS 는 IDFA(추적을 허용했을 때만) · IDFV, Android 는 AAID · 앱 세트 ID.
- 3장 "추적": iOS 는 ATT 를 한 번 묻고, 거부하면 IDFA 를 읽지 않고 맞춤이 아닌 광고만 나온다고 적는다. 동의가 필요한 지역은 ATT 보다 Google 동의 창이 먼저 뜬다.
- App Store 개인정보 표는 `Timetable/PrivacyInfo.xcprivacy`(origin/main) 와 같은 줄로 맞춘다. 기기 ID · 광고 데이터 · 제품 상호작용 · 대략적인 위치 = 추적 사용, 신원 연결 없음. 충돌 · 기타 진단 = 앱 기능.
- "앱 내 구매 = 프리미엄" 문장(10-06 판매 중단)은 지우고, 광고 제거 구매 문장을 iOS · Android 공통으로 합친다.
- 공통 방침의 예외 문구를 "SuperTimetable Android 앱의 광고" 에서 "SuperTimetable 앱의 광고" 로 바꾼다.
- 시행일은 2026-10-30 이다. iOS 1.2.0 이 판매 중이라 기존 사용자가 있으니 방침의 "시행 7일 전 고지" 를 지킨다. 광고가 든 iOS 빌드는 아직 심사 전이다.

## Guidance

App Store 개인정보 라벨(ASC 의 "앱 개인정보 보호")은 이 표와 같은 값으로 입력한다. 매니페스트를 바꾸면 이 표도 같은 PR 에서 고친다.
