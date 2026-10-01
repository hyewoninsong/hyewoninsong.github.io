# Verify the official privacy-policy host and platform before publishing

Date: 2026-10-02

## Failure

A request for a Play privacy-policy URL was answered by creating a public Gist after a search engine returned no results. The existing `hyewoninsong.com` privacy pages and the user's established app-specific hosting convention were not inspected first. Browser inspection later showed the studio policy, a SuperTimetable policy and an app page linking to the general policy. Search indexing absence was not evidence that the official pages did not exist.

## Mechanism and correction

Direct HTTP and search tools returned inaccessible/403 responses for this site, while the authenticated browser could render it. Inspect the site's privacy index, app detail links, source routes and current open PRs before selecting an external host. If a tool cannot retrieve a page, report that retrieval limitation and verify through the available browser instead of inferring absence.

A common studio policy can describe Firebase or iOS features that the Android release does not have. The uploaded SuperPlanner Android 1.0.0 (1) has no Firebase, so its notice must explain current local storage and Android backup rather than copying the iOS policy. Future analytics is a separately labeled plan; an analytics-enabled release requires coordinated web, in-app and Play Data safety updates.

## Prevention

- Use the established official host and app/platform route when suitable.
- Verify the published page and actual current release before asserting a usable URL or collection behavior.
- Keep user-selected future SDK plans separate from verified current collection.
- Link new policies from the shared index and preserve other apps' policy links.
- For iOS disclosures, match the privacy manifest; for Android, match SDK configuration, permissions, backup rules and Play Data safety answers.

The `web-hyewoninsong` skill receives the same host and platform checks in a separate knowledge PR.
