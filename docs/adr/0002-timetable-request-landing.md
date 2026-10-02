# A public landing page for timetable requests
**2026-10-01** · PR #

A timetable request needs a link that a messenger recognizes and an explanation for friends who do not have the app yet. Add the stable HTTPS route `/timetable/request/`; the app supplies only the optional `from` query parameter.

The page offers a deliberate tap to `supertimetable://feature/free-time-request?from=…`, plus the App Store link. It never automatically redirects. This leaves a usable installation path and avoids guessing whether an app launch succeeded. A Universal Link with association files was deferred; this change is a static explanation and app-launch page.

Localize the page in the app's eight locales using browser language, with English as the static and unsupported-language fallback. Chinese script/region distinguishes Simplified and Traditional; Portuguese variants use Brazilian Portuguese. Korean and English app-page links remain the existing marketing routes.

Treat the query name as external text. Remove newline characters, limit it to 20 grapheme clusters to match Swift `Character`, set it with `textContent`, and encode it only through `URL.searchParams`. Names are not part of a URL path or HTML source. `no-referrer` keeps the current query out of outbound requests; metadata contains no personal name. No analytics or new third-party requests are added.

Use the site's existing text, border and primary-action tokens. A plain responsive column presents the request, privacy explanation, app action and installation fallback at phone widths. The page is marked `noindex` because it is a handoff route.

Deploy this website change before distributing the app build that starts sharing HTTPS requests. See `docs/references/timetable-request-deployment.md` for the order and acceptance checks.
