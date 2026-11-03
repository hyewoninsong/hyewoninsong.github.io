# 앱 frontmatter 에 `playStoreUrl` 을 둔다

**2026-11-03**

- 결정: `appStoreUrl` 옆에 선택 필드 `playStoreUrl` 을 두고, 값이 있으면 상세 상단에 "Google Play →" 링크를 함께 그린다.
- 이유: SuperTimetable 과 SuperMusicNote 가 Play 에 출시됐는데 스키마에 Android 스토어 자리가 없어, Android 뱃지만 있고 받을 길이 없었다.
- 진 대안: 스토어 링크 배열로 일반화 (스토어가 둘뿐이고 기존 네 파일을 다 옮겨야 한다).
- `releaseDate` 는 하나로 둔다. 앱의 첫 출시일이고, Android 첫 출시일은 카드에 쓰지 않는다.
- 배경: `docs/references/app-status-drift-pitfall.md`
