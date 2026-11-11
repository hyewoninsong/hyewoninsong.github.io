---
title: "업로드는 성공이라는데 테스터 폰에는 빌드가 없었다"
date: 2026-11-05T19:09:34+09:00
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

## 2026-11-03 — 이번엔 빌드가 아예 나타나지 않았다

기기 안에서 도는 신경망 음성 엔진(sherpa-onnx 와 onnxruntime)을 넣고 처음 올린 빌드 48 은 다른 모양으로 멈췄다. 업로드 도구는 `UPLOAD SUCCEEDED with no errors` 를 찍었다. 그런데 한 시간이 지나도 App Store Connect 의 빌드 목록에 48 이 없었다. "처리 중" 으로도 뜨지 않았다. 9월에 배운 대로 베타 상태를 물어보려 해도 물어볼 빌드가 없었다.

같은 ipa 를 `altool --validate-app` 으로 Apple 서버 검증에 다시 넣으면 `VERIFY SUCCEEDED` 가 나온다. 업로드 기록을 보는 API(`buildUploads`)는 공개 API 에 없다. 이유는 메일로만 왔다.

> ITMS-90208: Invalid Bundle - The bundle MindPDF.app/Frameworks/onnxruntime.framework does not support the minimum OS Version specified in the Info.plist.

ipa 를 열어 보니 `onnxruntime.framework` 의 Info.plist 는 최소 iOS 13.0 이라고 말하는데, 실행 파일에 박힌 최소 버전(`LC_BUILD_VERSION` 의 minos)은 26.2 였다. 크기는 51KB. 원본 onnxruntime 은 44MB 다.

원인은 라이브러리의 포장에 있었다. 두 엔진의 xcframework 는 정적 라이브러리(ar archive)를 `.framework` 폴더에 넣어 둔 것이다. Swift 패키지의 `binaryTarget` 으로 걸면 Xcode 27 은 코드를 앱 본체에 정적으로 링크하고, 남은 `.framework` 껍데기도 앱의 `Frameworks/` 에 넣는다. 그때 빌드 로그에 `Injecting stub binary into codeless framework` 가 찍힌다. 껍데기에 빈 실행 파일을 끼우는데, 이 스텁을 앱의 배포 대상(26.2)으로 컴파일한다. Info.plist 는 원본의 13.0 그대로라 둘이 어긋났다. 정작 그 프레임워크는 실행 중에 아무도 쓰지 않는다. 코드는 이미 본체에 있기 때문이다.

그래서 plist 의 숫자를 맞추지 않고, 껍데기가 들어가지 않게 했다. 엔진을 받는 스크립트가 두 xcframework 를 `.a` 파일과 헤더, 모듈 맵만 담은 "라이브러리" 형태로 다시 묶는다(`xcodebuild -create-xcframework -library … -headers …`). 라이브러리 형태는 링크만 되고 앱에 들어가지 않는다. 다시 아카이브하니 `Frameworks/` 폴더가 사라졌고, 본체 안의 엔진 코드는 이전 빌드와 같은 양이었다. plist 를 26.2 로 고치는 쪽은 빈 프레임워크가 계속 실리고, 배포 대상을 바꿀 때마다 같은 일이 되풀이되기 때문에 고르지 않았다.

이번에도 배운 것은 9월과 같은 줄기다. 성공 메시지는 Apple 이 파일을 받았다는 뜻일 뿐이다. 업로드 후 십몇 분이 지나도 빌드가 목록에 없으면 늦는 게 아니라 거절된 것이고, 이유는 메일함에 있다. ipa 를 검사하는 스크립트는 이제 앱에 들어간 프레임워크마다 실행 파일의 minos 와 plist 를 비교해 어긋나면 배포를 막는다. 검사기가 이 검사를 업로드 전에 했다면 15분짜리 업로드와 한 시간의 기다림은 없었을 것이다.

## 2026-11-05 — 이번엔 받아지는데 누르면 꺼졌다

빌드 56 과 57 은 테스터에게 잘 풀렸다. 베타 상태도 `IN_BETA_TESTING`, 9월에 정한 "배포됨" 의 기준을 통과했다. 그런데 아이콘을 누르면 화면이 뜨기도 전에 앱이 사라졌다. TestFlight 피드백에 붙어 온 크래시 로그는 짧았다.

```
Termination Reason: DYLD 1 Library missing
Library not loaded: @rpath/AMSMB2.framework/AMSMB2
```

앱의 코드가 한 줄도 돌기 전에, 실행 파일을 메모리에 올리는 dyld 가 필요한 라이브러리를 못 찾아 멈춘 것이다. 같은 날 한국어 형태소 분석기 Kiwi 를 넣었기 때문에 그것부터 의심했지만, Kiwi 와 신경망 음성 엔진은 11월 3일에 정리한 대로 `.a` 정적 라이브러리라 실행 파일 안에 들어가 있다. `otool -L` 로 실행 파일이 부르는 라이브러리를 보면 `@rpath` 로 찾는 것은 AMSMB2 하나였다. 파일 서버(SMB)에서 PDF 를 가져오려고 이틀 전에 더한 라이브러리다.

AMSMB2 는 Swift 패키지가 동적 라이브러리(`type: .dynamic`)로 내놓는다. 동적 라이브러리는 두 가지가 다 있어야 한다. 실행 파일에 "이걸 불러라" 를 적는 링크 단계, 그리고 그 파일을 앱의 `Frameworks/` 폴더에 복사하는 Embed Frameworks 단계. Xcode 화면에서 패키지를 더하면 둘을 같이 만들어 주지만, 이번에는 프로젝트 파일을 직접 고쳐 링크 단계에만 넣었다. 빌드 57 의 아카이브를 열어 보니 `Frameworks/` 폴더 자체가 없었다. 11월 3일에 "빈 껍데기가 앱에 실리지 않게" 하려고 없앤 그 폴더가, 이번에는 꼭 있어야 했다.

이게 테스트에서 안 드러난 이유가 이번 일의 요점이다. 시뮬레이터에서 앱을 돌리면 dyld 는 앱 안이 아니라 Xcode 의 빌드 폴더에서도 라이브러리를 찾는다. 거기엔 AMSMB2 가 있으니 실행도, 테스트도 멀쩡했다. 업로드도 서버 검증도 통과했다. 빠진 것은 기기에 설치되는 앱 묶음 안에서만 보였다.

처방은 둘이다. 앱 타깃에 Embed Frameworks 단계를 만들고 AMSMB2 를 서명과 함께 복사하게 했다. 다시 아카이브하니 `Frameworks/AMSMB2.framework` 가 들어 있다. 그리고 출시 레인이 업로드 전에 실행 파일의 `@rpath` 의존을 하나씩 앱 안에서 찾고, 없으면 멈춘다. ipa 검사 스크립트에도 같은 검사를 넣었다. 깨진 빌드 57 을 넣으면 BLOCK 이 뜨고, 고친 빌드는 통과한다.

세 번째로 같은 줄기를 배운다. 이번엔 테스터에게 풀린 것까지 확인했는데도 모자랐다. 업로드 성공도, 베타 상태도, 시뮬레이터에서 도는 것도 "기기에서 켜진다" 의 증거가 아니다. 그 증거는 기기에 들어가는 묶음 자체에 있어야 하고, 사람보다 먼저 스크립트가 열어 봐야 한다.

## 이력

- 2026-09-24 — 수출 규정 답이 없어 빌드 넷이 테스터에게 안 풀린 일, 서버보다 뒤처진 빌드 번호
- 2026-11-03 — 정적 라이브러리를 감싼 프레임워크에 Xcode 가 스텁을 끼워 ITMS-90208 로 거절된 빌드 48
- 2026-11-05 — 동적 라이브러리를 링크만 하고 앱에 넣지 않아 실행 즉시 죽은 빌드 56·57
