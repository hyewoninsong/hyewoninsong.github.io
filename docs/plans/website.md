# Hyewon & Insong 홈페이지 개발계획서

## 개요

|항목   |내용                                                 |
|-----|---------------------------------------------------|
|기반 문서|website-spec.md (홈페이지 기획서)                         |
|기술 스택|Astro + Markdown Content Collections + Tailwind CSS|
|호스팅  |GitHub Pages (GitHub Actions CI/CD)                |
|진행 방식|마일스톤 → 스텝 순차 진행, 각 스텝마다 테스트 및 컨펌 후 다음 스텝 진행        |

## 진행 규칙

1. 각 스텝 완료 시 테스트 가능한 상태로 전달
1. Insong이 로컬에서 확인 후 수정사항 피드백 또는 컨펌
1. 컨펌 시 다음 스텝 진행, 마일스톤 내 모든 스텝 완료 시 마일스톤 컨펌
1. 마일스톤 컨펌 후 다음 마일스톤 착수

-----

## 마일스톤 1: 프로젝트 초기 세팅

> 목표: Astro 프로젝트 생성, 기본 구조 확립, 로컬에서 dev 서버 실행 확인

### Step 1.1 — Astro 프로젝트 생성 및 기본 설정

- Astro 프로젝트 초기화 (`create astro`)
- TypeScript 설정
- Tailwind CSS 통합
- `astro.config.mjs` 기본 설정 (site URL, output: static)
- `.gitignore`, `package.json` 정리

**테스트 체크리스트:**

- [ ] `npm run dev`로 로컬 서버 실행 확인
- [ ] 기본 “Hello World” 페이지가 브라우저에 표시됨
- [ ] Tailwind 클래스 적용 확인 (간단한 스타일링 테스트)

-----

### Step 1.2 — 디렉토리 구조 및 i18n 기반 구축

- `src/i18n/ko.json`, `en.json` UI 문자열 파일 생성
- `src/i18n/utils.ts` 헬퍼 함수 구현 (`getLangFromUrl`, `useTranslations`)
- `src/pages/index.astro` — 루트 리다이렉트 (브라우저 언어 감지 → `/ko` 또는 `/en`)
- `src/pages/ko/index.astro`, `src/pages/en/index.astro` 빈 랜딩 페이지 생성
- Astro i18n 라우팅 설정 (`astro.config.mjs`에 i18n 옵션)

**테스트 체크리스트:**

- [ ] `/` 접속 시 브라우저 언어에 따라 `/ko` 또는 `/en`으로 리다이렉트됨
- [ ] `/ko`, `/en` 각각 접속 가능
- [ ] `useTranslations` 함수로 UI 문자열이 언어별로 정상 출력됨

-----

### Step 1.3 — Content Collections 스키마 정의

- `src/content/config.ts` 작성
- `about` 컬렉션 스키마 (title, description 등)
- `apps` 컬렉션 스키마 (title, slug, status, icon, summary, order)
- `blog` 컬렉션 스키마 (title, date, tags, summary, thumbnail)
- 언어별 폴더 구조 생성 (빈 placeholder md 파일 포함)

**테스트 체크리스트:**

- [ ] `npm run build` 에러 없이 빌드 성공
- [ ] placeholder md 파일이 Content Collections에서 정상 인식됨 (콘솔 로그 또는 간단한 쿼리로 확인)

-----

## 마일스톤 2: 공통 레이아웃 및 네비게이션

> 목표: 헤더, 푸터, 반응형 레이아웃, 언어 전환이 모든 페이지에서 동작

### Step 2.1 — BaseLayout 및 글로벌 스타일

- `src/layouts/BaseLayout.astro` 구현
  - `<html lang>` 속성 동적 설정
  - 공통 `<head>` (메타태그, 폰트, favicon)
  - 폰트 로드: Pretendard (또는 Noto Sans KR) + JetBrains Mono
- `src/styles/global.css` 기본 리셋 및 타이포그래피 설정
- 반응형 브레이크포인트 Tailwind 설정 확인 (모바일/태블릿/PC)

**테스트 체크리스트:**

- [ ] 페이지 `<html lang="ko">` / `<html lang="en">` 정상 적용
- [ ] 한국어 폰트, 코드용 폰트 정상 로드
- [ ] 브라우저 개발자 도구에서 반응형 브레이크포인트 확인

-----

### Step 2.2 — 헤더 (반응형 + 언어 전환)

- `src/components/Header.astro` 구현
  - 로고 + “Hyewon & Insong” 텍스트
  - 네비게이션 탭: 회사 소개 | 앱 | 블로그 (현재 언어 경로 기반)
  - 현재 페이지 활성 탭 표시
- `src/components/LanguageSwitcher.astro` 구현
  - `KO` / `EN` 토글
  - 현재 페이지의 해당 언어 버전 URL로 이동
- 모바일 햄버거 메뉴 구현 (768px 미만에서 전환)

**테스트 체크리스트:**

- [ ] PC: 로고, 3개 탭, 언어 전환 버튼이 가로 배치로 표시됨
- [ ] 모바일: 햄버거 메뉴 탭 시 메뉴 열림/닫힘
- [ ] 언어 전환 클릭 시 `/ko/about` ↔ `/en/about` 등 정상 이동
- [ ] 현재 페이지에 해당하는 탭이 활성(하이라이트) 상태로 표시됨
- [ ] 태블릿 사이즈에서 레이아웃 깨짐 없음

-----

### Step 2.3 — 푸터

- `src/components/Footer.astro` 구현
  - 회사명, 저작권 표시 (연도 자동)
  - 연락처 이메일 placeholder
  - SNS / GitHub 링크 placeholder
- BaseLayout에 Header + Footer 통합

**테스트 체크리스트:**

- [ ] 모든 페이지 하단에 푸터 표시
- [ ] 모바일/태블릿/PC 모두 레이아웃 정상
- [ ] 링크 placeholder 클릭 시 동작 확인 (또는 `#`으로 비활성 처리)

-----

## 마일스톤 3: 회사 소개 페이지

> 목표: Markdown 기반 회사 소개 페이지가 양쪽 언어로 렌더링됨

### Step 3.1 — About 페이지 구현 및 콘텐츠 작성

- `src/pages/ko/about.astro`, `src/pages/en/about.astro` 구현
  - Content Collections에서 해당 언어의 `about` md를 가져와 렌더링
- `src/content/about/ko.md` 한국어 초안 작성
  - 회사 소개 인사말
  - 대한민국 소재 모바일 앱 개발사
  - 미션/비전
  - 이미지 placeholder
- `src/content/about/en.md` 영어 초안 작성
- MarkdownLayout 또는 about 전용 레이아웃 적용
  - 히어로 섹션
  - 이미지 + 텍스트 2컬럼 (PC) / 1컬럼 (모바일)

**테스트 체크리스트:**

- [ ] `/ko/about` 접속 시 한국어 회사 소개 표시
- [ ] `/en/about` 접속 시 영어 회사 소개 표시
- [ ] md 파일 내 이미지 문법(`![alt](path)`)으로 삽입한 이미지가 렌더링됨
- [ ] PC에서 2컬럼, 모바일에서 1컬럼 레이아웃 정상
- [ ] 헤더에서 “회사 소개” 탭 활성 상태

-----

## 마일스톤 4: 앱 소개 페이지

> 목표: 앱 목록 카드 그리드 + 앱 상세 페이지가 md 기반으로 동작

### Step 4.1 — 앱 목록 페이지

- `src/pages/ko/apps/index.astro`, `src/pages/en/apps/index.astro` 구현
- `src/components/AppCard.astro` 구현
  - 앱 아이콘, 이름, 한 줄 소개, 상태 뱃지 (출시/개발중)
- Content Collections에서 해당 언어의 apps를 `order` 기준 정렬하여 카드 그리드 표시
- 반응형: PC 2~3열 / 태블릿 2열 / 모바일 1열
- 카드 클릭 시 상세 페이지로 이동

**테스트 체크리스트:**

- [ ] `/ko/apps` — 한국어로 앱 카드 목록 표시 (시간표: 출시, FontBox: 개발중)
- [ ] `/en/apps` — 영어로 앱 카드 목록 표시
- [ ] 상태 뱃지가 언어에 맞게 표시 (출시/Released, 개발중/In Development)
- [ ] 카드 그리드 반응형 정상 동작
- [ ] 카드 클릭 시 해당 앱 상세 페이지로 이동

-----

### Step 4.2 — 앱 상세 페이지

- `src/pages/ko/apps/[slug].astro`, `src/pages/en/apps/[slug].astro` 구현
- 상단: 앱 아이콘 + 이름 + 상태 뱃지 + 앱스토어 링크 placeholder
- 본문: md 콘텐츠 렌더링
- 초기 콘텐츠 작성
  - `src/content/apps/ko/timetable.md` — 시간표 앱 한국어 소개
  - `src/content/apps/ko/fontbox.md` — FontBox 한국어 소개
  - `src/content/apps/en/timetable.md` — 영어
  - `src/content/apps/en/fontbox.md` — 영어

**테스트 체크리스트:**

- [ ] `/ko/apps/timetable` — 시간표 앱 한국어 상세 페이지 정상 표시
- [ ] `/en/apps/timetable` — 영어 상세 페이지 정상 표시
- [ ] `/ko/apps/fontbox` — FontBox 한국어 상세 페이지 정상 표시
- [ ] md 내 이미지 삽입 정상 렌더링
- [ ] 앱스토어 링크 영역 표시 (출시 앱만)
- [ ] 존재하지 않는 slug 접속 시 404 처리

-----

### Step 4.3 — 앱 추가 워크플로우 검증

- 테스트용 더미 앱 md 파일 1개 추가
- 빌드 후 목록 및 상세 페이지에 자동 반영되는지 확인
- 검증 후 더미 파일 제거

**테스트 체크리스트:**

- [ ] 새 md 파일 추가만으로 앱 목록에 카드가 추가됨
- [ ] 새 앱의 상세 페이지가 자동 생성됨
- [ ] 삭제 시 목록에서 제거됨

-----

## 마일스톤 5: 개발 블로그

> 목표: 블로그 글 목록(날짜순), 태그 필터, 상세 페이지, 페이지네이션 동작

### Step 5.1 — 블로그 목록 페이지

- `src/pages/ko/blog/index.astro`, `src/pages/en/blog/index.astro` 구현
- `src/components/BlogPostCard.astro` 구현
  - 제목 + 작성일 + 태그 + 요약 + 썸네일(선택)
- Content Collections에서 해당 언어의 blog를 날짜 내림차순 정렬
- 해당 언어 글만 표시
- `src/components/TagList.astro` — 상단 태그 필터 UI (전체 + 각 태그)
- 초기 블로그 글 2~3개 작성 (한국어, 영어 1개씩이라도)

**테스트 체크리스트:**

- [ ] `/ko/blog` — 한국어 블로그 글 목록이 최신순으로 표시
- [ ] `/en/blog` — 영어 글만 표시 (영어 글이 없으면 빈 상태 메시지)
- [ ] 태그 목록이 상단에 표시됨
- [ ] 태그 클릭 시 해당 태그 필터 페이지로 이동
- [ ] 모바일/태블릿/PC 레이아웃 정상

-----

### Step 5.2 — 블로그 상세 페이지

- `src/pages/ko/blog/[slug].astro`, `src/pages/en/blog/[slug].astro` 구현
- `src/layouts/BlogPost.astro` 레이아웃 적용
  - 상단: 제목, 작성일, 태그
  - 본문: md 렌더링 (코드 하이라이팅 포함)
  - 이미지 삽입 지원
  - 하단: 이전 글 / 다음 글 네비게이션
- 코드 하이라이팅 설정 (Astro 내장 Shiki 또는 Prism)

**테스트 체크리스트:**

- [ ] 블로그 글 상세 페이지 정상 렌더링
- [ ] 코드 블록에 구문 하이라이팅 적용됨
- [ ] md 내 이미지 정상 표시
- [ ] 이전 글 / 다음 글 링크 동작
- [ ] 태그 클릭 시 태그 필터 페이지로 이동

-----

### Step 5.3 — 태그 필터 및 페이지네이션

- `src/pages/ko/blog/tag/[tag].astro`, `src/pages/en/blog/tag/[tag].astro` 구현
  - 해당 태그 글만 필터링, 동일한 목록 레이아웃 사용
  - 상단에 현재 태그 표시 + “전체 보기” 링크
- `src/components/Pagination.astro` 구현
  - 블로그 목록 및 태그 필터 페이지에 적용
  - 페이지당 글 수 설정 (예: 10개)

**테스트 체크리스트:**

- [ ] `/ko/blog/tag/시간표` — 시간표 태그 글만 표시
- [ ] `/en/blog/tag/SwiftUI` — 해당 태그 영어 글만 표시
- [ ] 현재 태그 하이라이트 + “전체 보기” 링크 동작
- [ ] 글이 페이지당 설정 수를 초과하면 페이지네이션 표시
- [ ] 페이지 이동 정상 동작

-----

## 마일스톤 6: 디자인 다듬기 및 SEO

> 목표: 전체 디자인 통일, SEO 기본 설정, 최종 비주얼 완성

### Step 6.1 — 디자인 통일 및 다듬기

- 컬러 팔레트 적용 (Primary, Secondary, 배경, 텍스트)
- 전 페이지 타이포그래피 일관성 점검
- 카드, 뱃지, 버튼 등 컴포넌트 스타일 통일
- 히어로 섹션 디자인 완성 (회사 소개 페이지)
- 모바일 / 태블릿 / PC 전체 반응형 최종 점검

**테스트 체크리스트:**

- [ ] 전 페이지 컬러/폰트 일관됨
- [ ] 모바일에서 모든 페이지 스크롤, 터치, 레이아웃 정상
- [ ] 태블릿에서 그리드, 네비게이션 레이아웃 정상
- [ ] PC 와이드 스크린에서 콘텐츠 최대 너비 제한 적용

-----

### Step 6.2 — SEO 및 메타 설정

- 각 페이지 `<title>`, `<meta description>` 동적 설정
- Open Graph 태그 (og:title, og:description, og:image)
- `sitemap.xml` 자동 생성 (Astro 내장 또는 플러그인)
- `robots.txt` 설정
- favicon 설정

**테스트 체크리스트:**

- [ ] 각 페이지 `<title>`이 페이지별로 다르게 설정됨
- [ ] SNS 공유 시 미리보기 (Open Graph) 정상 표시 (테스트 도구 사용)
- [ ] `/sitemap.xml` 접속 시 사이트맵 표시
- [ ] `/robots.txt` 정상 접근 가능

-----

## 마일스톤 7: GitHub Pages 배포

> 목표: CI/CD 파이프라인 구축, 실제 GitHub Pages에서 사이트 정상 서빙

### Step 7.1 — GitHub Actions 워크플로우 설정

- `.github/workflows/deploy.yml` 작성
  - main 브랜치 push 시 자동 트리거
  - `npm ci` → `npm run build` → GitHub Pages 배포
- `astro.config.mjs`에 `site`, `base` 설정 (GitHub Pages URL 맞춤)
- GitHub 리포지토리 Pages 설정 (GitHub Actions 소스 선택)

**테스트 체크리스트:**

- [ ] main 브랜치에 push 시 GitHub Actions 워크플로우 자동 실행
- [ ] 빌드 성공 로그 확인
- [ ] GitHub Pages URL로 사이트 접속 가능

-----

### Step 7.2 — 배포 후 통합 테스트

- 실제 배포된 사이트에서 전체 기능 점검
- 모바일 실기기 테스트 (iPhone, Android)
- 태블릿 실기기 테스트 (iPad)
- 언어 전환, 네비게이션, 블로그, 앱 소개 전체 확인
- 404 페이지 처리 확인
- 성능 점검 (Lighthouse)

**테스트 체크리스트:**

- [ ] 루트 URL 리다이렉트 정상 동작
- [ ] 한국어/영어 모든 페이지 접속 가능
- [ ] 회사 소개, 앱 목록/상세, 블로그 목록/상세/태그 모두 정상
- [ ] 모바일 실기기에서 햄버거 메뉴, 스크롤, 레이아웃 정상
- [ ] 태블릿 실기기에서 레이아웃 정상
- [ ] 존재하지 않는 URL 접속 시 404 페이지 표시
- [ ] Lighthouse 성능 점수 확인 (목표: 90+)

-----

## 마일스톤 8: 콘텐츠 최종 정리 및 런칭

> 목표: 실제 콘텐츠 교체, 최종 검수, 공개

### Step 8.1 — 콘텐츠 교체 및 최종 검수

- placeholder 텍스트/이미지를 실제 콘텐츠로 교체
  - 회사 소개 최종본
  - 시간표 앱, FontBox 앱 소개 최종본
  - 블로그 초기 글 최종본
- 로고, 파비콘, OG 이미지 등 실제 에셋 적용
- 푸터 연락처, SNS 링크 실제 URL 적용
- 전체 오탈자 및 링크 점검

**테스트 체크리스트:**

- [ ] 모든 placeholder가 실제 콘텐츠로 교체됨
- [ ] 이미지 깨짐 없음
- [ ] 모든 내부/외부 링크 정상 동작
- [ ] 한국어/영어 콘텐츠 최종 검수 완료
- [ ] 사이트 공개 준비 완료 ✅

-----

## 전체 마일스톤 진행 현황

|마일스톤|내용             |상태  |
|----|---------------|----|
|M1  |프로젝트 초기 세팅     |⬜ 대기|
|M2  |공통 레이아웃 및 네비게이션|⬜ 대기|
|M3  |회사 소개 페이지      |⬜ 대기|
|M4  |앱 소개 페이지       |⬜ 대기|
|M5  |개발 블로그         |⬜ 대기|
|M6  |디자인 다듬기 및 SEO  |⬜ 대기|
|M7  |GitHub Pages 배포|⬜ 대기|
|M8  |콘텐츠 최종 정리 및 런칭 |⬜ 대기|