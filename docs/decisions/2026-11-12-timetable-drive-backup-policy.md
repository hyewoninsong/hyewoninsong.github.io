# SuperTimetable 정책에 Google Drive 백업(Android) 고지를 더함 (2026-11-12)

Date: 2026-11-12
Status: accepted — `2026-11-11-timetable-icloud-backup-policy.md` 의 "Android 에는 없음" 문장을 대체한다

## Context

Android 앱에 선택형 Google Drive 백업이 들어간다(timetable_android PR #364, 기본 꺼짐). 방침은 "Android 앱에는 클라우드 백업 기능이 없습니다" 라고 말하고 있어서 출시되면 틀린 문장이 된다. 방침이 기능보다 먼저 나가야 한다.

## Decision

- 앱 방침(`apps/timetable/privacy.astro`, ko · en)에 iCloud 항목과 나란히 "Google Drive 백업 (Android 앱)" 을 1 · 6 · 7조에 더한다: 켰을 때만 · 올라가는 것(저장 파일 + 기기 모델 · 앱 버전 · 개수) · 본인 Drive 의 앱 전용 폴더 · `drive.appdata` 하나 · 개발자 서버 미경유 · 최근 7개 · "백업 모두 삭제" · 서드 파티 액세스에서 연결 끊기.
- "Android 앱에는 클라우드 백업 기능이 없습니다" 를 지우고, 앱 삭제 · 내보내기 안내는 두 백업을 함께 말한다.
- 시행일을 2026-11-19 로 옮긴다(공지 2026-11-12 + 7일, 방침 10조). Drive 백업이 든 Android 버전은 이 날짜 전에 출시하지 않는다. ko · en 은 같은 날짜여야 한다(테스트).
- `tests/privacy-pages.test.mjs` 의 필수 문구에 Drive 항목을 더하고 "Android 에는 없음" 검사는 뺀다.
