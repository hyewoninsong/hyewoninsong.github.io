# Hyewon & Insong 회사 홈페이지 기획서

## 1. 프로젝트 개요

|항목       |내용                                    |
|---------|--------------------------------------|
|프로젝트명    |Hyewon & Insong 공식 홈페이지               |
|기술 스택    |Astro + Markdown (Content Collections)|
|호스팅      |GitHub Pages                          |
|반응형 지원   |모바일 / 태블릿 / PC                        |
|콘텐츠 작성 방식|Markdown 파일 기반 (이미지 첨부 지원)            |
|다국어      |한국어 (기본) + 영어 지원 (i18n)               |
|기본 언어    |한국어 (`/ko/...`), 영어 (`/en/...`)       |
|언어 감지    |브라우저 언어 설정 기반 자동 리다이렉트 (루트 `/` 접속 시)  |

-----

## 2. 사이트 구조

```
홈페이지
├── / (루트) → 브라우저 언어 감지 후 /ko 또는 /en으로 리다이렉트
│
├── /ko/  (한국어)
│   ├── 회사 소개 (/ko/about)
│   ├── 앱 소개 (/ko/apps)
│   │   ├── 앱 목록 페이지
│   │   ├── 개별 앱 상세 (/ko/apps/[slug])
│   │   └── 앱별 지원 · 개인정보 (/ko/apps/[slug]/support, /privacy, /android/privacy)
│   └── 개발 블로그 (/ko/blog)
│       ├── 글 목록 (날짜순)
│       ├── 앱별 글 (/ko/blog/app/[app])
│       ├── 태그 필터 (/ko/blog/tag/[tag])
│       └── 개별 글 (/ko/blog/[slug])
│
└── /en/  (English)
    ├── About (/en/about)
    ├── Apps (/en/apps)
    │   ├── App list
    │   ├── App detail (/en/apps/[slug])
    │   └── Per-app support · privacy (/en/apps/[slug]/support, /privacy, /android/privacy)
    └── Dev Blog (/en/blog)
        ├── Post list (by date)
        ├── Posts by app (/en/blog/app/[app])
        ├── Tag filter (/en/blog/tag/[tag])
        └── Post detail (/en/blog/[slug])

언어 경로 밖 (앱이 공유하는 링크의 도착지 — 브라우저 언어로 문구를 고른다)
├── /timetable/request/   시간표 요청 링크 랜딩 (docs/adr/0002-timetable-request-landing.md)
└── /invite/timetable/    시간표 초대 랜딩, 정적 HTML (docs/decisions/2026-10-01-timetable-invite.md)
```

-----

## 3. 공통 요소

### 3.1 헤더 (Header)

- 좌측: 회사 로고 + “Hyewon & Insong” 텍스트
- 우측: 네비게이션 탭 3개 — `회사 소개` | `앱` | `블로그` + 언어 전환 버튼 (`KO` / `EN`)
- 언어 전환 시 현재 보고 있는 페이지의 해당 언어 버전으로 이동 (예: `/ko/apps` → `/en/apps`)
- 모바일: 햄버거 메뉴로 전환, 언어 전환 버튼은 메뉴 내부 또는 헤더에 항상 노출

### 3.2 푸터 (Footer)

- 회사명: Hyewon & Insong
- 저작권 표시: © 2025 Hyewon & Insong. All rights reserved.
- 연락처 이메일 (선택)
- SNS / GitHub 링크 (선택)

### 3.3 반응형 브레이크포인트

|디바이스|너비          |
|----|------------|
|모바일 |~767px      |
|태블릿 |768px~1023px|
|PC  |1024px~     |

### 3.4 다국어 (i18n) 전략

**Astro i18n 라우팅 방식:** 언어별 디렉토리 기반 (`/ko/...`, `/en/...`)

**UI 텍스트 관리:** 네비게이션, 버튼, 상태 뱃지 등 고정 UI 문자열은 JSON 번역 파일로 관리

```
src/i18n/
├── ko.json    # { "nav.about": "회사 소개", "nav.apps": "앱", "status.released": "출시", "status.review": "심사중", "status.dev": "개발중", "status.releasedOn": "{date} 출시", ... }
└── en.json    # { "nav.about": "About", "nav.apps": "Apps", "status.released": "Released", "status.review": "In Review", "status.dev": "In Development", "status.releasedOn": "Released {date}", ... }
```

**콘텐츠 관리:** md 파일을 언어별로 분리하여 작성

```
src/content/
├── about/
│   ├── ko.md         # 한국어 회사 소개
│   └── en.md         # English about page
├── apps/
│   ├── ko/           # 한국어 앱 소개 — timetable · superfont · musicnote · planner · pdf
│   │   ├── timetable.md
│   │   └── …
│   └── en/           # English app descriptions (같은 다섯 파일)
│       ├── timetable.md
│       └── …
└── blog/
    ├── ko/           # 한국어 블로그 글
    └── en/           # English blog posts
```

**번역 원칙:**

- 회사 소개, 앱 소개는 한국어/영어 모두 작성
- 블로그 글은 선택적으로 번역 (한국어만 있어도 됨, 영어만 있어도 됨)
- 해당 언어 버전이 없는 블로그 글은 목록에 표시하지 않음
- 루트 URL(`/`) 접속 시 브라우저 `Accept-Language` 기반으로 `/ko` 또는 `/en`으로 리다이렉트 (정적 사이트이므로 JS로 클라이언트 사이드 처리)

-----

## 4. 페이지별 상세 기획

### 4.1 회사 소개 페이지 (/ko/about, /en/about)

**콘텐츠 작성 방식:** `src/content/about/ko.md`, `src/content/about/en.md` 각각 편집하면 해당 언어 페이지에 반영

**기본 포함 내용:**

- 회사 소개 인사말
- 핵심 정보
  - 대한민국에 위치한 모바일 앱 개발사
  - 일상을 편리하게 만드는 앱을 개발한다는 미션
- 회사 비전 또는 철학 (간단히)
- 이미지 삽입 영역 (팀 사진, 로고, 작업 환경 등)

**레이아웃 (PC 기준):**

```
┌──────────────────────────────────────────┐
│              회사 소개 히어로             │
│    "모바일로 일상을 더 편리하게"          │
├──────────────────────────────────────────┤
│                                          │
│  [이미지]     소개 텍스트 본문            │
│              (md에서 자유롭게 작성)       │
│                                          │
│  미션 / 비전 섹션                         │
│                                          │
│  위치: 대한민국                           │
│  분야: 모바일 앱 개발                     │
│                                          │
└──────────────────────────────────────────┘
```

- 모바일: 이미지와 텍스트가 세로로 쌓이는 1컬럼 레이아웃

> **현재 상태 (2026-09-17):** 회사 소개는 짧게 — 한 문단 인사말 + 원칙 카드 3개(손이 먼저 · 꼭 필요한 만큼만 · 실수해도 괜찮게) + 앱/블로그 링크. 기술 스택·수치·프로세스·앱 설명 섹션은 뺐다. `about/*.md` 본문은 SEO description 과 같은 문구를 담는 원본이고 페이지는 `about.astro` 가 직접 그린다.

-----

### 4.2 앱 소개 페이지 (/ko/apps, /en/apps)

**콘텐츠 작성 방식:** `src/content/apps/ko/`, `src/content/apps/en/` 폴더 안에 앱마다 `.md` 파일 하나씩 추가. 동일한 slug를 사용하여 언어 간 매칭.

```
src/content/apps/
├── ko/
│   ├── timetable.md
│   ├── fontbox.md
│   └── (새 앱 출시 시 .md 파일 추가)
└── en/
    ├── timetable.md
    ├── fontbox.md
    └── ...
```

**각 앱 md 파일의 frontmatter 예시 (한국어):**

```yaml
---
title: "SuperTimetable"
slug: "timetable"
icon: "/apps/timetable/icon.png"   # public/ 경로 — 카드와 상세 상단에 그려진다 (없으면 제목만)
summary: "한 눈에 보는 나만의 시간표"
platforms:              # 기기별로 따로 — 뱃지가 이 값 하나로 그려진다
  iphone: "released"    # "released" | "in-review" | "in-development"
  ipad: "released"
appStoreUrl: "https://apps.apple.com/app/id6760938147"   # 나라 없는 형태 — 방문자의 스토어로 리다이렉트된다
releaseDate: 2026-09-22 # 있으면 카드와 상세 상단에 "2026년 9월 22일 출시" 한 줄이 붙는다
order: 1                # 목록 정렬 순서
comingSoon: false       # true 면 상세 페이지 본문 대신 "준비중" 안내만 나온다
---
```

**frontmatter 예시 (영어):**

```yaml
---
title: "SuperTimetable"
slug: "timetable"
icon: "/apps/timetable/icon.png"
summary: "Your schedule at a glance"
platforms:
  iphone: "released"
  ipad: "released"
appStoreUrl: "https://apps.apple.com/app/id6760938147"
releaseDate: 2026-09-22
order: 1
---
```

상태 문자열은 `src/lib/platform-status.ts` 한 곳에서 뱃지 색과 i18n 키로 바뀐다 — 상태를 더하려면
그 파일과 `src/i18n/{ko,en}.json`, `src/content.config.ts` 의 enum 셋을 같이 고친다.
출시일 문장도 같은 파일의 `releaseLine()` 하나를 거친다. 어순(한국어는 날짜 뒤, 영어는 앞)은
`status.releasedOn` 의 `{date}` 자리가 정하고, 날짜는 UTC 로 찍는다 — frontmatter 의 `2026-09-22` 가
UTC 자정으로 파싱되기 때문에 현지 시간대로 찍으면 하루 밀린다.

#### 4.2.1 앱 목록 페이지 (/ko/apps, /en/apps)

- 카드 그리드 형태로 모든 앱 표시
- 각 카드: 앱 아이콘 + 앱 이름 + 한 줄 소개 + 상태 뱃지(출시/개발중)
- 아이콘 파일은 앱 저장소의 Icon Composer 번들(`<App>.icon`)을 라이트 외관으로 합성해 만든다
  (`web-app-page` 스킬의 `scripts/app-icon.swift`, 256px). 번들이 없고 `AppIcon.appiconset` 만
  있는 앱은 라이트용 `AppIcon-1024.png` 를 256px 로 줄여 쓴다. 곡률은 파일이 아니라 `.app-icon`
  클래스가 준다 — iOS 앱 아이콘과 같은 22.37%
- PC: 한 줄에 2~3개 카드 / 태블릿: 2개 / 모바일: 1개
- 카드 클릭 시 해당 앱 상세 페이지로 이동

> **현재 상태 (2026-10-05):** 목록에는 다섯이 보인다 — SuperTimetable·SuperFont(둘 다 2026-09-22 App Store 출시, 상세 페이지 있음), SuperMusicNote·SuperPlanner(iPhone·iPad 개발중, 전용 상세 페이지 `musicnote.astro`·`planner.astro` 가 있고 2026-09-24 에 스크린샷을 넣었다), SuperPDF(iPhone 개발중, `comingSoon: true` 라 상세는 "준비중" 안내 한 장). SuperTimetable 은 2026-09-26 부터 Android 개발중 뱃지도 단다 (`platforms.android: "in-development"`). SuperPlanner 는 2026-09-21 에 아이콘을 넣어(앱 저장소의 `AppIcon-1024.png` 를 256px 로 줄인 `/apps/planner/icon.png`) 카드와 상세 상단에 그려진다. SuperTimetable 아이콘(`/apps/timetable/icon.png`)은 2026-09-23 에 앱 쪽 아이콘 재제작(그림자 제거·iOS 시스템색·둥근 모서리)에 맞춰 `SuperTimetable.icon` 번들에서 다시 합성했다. 다섯 앱 모두 아이콘(`/apps/<slug>/icon.png`)이 있고, 스샷이 아직 없는 것은 SuperPDF 하나다. 스크린샷은 두 배치가 있다 — 전용 상세 페이지가 있는 앱(timetable · superfont · musicnote · planner)은 언어별 `public/apps/<slug>/{ko,en}/<이름>.png` 에 두고 페이지의 `img()` 헬퍼로 현재 로케일 폴더를 고르며, 보관된 supertimers 는 언어 구분 없는 평면 `public/apps/<slug>/<이름>.png` 다. 두 배치 모두 ko/en 페이지가 가리키는 파일이 실제로 있고 서로 같은지는 `tests/app-screenshots.test.mjs` 가 본다. 소개가 준비되면 `comingSoon` 을 지우고 본문(또는 `AppPage.astro` 를 쓰는 전용 페이지)을 채운다. 나머지 앱(mathmaster · notequiz · supertimers)의 페이지와 md 는 지우지 않고 `src/_archive/` 로 옮겨 라우팅에서 뺐다 — 다시 보이게 하려면 `src/pages/{ko,en}/apps/` 와 `src/content/apps/{ko,en}/` 로 되돌리면 된다 (SuperFont 는 App Store 제출용 지원·개인정보 URL 이 필요해 2026-09-18 에 되돌렸다). 앱마다 App Store 에 넣는 페이지가 둘 있다: `/{lang}/apps/<slug>/support/` (지원 URL) 와 `/{lang}/apps/<slug>/privacy/` (개인정보 처리방침 URL). 지금 있는 것은 SuperFont 의 둘과 SuperTimetable 의 `privacy` 이고, 앱에 묶이지 않은 `/{lang}/support/` · `/{lang}/privacy/` 가 따로 있다. Android 전용 정책은 `/{lang}/apps/<slug>/android/privacy/` 에 따로 둔다 (Play Console 개인정보처리방침 URL) — 2026-10-02 에 SuperMusicNote 와 SuperPlanner 것이 생겼다. 현재 배포 빌드의 SDK·권한·백업 설정 및 Play 데이터 보안 신고와 맞추고, iOS 정책의 IDFA/ATT 문구나 공통 정책의 Firebase 서술을 그대로 옮기지 않는다: SuperMusicNote Android 는 Firebase Analytics·Crashlytics 를 쓴다고 밝히고(광고 ID 는 수집하지 않음, 클라우드 백업 꺼짐), SuperPlanner Android 1.0.0 은 Firebase 가 없어 기기 저장·Android 백업·JSON 내보내기만 적고 Analytics 는 "도입 예정" 으로만 표시한다 — 도입 예정인 SDK를 현재 수집 사실로 쓰지 않는다 (`docs/decisions/2026-10-02-planner-android-privacy.md`, `docs/references/privacy-policy-host-and-platform-pitfall.md`). 공통 개인정보 페이지(`/{lang}/privacy/`)는 앱별 정책으로 연결한다 — 지금 걸린 것은 SuperPlanner Android · SuperMusicNote Android · SuperTimetable 셋이다. 앱 상세 페이지 맨 아래에는 그 앱의 블로그 글 최근 셋이 "개발 기록" 으로 붙는다 (`AppDevlog.astro`, §4.3.4). iOS 개인정보 페이지의 "앱 개인정보" 표는 그 앱의 `PrivacyInfo.xcprivacy` 와 같아야 한다. SuperTimetable iOS 정책은 2026-09-28 시행 판부터 Firebase Analytics 항목에 **앱 내 구매 여부**(프리미엄 화면을 연 위치, 구매·복원 여부)를 적는다 — 결제·영수증은 Apple 이 처리하고 앱은 결제 정보를 받지 않는다는 문장을 같이 둔다(ko/en 둘 다, `tests/privacy-pages.test.mjs` 가 본다). 2026-10-08 시행 판부터는 앱 1.2.0 의 iCloud 백업(설정 기본 켜짐)에 맞춰 1조를 "기기에 저장" 으로 고치고 iCloud 백업 항목을 넣었다 — 백업 파일은 **사용자 본인의 iCloud** 에 Apple 이 보관하고 개발자는 접근할 수 없으며 기기 간 동기화는 없다. "기기 안에만 저장"·"클라우드 동기화 기능이 없습니다" 같은 옛 문장은 다시 쓰지 않고, 앱 페이지(`src/content/apps/{ko,en}/timetable.md`)의 마지막 문장도 같은 뜻으로 맞춘다 (`docs/decisions/2026-10-08-timetable-icloud-backup-disclosure.md`, `tests/privacy-pages.test.mjs` 가 ko/en 둘 다 본다). 구매 여부 항목은 구매 화면이 있는 1.1.1 이 라이브인 동안 그대로 두고, 1.2.0 출시 뒤 인앱 판매 중단과 함께 내린다. 상세 페이지 `timetable.astro` 는 스토어 소개글(`fastlane/metadata/*/description.txt`)의 섹션 순서를 따르되 **기능 나열이 아니라 편해지는 점**을 리드 문장으로 쓴다. 개인정보 페이지의 ko/en 짝(존재·시행일·`<h2>/<h3>/<li>` 개수), 공통 페이지의 링크, Android 정책의 문구 규칙, SuperTimetable 의 구매 여부 고지는 `tests/privacy-pages.test.mjs` 가 본다.

**레이아웃:**

```
┌──────────────────────────────────────────┐
│            우리가 만든 앱                 │
├────────────┬────────────┬────────────────┤
│ ┌────────┐ │ ┌────────┐ │                │
│ │  아이콘 │ │ │  아이콘 │ │                │
│ │시간표   │ │ │FontBox │ │                │
│ │  출시   │ │ │ 개발중  │ │                │
│ └────────┘ │ └────────┘ │                │
└────────────┴────────────┴────────────────┘
```

#### 4.2.2 앱 상세 페이지 (/ko/apps/[slug], /en/apps/[slug])

- md 본문이 그대로 렌더링
- 스크린샷 이미지 삽입 지원 (md 이미지 문법 사용)
- 상단에 앱 아이콘, 이름, 상태 뱃지, 앱스토어 링크(출시된 경우) 표시

-----

### 4.3 개발 블로그 (/ko/blog, /en/blog)

**콘텐츠 작성 방식:** `src/content/blog/ko/`, `src/content/blog/en/` 폴더 안에 글마다 `.md` 파일 추가. 블로그 글은 선택적 번역 — 한국어만 작성해도 되고, 양쪽 모두 작성해도 됨.

> **현재 상태 (2026-10-08):** 글은 ko·en 각 93편이고 지금은 전부 양쪽 언어로 있다. 같은 주제의 후속 세션은 새 글을 만들지 않고 기존 파일에 합쳐 쓴다(10월 7일 하루에 글 커밋이 스물일곱 올라왔는데 새 글은 다섯이고 스물하나가 그런 `improve:` 갱신, 하나가 문장 정정 `fix:` 였고, 10월 8일에는 스물다섯 중 새 글 다섯·`improve:` 갱신 스물이다 — 발행 당일에 같은 글이 세 번 더 합쳐지기도 한다) — 그래서 파일 이름의 날짜는 첫 발행일이고 frontmatter 의 `date` 는 마지막 갱신 시각이라 둘이 다를 수 있으며, 목록은 `date` 순이라 갱신된 글이 위로 올라온다. 대부분 앱 저장소의 devlog 세션이 올리고 하루에 여러 편이 올라온다 — 그래서 `date` 는 날짜만이 아니라 **한국 시각까지** 적는다 (`2026-09-29T20:47:41+09:00`). 목록 순서는 그 시각의 내림차순이고(`src/lib/blog-posts.ts` 의 `byNewest`), 화면에는 한국 날짜(YYYY-MM-DD)만 나온다. frontmatter 의 `app` 은 그 글이 어느 앱을 만들다 나왔는지로, `src/lib/blog-apps.ts` 의 `BLOG_APPS` 키다 (`timetable` · `superfont` · `daily-planner` · `superpdf` · `notequiz` · `supermath` · `supertimers`). 앱 저장소의 슬러그라 apps 컬렉션의 `slug` 와 다를 수 있다 (`daily-planner` → `planner`, `notequiz` → `musicnote`). 앱과 무관한 글은 `app` 을 비운다. 본문 이미지는 `public/blog/<주제>/<이름>.png` 에 두고 본문에서 `/blog/<주제>/<이름>.png` 로 쓴다 (`<주제>` 는 글 파일 이름에서 날짜를 뗀 슬러그를 쓰는 것이 관례이고, 날짜까지 붙인 폴더는 `2026-10-05-timetable-grid-entrance-first-load/` 하나뿐이다). `thumbnail` 은 스키마에 남아 있지만 쓰는 글이 없다. 파일 이름 형식, 필수 frontmatter(`title`·`date`·`summary`)와 스키마 밖 키, `app` 이 `BLOG_APPS` 키인지(그리고 `BLOG_APPS` 의 `appSlug` 가 실제 apps 항목인지), 이미지 파일이 실제로 있는지, ko/en 짝의 `date`·`app`·이미지 목록이 같은지, 이미지에 alt 가 있는지, `date` 가 미래가 아닌지, `/{lang}/blog/<slug>` 링크가 실제 글인지는 `tests/blog-content.test.mjs` 가 본다 (`node --test "tests/**/*.test.mjs"`).

```
src/content/blog/
├── ko/
│   ├── 2025-01-15-timetable-dev-story.md
│   ├── 2025-02-01-fontbox-kickoff.md
│   └── ...
└── en/
    ├── 2025-01-15-timetable-dev-story.md   # (선택) 한국어 글의 영문 번역
    └── ...
```

**각 블로그 글 md 파일의 frontmatter 예시 (한국어):**

```yaml
---
title: "시간표 앱 개발기 - SwiftUI로 커스텀 그리드 만들기"
date: 2025-06-15T21:30:00+09:00           # 한국 시각까지 — 같은 날 글의 순서를 정한다
app: "timetable"                          # 선택 — src/lib/blog-apps.ts 의 키
tags: ["시간표", "SwiftUI", "개발일지"]
summary: "시간표 앱의 커스텀 그리드 뷰를 SwiftUI로 구현한 과정을 공유합니다."
thumbnail: "/blog/timetable-grid/grid.png"   # 선택 — public/ 기준 경로
---
```

**frontmatter 예시 (영어):**

```yaml
---
title: "Building a Timetable App - Custom Grid with SwiftUI"
date: 2025-06-15T21:30:00+09:00
app: "timetable"
tags: ["Timetable", "SwiftUI", "Dev Log"]
summary: "How we built a custom grid view for the timetable app using SwiftUI."
thumbnail: "/blog/timetable-grid/grid.png"
---
```

#### 4.3.1 블로그 목록 페이지 (/ko/blog, /en/blog)

- 최신순 정렬 (날짜 내림차순)
- 해당 언어로 작성된 글만 표시 (예: `/ko/blog`에서는 한국어 글만)
- 각 항목: 제목 + 작성일 + 태그 목록 + 요약 + 썸네일(선택)
- 페이지네이션 또는 무한 스크롤 (초기에는 페이지네이션 권장)
- 상단 또는 사이드바에 태그 필터 UI

> **현재 상태 (2026-09-29):** 페이지네이션은 아직 없다 — 그 언어의 글 전부를 한 페이지에 최신순으로 낸다. 글 목록 위에 "앱별" 카드(아이콘 · 앱 이름 · 글 수)가 먼저 오고, 그 아래 태그, 글 카드 순이다. 앱 키와 같은 태그는 태그 목록과 카드의 태그에서 빼고 앱 뱃지로 대신 보인다. 아래 레이아웃 그림은 초기 기획안이다.

**레이아웃 (PC):**

```
┌──────────────────────────────────────────┐
│  개발 블로그                             │
│                                          │
│  태그: [전체] [시간표] [FontBox] [Swift]  │
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ 📄 시간표 앱 개발기 - SwiftUI로...   │ │
│ │ 2025.06.15  #시간표 #SwiftUI        │ │
│ │ 시간표 앱의 커스텀 그리드 뷰를...    │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ 📄 FontBox 프로젝트 킥오프           │ │
│ │ 2025.02.01  #FontBox #개발일지      │ │
│ │ 폰트 설치 앱 개발을 시작합니다...    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│          [ 1 ] [ 2 ] [ 3 ] →             │
└──────────────────────────────────────────┘
```

#### 4.3.2 태그 필터 페이지 (/ko/blog/tag/[tag], /en/blog/tag/[tag])

- 특정 태그가 붙은 글만 필터링하여 동일한 목록 레이아웃으로 표시
- 상단에 현재 선택된 태그 표시 + “전체 보기” 링크

#### 4.3.3 블로그 글 상세 페이지 (/ko/blog/[slug], /en/blog/[slug])

- md 본문 렌더링 (코드 하이라이팅 포함)
- 이미지 삽입 지원
- 상단: 제목, 작성일, 태그
- 하단: 이전 글 / 다음 글 네비게이션

#### 4.3.4 앱별 글 페이지 (/ko/blog/app/[app], /en/blog/app/[app])

- `app` 값이 같은 글만 모아 동일한 목록 레이아웃으로 표시 (최신순)
- 상단: 앱 아이콘 + 앱 이름 + 글 수, 앱 소개 페이지 링크(apps 컬렉션에 그 앱이 있을 때) + "전체 보기" 링크
- 경로의 `[app]` 은 블로그 키다 (`/ko/blog/app/daily-planner`) — apps 의 slug 가 아니다
- `BLOG_APPS` 표에 없는 키의 글도 빠지지 않는다. 키가 그대로 이름으로 나온다
- 앱 상세 페이지의 "개발 기록" (`AppDevlog.astro`) 은 같은 기준으로 최근 세 편만 걸고 나머지는 이 페이지로 보낸다

-----

## 5. 초기 콘텐츠 계획

### 앱 목록

|앱 이름   |상태 |설명                   |
|-------|---|---------------------|
|SuperTimetable |출시 (iOS) · Android 개발중 |나만의 시간표를 만들고 관리하는 앱  |
|SuperFont |출시 (iOS) |iOS에서 폰트를 설치하고 관리하는 앱 (옛 이름 FontBox)|
|SuperMusicNote |개발중 |악보·음악 노트 앱|
|SuperPlanner |개발중 |하루 계획 앱|
|SuperPDF |개발중 (`comingSoon`) |PDF 앱|

### 블로그 (초기 게시글 예시)

- 회사 소개 및 첫 번째 앱 출시 안내
- 시간표 앱 개발 과정
- FontBox 개발 시작 소식

-----

## 6. 디자인 가이드라인

### 6.1 톤 & 분위기

- 깔끔하고 미니멀한 디자인
- 모바일 앱 개발사답게 모던하고 친근한 느낌
- 밝은 배경 기본, 다크 모드 지원 (선택)

### 6.2 컬러 (초안, 추후 조정 가능)

|용도       |컬러               |
|---------|-----------------|
|Primary  |#2563EB (파란 계열)  |
|Secondary|#10B981 (초록 계열)  |
|배경       |#FFFFFF / #F9FAFB|
|텍스트      |#111827          |
|서브 텍스트   |#6B7280          |

### 6.3 타이포그래피

- 본문: Pretendard 또는 Noto Sans KR
- 코드: JetBrains Mono 또는 Fira Code

-----

## 7. 프로젝트 디렉토리 구조 (Astro)

```
hyewoninsong.com/
├── src/
│   ├── content.config.ts      # Content Collections 스키마 정의 (about · apps · blog)
│   ├── content/
│   │   ├── about/
│   │   │   ├── ko.md          # 한국어 회사 소개
│   │   │   └── en.md          # English about
│   │   ├── apps/
│   │   │   ├── ko/            # 한국어 앱 소개
│   │   │   │   ├── timetable.md
│   │   │   │   ├── superfont.md
│   │   │   │   ├── musicnote.md
│   │   │   │   ├── planner.md
│   │   │   │   └── pdf.md
│   │   │   └── en/            # English app descriptions (같은 다섯 파일)
│   │   └── blog/
│   │       ├── ko/            # 한국어 블로그
│   │       │   └── YYYY-MM-DD-title.md
│   │       └── en/            # English blog
│   │           └── YYYY-MM-DD-title.md
│   ├── _archive/              # 라우팅에서 뺀 앱의 페이지·md (mathmaster · notequiz · supertimers)
│   ├── i18n/
│   │   ├── ko.json            # 한국어 UI 문자열
│   │   ├── en.json            # English UI strings
│   │   └── utils.ts           # i18n 헬퍼 함수 (getLangFromUrl, useTranslations 등)
│   ├── lib/
│   │   ├── asset-hash.ts      # 정적 파일 경로에 내용 해시를 붙인다
│   │   ├── blog-apps.ts       # 블로그 `app` 키 ↔ 앱 이름 · apps slug
│   │   ├── blog-posts.ts      # 글 순서(최신순)와 날짜 표기
│   │   └── platform-status.ts # 플랫폼 뱃지 · 출시일 문구
│   ├── layouts/
│   │   └── BaseLayout.astro   # 공통 레이아웃 (헤더, 푸터, lang 속성)
│   ├── pages/
│   │   ├── index.astro        # 루트: 브라우저 언어 감지 → /ko 또는 /en 리다이렉트
│   │   ├── ko/
│   │   │   ├── index.astro    # 한국어 랜딩
│   │   │   ├── about.astro
│   │   │   ├── support.astro
│   │   │   ├── privacy.astro
│   │   │   ├── apps/
│   │   │   │   ├── index.astro
│   │   │   │   ├── [slug].astro       # md 본문을 그대로 싣는 공용 상세 (pdf)
│   │   │   │   ├── timetable.astro    # AppPage.astro 를 쓰는 전용 상세
│   │   │   │   ├── superfont.astro
│   │   │   │   ├── musicnote.astro
│   │   │   │   ├── planner.astro
│   │   │   │   ├── timetable/
│   │   │   │   │   └── privacy.astro
│   │   │   │   ├── superfont/
│   │   │   │   │   ├── support.astro
│   │   │   │   │   └── privacy.astro
│   │   │   │   ├── musicnote/
│   │   │   │   │   └── android/privacy.astro   # Android 전용 정책 (Play)
│   │   │   │   └── planner/
│   │   │   │       └── android/privacy.astro
│   │   │   └── blog/
│   │   │       ├── index.astro
│   │   │       ├── [slug].astro
│   │   │       ├── app/
│   │   │       │   └── [app].astro
│   │   │       └── tag/
│   │   │           └── [tag].astro
│   │   ├── en/                # ko/ 와 같은 구조
│   │   └── timetable/
│   │       └── request.astro  # /timetable/request/ — 시간표 요청 링크 랜딩 (언어 경로 밖)
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── LanguageSwitcher.astro  # 언어 전환 버튼 컴포넌트
│   │   ├── AppCard.astro
│   │   ├── AppPage.astro      # 전용 앱 상세 페이지 템플릿
│   │   ├── AppDevlog.astro    # 앱 상세 아래 "개발 기록" (최근 글 셋)
│   │   └── BlogPostCard.astro
│   └── styles/
│       └── global.css
├── public/
│   ├── apps/<slug>/           # 앱 아이콘 · 스크린샷
│   ├── blog/<주제>/           # 블로그 본문 이미지
│   ├── invite/timetable/      # /invite/timetable/ 초대 랜딩 — index.html · invite.mjs · ready.json
│   ├── CNAME
│   ├── robots.txt
│   ├── favicon.ico
│   └── favicon.svg
├── tests/                     # node --test "tests/**/*.test.mjs" (npm test)
│   ├── app-screenshots.test.mjs   # 앱 상세 페이지 스크린샷 참조가 public/ 에 있고 ko/en 이 같은지
│   ├── blog-content.test.mjs      # 블로그 파일 이름 · 이미지 경로 · ko/en 짝 검사
│   ├── privacy-pages.test.mjs     # 개인정보·지원 페이지 ko/en 짝 · 공통 페이지 링크 · Android 정책 문구
│   └── timetable-invite.test.mjs  # 초대 링크 파싱 · 로케일 · 설치 링크
├── docs/                      # plans · specs · references · adr · decisions
├── .github/workflows/deploy.yml
├── astro.config.mjs           # i18n 설정 포함
├── package.json
└── tsconfig.json
```

-----

## 8. 배포 파이프라인

1. `main` 브랜치에 push
1. GitHub Actions 자동 트리거 (`.github/workflows/deploy.yml`, Node 22, `npm ci`)
1. `npm run build` → `dist/` 에 정적 파일 생성
1. `actions/upload-pages-artifact` 로 `dist/` 를 아티팩트로 올림 — `gh-pages` 브랜치는 쓰지 않는다
1. `actions/deploy-pages` 가 GitHub Pages 에 배포 · 서빙

-----

## 9. 콘텐츠 추가 워크플로우

### 새 앱 추가 시

1. `src/content/apps/ko/new-app.md` 파일 생성 (한국어)
1. `src/content/apps/en/new-app.md` 파일 생성 (영어) — 동일한 slug 사용
1. frontmatter에 title, slug, icon, summary, platforms, order 작성 (각 언어로)
1. 본문에 앱 설명 및 스크린샷 작성
1. push → 자동 빌드 및 배포

### 새 블로그 글 추가 시

1. `src/content/blog/ko/YYYY-MM-DD-title.md` 파일 생성 (한국어)
1. (선택) `src/content/blog/en/YYYY-MM-DD-title.md` 파일 생성 (영어 번역)
1. frontmatter에 title, date(한국 시각까지), app, tags, summary 작성 — 새 앱의 첫 글이면 `src/lib/blog-apps.ts` 의 `BLOG_APPS` 에 한 줄 추가
1. 본문 작성 (이미지, 코드 블록 자유롭게 사용) — 이미지는 `public/blog/<주제>/` 에 두고 `/blog/<주제>/<이름>.png` 로 참조
1. push → 자동 빌드 및 배포

-----

## 10. 추후 확장 고려사항

- 다크 모드
- RSS 피드 (블로그)
- 앱스토어 다운로드 수 / 리뷰 연동
- 검색 기능 (블로그 내 전문 검색)
- SEO 최적화 (Open Graph, sitemap.xml)