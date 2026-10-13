# SuperTimetable 정책·앱 페이지에서 iCloud 백업 고지 제거 (2026-10-13)

앱이 2026-10-13 에 iCloud 백업 기능을 통째로 지웠다 (앱 저장소 `Timetable/docs/design-docs/decisions/2026-10-13-remove-cloud-backup.md`). 2026-10-08 의 PR #360 이 넣었던 "iCloud 백업" 고지는 더 이상 사실이 아니므로 되돌린다.

- 개인정보처리방침(ko·en) 1조: 다시 "기기 안에만 저장 / stored only on your device", 개발자는 볼 수 없고 클라우드 동기화·백업 기능이 없다고 적는다. iCloud 항목은 삭제. 시행일 2026-10-13.
- 앱 페이지(`src/content/apps/{ko,en}/timetable.md`) 마지막 문장도 기기 안에만 저장으로 되돌림.
- `tests/privacy-pages.test.mjs`: 정책·앱 페이지에 iCloud 가 없고 기기 안에만 저장 문장이 있는지 검사.
- 이전 결정(2026-10-08 iCloud 백업 고지)은 이 항목이 대체한다. Firebase 항목은 그대로.
