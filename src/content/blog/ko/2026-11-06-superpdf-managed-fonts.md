---
title: "글꼴 앱으로 깐 글꼴이 목록에 없었다 — iOS 는 그 글꼴을 이름으로만 내준다"
date: 2026-11-06T08:53:07+09:00
app: "superpdf"
tags: ["devlog", "uikit"]
summary: "프로파일로 설치한 글꼴은 앱의 글꼴 목록 API 어디에도 안 나온다. 이름으로 물으면 답한다. 목록은 시스템이 남긴 캐시 파일에서 읽기로 했다."
---

SuperFont 로 깐 글꼴이 이제 SuperPDF 글상자의 "모든 글꼴" 에 나온다. 어제도 같은 제목으로 고쳤다고 올렸는데, 실제 폰에서는 그대로였다 — 처방이 추정이었고, 추정은 틀렸다.

## 두 번째 보고가 왔다

SuperPDF 글상자는 폰에 있는 글꼴을 다 고를 수 있다. 어제 "구성 프로파일로 깐 글꼴이 목록에 없다" 는 보고를 받고, `UIFont.familyNames` 가 그 글꼴을 빠뜨리니 CoreText 레지스트리의 서술자 전체(`CTFontCollectionCreateFromAvailableFonts`)를 합치면 된다고 고쳤다. 시뮬레이터에는 프로파일 설치가 없어서 테스트가 그 길을 밟지 못했고, "실기만 확인 가능" 이라고 적고 넘겼다.

다음 날 같은 보고가 돌아왔다.

## 실기에 테스트 하나를 올려 보니

폰은 Wi-Fi 로 Mac 에 붙어 있었다. 캡처 파이프라인도 UI 테스트도 필요 없었다 — 단위 테스트 하나에 `print` 를 잔뜩 넣고 `xcodebuild test -destination "id=<기기>"` 로 돌리면 로그에 그대로 남는다. 첫 시도는 폰이 잠겨 있어서 15분 뒤 "test runner 연결 끊김" 으로 끝났다. 잠금을 풀고 다시 돌리니 2분이었다.

결과는 예상과 달랐다.

| 물어본 곳 | 답 |
|---|---|
| `UIFont.familyNames` | 86 가족 — 전부 iOS 기본 |
| `CTFontManagerCopyAvailableFontFamilyNames` | 같은 86 |
| `CTFontCollectionCreateFromAvailableFonts` 의 서술자 | 295개, 파일 경로가 전부 `/System/Library/Fonts` |
| `CTFontManagerCopyRegisteredFontDescriptors` | 0 |
| `UIFont(name: "MaplestoryOTFLight")` | **Maplestory OTF** — 나온다 |

프로파일로 깐 글꼴 174개(Google Sans, Inter, Montserrat, Poppins, Roboto, NEXON Lv2, 메이플스토리, 배찌)가 **목록을 주는 API 어디에도 없다.** 그런데 PostScript 이름으로 만들어 달라고 하면 만들어 준다. 가족 이름을 필수 키로 건 서술자 매칭도 찾는다. 설정 앱의 글꼴 화면과 iOS 의 글꼴 고르기 시트가 그 글꼴을 보여 주는 건 시스템 프로세스여서다. 서드파티 앱은 "이름을 알면 쓸 수 있고, 뭐가 있는지는 물을 수 없다".

어제의 처방은 "서술자 전체에는 들어 있다" 였다. 들어 있지 않았다.

## 이름은 어디서 얻나

글꼴 파일은 `/var/mobile/Library/Fonts/Managed/` 에 `<PostScript이름>_<해시>` 꼴로, 확장자 없이 놓여 있고 앱 샌드박스가 읽을 수 있다. 그 옆에 `AddedFontCache.plist` 가 있다 — 파일 경로마다 가족 이름, PostScript 이름, 전체 이름이 적힌 iOS 자신의 캐시다. 이걸 읽으면 174개 파일을 열지 않고도 여덟 가족의 이름이 나온다.

그래서 목록은 세 겹이 됐다. 레지스트리 목록 API(기본 글꼴과 Apple 이 내려 준 글꼴), 그 plist 의 가족 이름, 그리고 plist 에 아직 없는 파일만 `CTFontManagerCreateFontDescriptorsFromURL` 로 직접 읽은 것. 그리는 쪽은 안 바꿨다 — 이름 조회는 원래 됐다.

등록은 안 한다. 파일 URL 로 `CTFontManagerRegisterFontsForURL` 을 부르면 105 "이미 등록됨" 이 온다 — 시스템 입장에서는 이미 등록된 글꼴이고, 앱에 열거만 안 해 주는 것이다. 파일 데이터로 서술자를 만들어 프로세스에 등록하는 것도 303 으로 거절된다. 필요도 없었다.

## 진 대안

- Fonts capability(`com.apple.developer.user-fonts`)로 정식으로 훑기 — App ID 에 없는 capability 는 배포 서명을 막는다. 이 앱은 그 함정에 iCloud 로 4주를 잃었다.
- 174개 파일을 전부 열어 서술자를 읽기 — 60MB 를 시트 열 때마다 읽는다. plist 가 있는데 그럴 이유가 없다.
- iOS 글꼴 고르기 시트로 보내기 — 어제까지의 답. 되긴 하지만 "이 기기에 있는 글꼴" 목록에 없는 글꼴을 사용자가 왜 다른 버튼에서 찾아야 하는지 설명이 안 된다. 버튼은 남겼다 — Fonts capability 로 글꼴 앱이 영구 등록한 글꼴은 여전히 그 길뿐이다.

## 무엇이 잡았어야 했나

"실기만 확인 가능" 을 적는 순간이 확인하는 순간이어야 했다. 폰은 붙어 있었고 10분이면 됐다. 이제 프로파일 가족이 하나라도 있으면 목록에 있는지, 그 가족으로 그려지는지 단언하는 테스트가 있다. 시뮬레이터와 프로파일 없는 기기에서는 조용히 건너뛰고, 실기에서만 산다.

`Managed/` 와 `AddedFontCache.plist` 는 iOS 의 비공개 배치다. 언젠가 바뀌면 목록은 조용히 빈 집합이 되고 크래시는 없다 — 그때는 글꼴 고르기 버튼이 남아 있다.
