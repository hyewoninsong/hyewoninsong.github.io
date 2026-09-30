# Browser-first timetable invitations
**2026-10-01**

The static `/invite/timetable/` page opens the existing `supertimetable://feature/free-time-request` route on an explicit button tap, supports all eight app locales and provides an App Store link with instructions to return after installation. This works with existing app versions; no deferred deep-link promise or Universal Links entitlement is introduced.

Names use a fragment rather than query strings to stay out of server request logs. Untrusted input is plain text and never supplies a destination. Reject duplicate/unknown fields, control characters and oversized input; clamp display names to the app's 20 grapheme limit.

`ready.json` version 1 belongs to the same GitHub Pages build artifact as HTML/module files. The app checks readiness before enabling HTTPS sharing, retaining its existing scheme when this PR is unmerged/unpublished or the network fails. Publish this complete artifact before using the HTTPS route manually; do not publish readiness alone.

Validation: Node parsing/localization tests, full Astro build. No production deployment was performed.
