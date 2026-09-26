---
title: "안드로이드에도 TestFlight 같은 한 줄 배포를 붙였다, 첫 빌드만 빼고"
date: 2026-09-27T02:40:00+09:00
app: "timetable"
tags: ["devlog", "android"]
summary: "iOS 는 명령 한 줄로 TestFlight 에 올라가는데 안드로이드는 손으로 빌드를 옮기고 있었다. fastlane 레인 두 개로 Play 내부 테스트와 Firebase 배포를 붙였고, 막힌 곳 두 군데는 둘 다 코드가 아니라 콘솔 쪽이었다."
---

SuperTimetable 안드로이드 버전을 다시 짓기 시작하면서, 만든 걸 폰에 올려 볼 길부터 필요해졌다. iOS 는 "배포해줘" 한 마디면 TestFlight 에 빌드가 올라가는데, 안드로이드는 서명 설정조차 없어서 release 빌드를 만들 수도 없는 상태였다.

## 명령 하나에 목적지 둘

| 명령 | 가는 곳 | 테스터가 받는 법 |
|---|---|---|
| `fastlane android beta` | Play Console 내부 테스트 트랙 (AAB) | 참여 링크 수락 후 Play 스토어에서 설치, 자동 업데이트 |
| `fastlane android firebase` | Firebase App Distribution (APK) | 초대 메일, App Tester 앱으로 설치 |
| `fastlane android build` | 로컬 | 서명된 AAB·APK 만 만든다 |

TestFlight 와 가장 닮은 건 Play 내부 테스트다. 스토어 앱에서 그대로 설치되고 업데이트도 알아서 된다. Firebase 쪽은 Play 에 앱을 등록하기 전에도 돌아간다는 점 하나 때문에 남겼다. 이 둘을 Claude 가 부르는 스킬로 감쌌고, 스킬 본문은 스크립트 한 줄 실행이 전부다.

빌드 번호는 사람이 올리지 않는다. 레인이 시작할 때 Play 의 모든 트랙과 Firebase 최신 릴리스를 조회해서 가장 큰 값에 1을 더하고, Gradle 에 `-PversionCode=N` 으로 넘긴다. 조회가 실패하면 0으로 치고 넘어간다. 아직 아무것도 없는 앱에서는 1부터 시작하게 된다.

## 비밀값은 저장소 밖에만 둔다

업로드 키스토어가 없어서 새로 만들었다. 비밀번호는 사용자 홈의 Gradle 설정에 두고, `build.gradle.kts` 는 그 값이 있을 때만 서명 설정을 만든다. 저장소 안의 `keystore.properties` 같은 흔한 방식을 쓰지 않은 이유는 worktree 때문이다. 작업을 worktree 단위로 나눠서 하는데, gitignore 된 파일은 새 worktree 에 따라오지 않는다. 홈 디렉터리에 두면 어느 worktree 에서 돌려도, 나중에 CI 에서 `ORG_GRADLE_PROJECT_*` 환경변수로 넣어도 같은 이름으로 읽힌다. 서비스 계정 키도 같은 이유로 홈 쪽에 둔다.

Play App Signing 을 켜면 이 키는 업로드 키가 된다. 잃어버려도 Play 에서 교체할 수 있다. 그래도 백업은 따로 해 둔다.

## 플러그인 대신 REST 를 직접 불렀다

Firebase 배포에는 보통 `fastlane-plugin-firebase_app_distribution` 을 쓴다. 그런데 Homebrew 로 깐 fastlane 은 Gemfile 없이 플러그인을 불러오지 못하고, 이 맥의 시스템 Ruby 는 2.6 이라 bundler 환경을 새로 세우기엔 너무 낡았다. Firebase CLI 를 까는 방법도 있지만 배포 한 번 하자고 도구를 하나 더 들이고 싶지 않았다.

그래서 Fastfile 안에서 App Distribution REST API 를 직접 부른다. 업로드, 처리 완료까지 5초 간격 폴링, 릴리스 노트 수정, 그룹 배포까지 네 번 호출하면 된다. 인증에 필요한 `googleauth` gem 은 fastlane 이 Play 업로드용으로 이미 들고 있어서 새로 설치할 게 없었다.

## 서비스 계정은 새로 만들지 않았다

Play 에 자동으로 올리려면 Play 만 쓰더라도 서비스 계정 키가 필요하다. 이미 GA4 맞춤 측정기준을 등록하려고 만들어 둔 서비스 계정이 있어서 그걸 다시 썼다. 다만 권한은 서비스마다 따로다. GA4 편집자 권한은 Play 에 아무 의미가 없다. Play Console 은 앱 안이 아니라 개발자 계정 첫 화면의 **사용자 및 권한**에서 그 이메일을 초대하고, 앱 권한 탭에서 앱별로 체크한다.

나중에 정식 출시까지 자동화할 생각으로 네 개를 미리 줬다. 테스트 트랙 출시, 테스트 트랙 관리, 프로덕션 출시, 스토어 등록정보 관리다. 결제와 사용자 관리는 주지 않았다. 이 키는 GA4 와 함께 쓰는 키라서, 새어 나갔을 때 계정을 건드릴 수 있는 권한까지 붙어 있으면 곤란하다.

## 막힌 곳은 둘 다 콘솔이었다

첫 실행은 빌드까지 1분 남짓 걸려 성공했고, 업로드에서 멈췄다.

**`Google Play Android Developer API has not been used in project N`.** 여기서 N 은 앱의 Firebase 프로젝트가 아니라 서비스 계정이 속한 프로젝트 번호다. API 호출은 인증서를 발급한 쪽 프로젝트로 잡힌다. 서비스 계정으로 API 를 직접 켜 보려 했지만 403 이 났다. 권한이 없는 계정이 스스로 권한을 넓힐 수 없는 건 당연하다. 프로젝트 소유자가 콘솔에서 사용 설정을 누르는 수밖에 없었다.

**`Package not found: com.hyewoninsong.timetable`.** API 를 켜고 다시 돌리니 이번엔 패키지를 모른다고 했다. Play Developer API 는 이미 빌드가 하나라도 올라간 앱에만 업로드를 받는다. 첫 AAB 는 콘솔에서 손으로 올려야 하고, Play App Signing 설정도 그 순간에 정해진다. TestFlight 에는 없는 단계다. App Store Connect 는 앱 레코드만 있으면 첫 빌드부터 API 로 받는다.

두 에러의 원인은 설정 문서에 에러 문구 그대로 적어 두었다. 다음에 같은 문장을 만나면 검색으로 바로 찾을 수 있게 하려는 것이다.

## 첫 자동 배포에서 하나 더

첫 AAB 를 손으로 올린 뒤 레인을 돌리니 Play 조회는 통과했다. 내부 트랙에 빌드 1이 있다는 것까지 읽었다. 그런데 업로드 직전에 `Cannot provide both apk(s) and aab` 로 멈췄다. fastlane 의 `gradle` 액션은 방금 만든 AAB 뿐 아니라 빌드 출력 폴더에 남아 있던 예전 APK 까지 찾아서 넘긴다. 앞서 서명을 확인하려고 만든 APK 가 그대로 남아 있었고, 업로드 단계는 둘 다 올리라는 뜻으로 받았다. Play 레인에 `skip_upload_apk: true` 를 넣어 AAB 만 가게 했다. 로컬에서 빌드를 여러 종류 만든 뒤에야 드러나는 문제라, 깨끗한 CI 였다면 한참 뒤에 만났을 것이다.

## 지금 상태

고친 뒤 한 줄 명령으로 빌드 2가 내부 테스트 트랙에 올라갔다. 번호도 사람이 손대지 않았다. 남은 건 Firebase 쪽 권한이다. 지금은 Play 만 쓰니 급하지 않다.

## 이력

- 2026-09-27 — fastlane 레인 두 개, 서명 설정, 배포 스킬, Play 콘솔 에러 두 가지
- 2026-09-27 — 첫 자동 배포 성공 (빌드 2), 남은 APK 가 AAB 와 함께 실리던 문제
