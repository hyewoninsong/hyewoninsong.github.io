# Android installation from timetable invitations

Date: 2026-10-01
Status: Accepted
Supersedes: App Store-only installation rule in 2026-10-01-timetable-invite.md

## Context

The Android app now shares and receives the same browser-first invitations as iOS. Android recipients without the app previously reached an Apple download page.

## Decision

Keep the existing invitation fragment, app-open scheme and return-after-install instructions. Select Google Play for Android user agents; preserve App Store for iOS and the existing desktop fallback. Without JavaScript, explicitly offer both stores.

## Alternatives considered

Separate platform invitation URLs would split a shared contract and make mixed-platform groups harder to invite. Two primary install buttons would add a choice most phone recipients do not need.

## Consequences

The existing readiness document remains version 1 because invitation parsing and app-open contracts are unchanged. The change activates after this site PR is merged and its regular GitHub Pages build publishes. No production deployment was performed in this task.
