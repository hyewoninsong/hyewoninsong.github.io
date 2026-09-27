---
title: "CPU 가 모자란 줄 알았는데, 기다려 주는 시간이 짧았다"
date: 2026-09-27T21:40:00+09:00
app: "notequiz"
tags: ["devlog", "appstore"]
summary: "심사에 올릴 빌드가 세 번 연달아 빌드도 시작하기 전에 죽었다. 머신이 바빠서라고 생각했지만 재 보니 아니었다. 한가할 때도 20초 넘게 걸리는 단계를 도구가 24초까지만 기다리고 있었고, 그다음엔 여럿이 같이 쓰는 빌드 캐시가 빈 폴더로 깨져 있었다."
---

SuperMusicNote 1.0 을 심사에 올리려고 TestFlight 빌드를 만들었는데, 세 번 연달아 컴파일도 하기 전에 실패했다. 첫 실패 메시지에 "timed out" 이 있었고 그때 머신의 load 는 15 근처였으니, 결론은 금방 나왔다. "CPU 가 모자라다." **틀린 결론이었다. 부하를 원인으로 짚기 전에 그 단계가 원래 몇 초 걸리는지부터 쟀어야 했다.**

## 첫 번째: 원래 20초 걸리는 일을 24초까지만 기다렸다

fastlane 의 `build_app` 은 빌드에 앞서 `xcodebuild -showBuildSettings` 로 프로젝트 설정을 읽는다. 이 호출이 3초 안에 안 끝나면 6초, 12초, 24초로 늘려 가며 네 번 시도하고 포기한다. 실패 메시지는 이랬다.

```
xcodebuild -showBuildSettings timed out after 4 retries with a base timeout of 3.
```

배포가 끝나 부하가 4까지 내려간 뒤 같은 명령을 직접 재 봤더니 21초가 나왔다. 다시 재니 26초였다. 한가할 때도 이만큼 걸린다는 뜻이다. `-disableAutomaticPackageResolution` 을 붙이면 3초로 떨어졌다. 시간을 잡아먹는 건 CPU 가 아니라 **Swift Package 의존성 해석**이었다. 이 앱은 Firebase 를 SPM 으로 받는데, 설정을 한 번 읽을 때마다 Firebase 와 그 밑의 gRPC·abseil 같은 패키지 그래프를 다시 푼다.

결국 기본 상태에서도 마지막 시도의 24초와 실제 소요 시간 사이 여유가 몇 초뿐이었다. 머신이 조금만 바빠도 네 번 다 넘긴다. 부하를 원인으로 본 게 완전히 틀리지는 않았지만, CPU 를 비우는 건 해법이 아니었다. 문턱이 처음부터 너무 낮았다.

고친 건 한 줄이다. `FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT` 을 60초로 올렸다. 앱마다 쓰는 배포 스크립트에도 같은 값을 기본으로 넣어서, 다른 앱이 Firebase 를 들여도 같은 자리에서 죽지 않게 했다.

## 두 번째: 공유 빌드 캐시가 빈 폴더로 깨져 있었다

문턱을 넘긴 다음 시도는 다른 이유로 죽었다.

```
error: There is no XCFramework found at '.../SourcePackages/artifacts/
firebase-ios-sdk/FirebaseAnalytics/FirebaseAnalytics.xcframework'
```

가서 보니 그 폴더는 있는데 비어 있었다. Firebase Analytics 는 소스가 아니라 미리 빌드된 바이너리(xcframework)로 온다. 이 바이너리가 압축을 푸는 도중 끊겼는지 폴더만 남아 있었다. 패키지 해석은 "이미 있다" 고 판단해서 다시 받지 않았고, 아카이브는 매번 똑같은 자리에서 실패했다. 이런 실패는 재시도해도 결과가 같다.

이 캐시는 Xcode 기본 DerivedData 안에 있어서, 같은 프로젝트로 빌드하거나 테스트를 돌리는 모든 작업이 함께 쓴다. 여러 작업이 동시에 돌 때가 많은 머신에서 한 번 깨진 캐시는 누구 것인지도 모른 채 모두를 넘어뜨린다.

그래서 배포는 이제 배포 전용 DerivedData 에서만 빌드한다. 매번 Firebase 를 새로 컴파일하지만 1분 반 정도라 감당할 만하고, 무엇보다 다른 작업이 남긴 상태에 영향받지 않는다. 이미 깨진 공유 캐시는 `SourcePackages/artifacts` 폴더만 지웠다. 다음 해석 때 바이너리를 다시 풀어 온다. DerivedData 전체를 지울 필요는 없었다.

## 무엇이 있었으면 빨리 찾았을까

두 실패 모두 메시지는 정확했는데 읽는 쪽이 앞질러 갔다. "timed out" 을 보자마자 부하를 떠올렸고, 부하가 실제로 높았으니 그 해석이 그럴듯해 보였다. 5초면 끝나는 확인 하나가 이 추측을 바로잡았다.

```
time xcodebuild -showBuildSettings -scheme <앱> -project <앱>.xcodeproj
```

20초대가 나오면 부하 문제가 아니라 문턱 문제다. 이 확인 순서를 배포 절차 문서에 적어 뒀다.

## 지금은

같은 설정으로 1.0 (build 8) 이 TestFlight 에 올라갔고, 크래시 리포트용 심볼 업로드까지 끝났다. 심사 버전에도 연결했다. 남은 건 제출 버튼을 누르는 일뿐이다. 그 공유 캐시가 처음에 왜 빈 폴더가 됐는지는 끝내 확인하지 못했다. 동시에 돈 두 빌드의 경합이 가장 유력하지만, 배포가 더는 그 캐시를 쓰지 않으니 다시 문제 될 일은 없다.
