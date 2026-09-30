# Timetable request route: deployment and checks

## Deployment order

1. Merge the website PR containing `src/pages/timetable/request.astro` into `main` and let the existing GitHub Pages workflow deploy it.
2. Verify `https://hyewoninsong.com/timetable/request/?from=민지` returns the request page. Check the name, the app button and the App Store fallback on an iPhone, including a messenger's embedded browser and Safari.
3. Merge the corresponding Timetable HTTPS-request change and distribute its app build after the website route is live. Older app builds continue to share their previous request links.

A PR build generates `dist/timetable/request/index.html`; this does not confirm the public route is deployed. A hidden-feature app build (`HIDE_FREE_TIME`) still opens the app without exposing the request flow. The page asks people to update if sharing is unavailable in their build.

## Verification recipe

- The repository has no `check` script; run `npm run build`, the same command used by `.github/workflows/deploy.yml`.
- If borrowing the primary checkout's `node_modules`, serialize builds with other content/render checks as described in `astro-shared-build-cache-pitfall.md`.
- Serve `dist` locally and inspect `/timetable/request/` at 320px and wider. No horizontal scrolling; the app action and App Store fallback must remain visible and usable.
- Browser languages: en-US, ko-KR, ja-JP, zh-CN, zh-TW, es-ES, fr-FR, pt-PT (Portuguese falls back to pt-BR).
- Names: blank/whitespace, a newline, `& + ? #`, an HTML-shaped name, more than 20 letters, combining marks and joined family emoji. The name must remain plain text and decode unchanged from the app button's query after cleaning/truncation.
- Disable JavaScript: the English explanation and both app/installation links must remain usable, without the optional requester name.

October 1 verification: the Astro build generated 174 pages. Headless Chrome with Playwright passed all eight language cases at 320px, safe-text names, query encoding, 20-grapheme names, blank names, exact app/store destinations, zero script errors and the no-JavaScript fallback. The Korean phone-width screenshot was visually inspected. Real messenger/iOS launch behavior remains a release check; a desktop browser probe cannot confirm it.

## Name length source

The page uses `Intl.Segmenter` with `granularity: 'grapheme'` to match Swift's displayed character limit. The standards definition is [ECMA-402 Segmenter](https://tc39.es/ecma402/#sec-intl.segmenter). For older browsers without Segmenter the page still opens using a Unicode code-point fallback; the app applies its own final character limit.
