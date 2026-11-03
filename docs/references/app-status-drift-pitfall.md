# 앱 상태 뱃지는 스토어에서 출시돼도 저절로 바뀌지 않는다

**2026-11-03 발견.** SuperMusicNote 는 2026-09-30 에 App Store, 2026-10-26 에 Google Play 에 나갔고,
SuperTimetable Android 는 2026-10-23 에 Play 에 나갔는데, 사이트는 계속 "개발중" 이었다.
App Store 링크·Play 링크·출시일도 없었다.

## 왜 생기나

출시는 앱 저장소와 스토어 콘솔에서 일어나고, 사이트의 `platforms`·`appStoreUrl`·`releaseDate` 는
사람이 손으로 고치는 frontmatter 다. 둘을 잇는 단계가 없어서 틀려도 빌드는 통과한다.

## 출시 전에 쓴 문장도 같이 낡는다

뮤직노트 페이지의 "서버로 나가는 것도 없어요" 는 개발 중에 쓴 문장이다. 출시된 앱은 iOS·Android 모두
Firebase Analytics·Crashlytics·AdMob 을 쓰므로 뱃지만 바꾸면 거짓말이 출시 페이지에 남는다.
같은 앱의 Android 개인정보 페이지가 이 데이터 전송을 이미 밝히고 있었다.

## 확인 방법

- App Store: `https://itunes.apple.com/lookup?id=1886932099&entity=software&country=kr` — 개발자의 공개 앱 전체.
  검색(`search?term=`)은 놓칠 수 있으니 개발자 ID 로 묻는다.
- 심사 상태: App Store Connect API `appStoreVersions.appStoreState`. `READY_FOR_SALE` 만 `released` 다.
- Google Play: `https://play.google.com/store/apps/details?id=<패키지>` 가 200 이면 공개, 404 면 아니다.
  Android 패키지는 앱 저장소의 `applicationId`.
- 앱이 출시로 바뀔 때마다 그 앱의 페이지·`.md` 에서 데이터 관련 문장을 개인정보 페이지와 맞춘다.

관련 결정: `docs/decisions/2026-11-03-play-store-link.md`
