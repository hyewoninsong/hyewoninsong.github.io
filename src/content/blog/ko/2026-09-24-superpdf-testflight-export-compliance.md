---
title: "업로드는 성공이라는데 테스터 폰에는 빌드가 없었다"
date: 2026-09-24T21:30:00+09:00
app: "superpdf"
tags: ["devlog", "appstore"]
summary: "fastlane 은 성공으로 끝났고 App Store Connect 도 빌드를 VALID 로 보여줬다. 그런데 TestFlight 에는 아무것도 오지 않았다. 암호화 사용 여부를 묻는 질문 하나가 답 없이 남아 빌드 넷이 조용히 멈춰 있었고, 유일하게 됐던 빌드는 누군가 손으로 눌러 준 것이었다."
---

SuperPDF 테스트 빌드를 TestFlight 에 올렸다. fastlane 은 "Successfully uploaded the new binary" 를 찍고 성공으로 끝났다. App Store Connect API 로 물어보니 build 7 은 `processingState = VALID`. 그런데 몇 분이 지나도 테스터 폰의 TestFlight 에는 새 빌드가 없었다. 로그의 어느 줄도 거짓말은 아니었다. 다만 "업로드됐다" 와 "테스터가 받을 수 있다" 사이에 단계가 하나 더 있었고, 그 단계에서 멈춰 있었다.

## 빌드는 VALID 인데 배포 상태는 따로 있었다

App Store Connect 의 빌드 객체에는 처리 상태 말고 `buildBetaDetail` 이라는 것이 붙어 있다. 내부 테스터용과 외부 테스터용으로 각각 상태가 있는데, build 7 은 둘 다 `MISSING_EXPORT_COMPLIANCE` 였다. 미국 수출 규정 때문에 Apple 은 빌드마다 "이 앱이 비면제 암호화를 쓰는가" 를 묻고, 답이 없으면 처리를 끝내 놓고도 테스터에게 풀지 않는다.

더 놀란 것은 이전 빌드들이다. 3, 4, 5, 7 이 전부 같은 상태로 멈춰 있었다. 6 만 `IN_BETA_TESTING` 이었다. 6 은 누군가 콘솔에 들어가 "아니오" 를 눌러 준 빌드였다. 그래서 "전에는 됐는데 이번엔 안 된다" 로 보였지, 사실은 한 번도 저절로 된 적이 없었다.

## 답은 Info.plist 한 줄이었다

이 질문은 빌드 안에 답을 실어 보낼 수 있다. `Info.plist` 의 `ITSAppUsesNonExemptEncryption` 키다. SuperPDF 가 쓰는 암호화는 HTTPS 와 iOS 가 제공하는 것뿐이라 면제 범위 안이고, 값은 `false` 다. 이 키가 있으면 질문 자체가 생기지 않고, 처리가 끝나는 즉시 테스터에게 풀린다.

멈춰 있던 build 7 은 API 로 바로 풀었다. spaceship 으로 빌드에 `usesNonExemptEncryption: false` 를 패치하니 몇 초 뒤 `IN_BETA_TESTING` 으로 바뀌었다. 콘솔에서 누르는 것과 같은 일을 코드로 한 것이다. 다음 빌드부터는 plist 가 답을 갖고 있으니 이 과정이 필요 없다.

## 왜 놓쳤나

신호는 이미 있었다. 배포 뒤에 ipa 를 열어 검사하는 스크립트가 `ITSAppUsesNonExemptEncryption (missing)` 을 출력하고 있었다. 정보성 줄 하나라 아무도 행동하지 않았다. 스크립트가 "없음" 을 알면서 "OK" 로 끝낸 것이 문제였고, 그걸 읽는 쪽이 fastlane 의 exit 0 만 보고 배포 완료라고 보고한 것이 문제였다.

그래서 기준을 바꿨다. 배포가 됐다는 말은 이제 `internalBuildState = IN_BETA_TESTING` 을 확인한 뒤에만 한다. fastlane 의 종료 코드도, `VALID` 도 그 기준이 아니다. ipa 검사에서 이 키가 없으면 정보가 아니라 결함으로 취급한다.

## 같은 날 앞에 걸린 것 하나

첫 업로드는 그 전에 거절당했다. "The bundle version must be higher than the previously uploaded version: '6'". 프로젝트 파일의 빌드 번호는 3 이었고 fastlane 이 4 로 올렸는데, 서버에는 이미 6 이 있었다.

이 앱의 Fastfile 은 서버에서 최신 번호를 받아오지 않고 로컬 번호를 하나씩 올리는 방식이다. 그런데 배포는 항상 통합 브랜치의 최신 커밋을 임시로 체크아웃해서 빌드하고, 끝나면 그 체크아웃을 버린다. 빌드 번호를 올린 변경도 함께 버려진다. 브랜치의 번호는 영원히 3 이고 서버는 계속 앞서 나간다. 이번엔 번호를 손으로 6 에 맞춰 7 로 올렸지만, 근본 처방은 Fastfile 이 `latest_testflight_build_number` 로 서버 값을 기준 삼게 바꾸는 것이다. 로컬에 기억할 것이 없어야 버려도 괜찮다.

## 지금 상태

build 7 은 테스터에게 풀렸고, plist 키는 저장소에 들어갔다. 배포 도구 쪽에는 업로드 뒤 베타 상태를 조회하는 단계와, 키가 없으면 preflight 에서 막는 검사를 넣는 중이다. 이런 문제는 앱마다 한 번씩 겪지 않도록 도구에 남기는 것이 맞다.
