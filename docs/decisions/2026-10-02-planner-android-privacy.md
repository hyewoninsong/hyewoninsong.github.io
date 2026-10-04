# SuperPlanner Android privacy policy scope

Date: 2026-10-02

## Decision

Keep SuperPlanner Android privacy notices at `/ko/apps/planner/android/privacy/` and `/en/apps/planner/android/privacy/`, separate from iOS and the studio-wide Firebase policy. Link both pages from their language's privacy index. These routes follow the MusicNote Android convention introduced in PR #235 and preserve its index links.

## Release contract

The uploaded SuperPlanner Android 1.0.0 (version code 1) has no Firebase or developer-operated network collection. Document its local plans/settings, Android cloud backup/device transfer, JSON export/import, reminder permissions, deletion limits and privacy contact accurately. Planned Firebase Analytics is explicitly identified as future functionality. Do not copy the iOS policy's IDFA/ATT language, Crashlytics claims or fixed retention values into the Android policy. Before an analytics-enabled release, verify SDK/configuration and update the web notice, in-app text and Play Data safety answers together.

## Consequences

The app-specific Android policy takes precedence over the general policy for this release. Stable URLs remain available across later policy revisions. Future analytics work must verify advertising-ID collection, consent/collection controls, events, identifiers, retention and processing destinations before changing the current-release disclosure. This page change does not add Firebase to the Android app or modify the already-uploaded binary.

## References

- Android backup: https://developer.android.com/identity/data/autobackup
- Firebase Analytics collection configuration: https://firebase.google.com/docs/analytics/android/configure-data-collection
- Google Play user data requirements: https://support.google.com/googleplay/android-developer/answer/10144311

## Related pitfall

`docs/references/privacy-policy-host-and-platform-pitfall.md` records the mistaken external-host selection and release/platform disclosure checks. The website specification now distinguishes iOS privacy-manifest requirements from Android release disclosures.
