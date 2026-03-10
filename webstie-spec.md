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
│   │   └── 개별 앱 상세 (/ko/apps/[slug])
│   └── 개발 블로그 (/ko/blog)
│       ├── 글 목록 (날짜순)
│       ├── 태그 필터 (/ko/blog/tag/[tag])
│       └── 개별 글 (/ko/blog/[slug])
│
└── /en/  (English)
    ├── About (/en/about)
    ├── Apps (/en/apps)
    │   ├── App list
    │   └── App detail (/en/apps/[slug])
    └── Dev Blog (/en/blog)
        ├── Post list (by date)
        ├── Tag filter (/en/blog/tag/[tag])
        └── Post detail (/en/blog/[slug])
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
├── ko.json    # { "nav.about": "회사 소개", "nav.apps": "앱", "nav.blog": "블로그", "status.released": "출시", "status.dev": "개발중", ... }
└── en.json    # { "nav.about": "About", "nav.apps": "Apps", "nav.blog": "Blog", "status.released": "Released", "status.dev": "In Development", ... }
```

**콘텐츠 관리:** md 파일을 언어별로 분리하여 작성

```
src/content/
├── about/
│   ├── ko.md         # 한국어 회사 소개
│   └── en.md         # English about page
├── apps/
│   ├── ko/           # 한국어 앱 소개
│   │   ├── timetable.md
│   │   └── fontbox.md
│   └── en/           # English app descriptions
│       ├── timetable.md
│       └── fontbox.md
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
title: "시간표 관리"
slug: "timetable"
status: "출시"          # "출시" | "개발중"
icon: "./images/timetable-icon.png"
summary: "한 눈에 보는 나만의 시간표"
order: 1                # 목록 정렬 순서
---
```

**frontmatter 예시 (영어):**

```yaml
---
title: "Timetable"
slug: "timetable"
status: "released"      # "released" | "in-development"
icon: "./images/timetable-icon.png"
summary: "Your schedule at a glance"
order: 1
---
```

#### 4.2.1 앱 목록 페이지 (/ko/apps, /en/apps)

- 카드 그리드 형태로 모든 앱 표시
- 각 카드: 앱 아이콘 + 앱 이름 + 한 줄 소개 + 상태 뱃지(출시/개발중)
- PC: 한 줄에 2~3개 카드 / 태블릿: 2개 / 모바일: 1개
- 카드 클릭 시 해당 앱 상세 페이지로 이동

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
date: 2025-06-15
tags: ["시간표", "SwiftUI", "개발일지"]
summary: "시간표 앱의 커스텀 그리드 뷰를 SwiftUI로 구현한 과정을 공유합니다."
thumbnail: "./images/timetable-grid.png"   # 선택
---
```

**frontmatter 예시 (영어):**

```yaml
---
title: "Building a Timetable App - Custom Grid with SwiftUI"
date: 2025-06-15
tags: ["Timetable", "SwiftUI", "Dev Log"]
summary: "How we built a custom grid view for the timetable app using SwiftUI."
thumbnail: "./images/timetable-grid.png"
---
```

#### 4.3.1 블로그 목록 페이지 (/ko/blog, /en/blog)

- 최신순 정렬 (날짜 내림차순)
- 해당 언어로 작성된 글만 표시 (예: `/ko/blog`에서는 한국어 글만)
- 각 항목: 제목 + 작성일 + 태그 목록 + 요약 + 썸네일(선택)
- 페이지네이션 또는 무한 스크롤 (초기에는 페이지네이션 권장)
- 상단 또는 사이드바에 태그 필터 UI

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

-----

## 5. 초기 콘텐츠 계획

### 앱 목록

|앱 이름   |상태 |설명                   |
|-------|---|---------------------|
|시간표 관리 |출시 |나만의 시간표를 만들고 관리하는 앱  |
|FontBox|개발중|iOS에서 폰트를 설치하고 관리하는 앱|

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
hyewon-insong-website/
├── src/
│   ├── content/
│   │   ├── config.ts          # Content Collections 스키마 정의
│   │   ├── about/
│   │   │   ├── ko.md          # 한국어 회사 소개
│   │   │   └── en.md          # English about
│   │   ├── apps/
│   │   │   ├── ko/            # 한국어 앱 소개
│   │   │   │   ├── timetable.md
│   │   │   │   └── fontbox.md
│   │   │   └── en/            # English app descriptions
│   │   │       ├── timetable.md
│   │   │       └── fontbox.md
│   │   └── blog/
│   │       ├── ko/            # 한국어 블로그
│   │       │   └── 2025-xx-xx-title.md
│   │       └── en/            # English blog
│   │           └── 2025-xx-xx-title.md
│   ├── i18n/
│   │   ├── ko.json            # 한국어 UI 문자열
│   │   ├── en.json            # English UI strings
│   │   └── utils.ts           # i18n 헬퍼 함수 (getLangFromUrl, useTranslations 등)
│   ├── layouts/
│   │   ├── BaseLayout.astro   # 공통 레이아웃 (헤더, 푸터, lang 속성)
│   │   ├── MarkdownLayout.astro
│   │   └── BlogPost.astro
│   ├── pages/
│   │   ├── index.astro        # 루트: 브라우저 언어 감지 → /ko 또는 /en 리다이렉트
│   │   ├── ko/
│   │   │   ├── index.astro    # 한국어 랜딩
│   │   │   ├── about.astro
│   │   │   ├── apps/
│   │   │   │   ├── index.astro
│   │   │   │   └── [slug].astro
│   │   │   └── blog/
│   │   │       ├── index.astro
│   │   │       ├── [slug].astro
│   │   │       └── tag/
│   │   │           └── [tag].astro
│   │   └── en/
│   │       ├── index.astro    # English landing
│   │       ├── about.astro
│   │       ├── apps/
│   │       │   ├── index.astro
│   │       │   └── [slug].astro
│   │       └── blog/
│   │           ├── index.astro
│   │           ├── [slug].astro
│   │           └── tag/
│   │               └── [tag].astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── LanguageSwitcher.astro  # 언어 전환 버튼 컴포넌트
│   │   ├── AppCard.astro
│   │   ├── BlogPostCard.astro
│   │   ├── TagList.astro
│   │   └── Pagination.astro
│   └── styles/
│       └── global.css
├── public/
│   ├── images/                # 정적 이미지 (로고, 파비콘 등)
│   └── favicon.svg
├── astro.config.mjs           # i18n 설정 포함
├── package.json
└── tsconfig.json
```

-----

## 8. 배포 파이프라인

1. `main` 브랜치에 push
1. GitHub Actions 자동 트리거
1. `npm run build` → 정적 파일 생성
1. `gh-pages` 브랜치에 빌드 결과물 배포
1. GitHub Pages에서 서빙

-----

## 9. 콘텐츠 추가 워크플로우

### 새 앱 추가 시

1. `src/content/apps/ko/new-app.md` 파일 생성 (한국어)
1. `src/content/apps/en/new-app.md` 파일 생성 (영어) — 동일한 slug 사용
1. frontmatter에 title, status, icon, summary 작성 (각 언어로)
1. 본문에 앱 설명 및 스크린샷 작성
1. push → 자동 빌드 및 배포

### 새 블로그 글 추가 시

1. `src/content/blog/ko/YYYY-MM-DD-title.md` 파일 생성 (한국어)
1. (선택) `src/content/blog/en/YYYY-MM-DD-title.md` 파일 생성 (영어 번역)
1. frontmatter에 title, date, tags, summary 작성
1. 본문 작성 (이미지, 코드 블록 자유롭게 사용)
1. push → 자동 빌드 및 배포

-----

## 10. 추후 확장 고려사항

- 다크 모드
- RSS 피드 (블로그)
- 앱스토어 다운로드 수 / 리뷰 연동
- 검색 기능 (블로그 내 전문 검색)
- SEO 최적화 (Open Graph, sitemap.xml)