---
title: "Ten merged PRs that never reached the app"
date: 2026-10-03T21:38:39+09:00
app: "timetable"
tags: ["devlog"]
summary: "A stacked PR merged after its base was squash-merged lands in a dead feature branch, not main. GitHub still shows it as MERGED."
---

A user reported that the switch for showing a lunch slot on the period axis was missing. We had built it twice, and both pull requests said `MERGED`.

## MERGED does not mean "in main"

Neither PR targeted main. Each was stacked on another feature branch:

1. PR A is squash-merged into main. Main gets one new commit; the branch `feat/a` stays around.
2. Seconds later PR B — based on `feat/a` — is merged. It goes into `feat/a`.
3. GitHub labels B `MERGED`. Main never sees it.

The second loss was the PR that restored the first one, merged 14 seconds after its base.

## Eight more were missing

Listing every PR merged into a non-main base turned up ten. Besides the lunch switch, eight features — four in the free-time finder, four in period settings — were absent from main. Because squash merges drop the original commits, an ancestry check alone can't tell; we searched main for each PR's new type and function names, and all came back empty.

The lunch switch is back on main. The other eight stay out for now: both screens have been redesigned since, so they would need a fresh design rather than a cherry-pick.

## A note in the docs didn't stop it

After the first loss we wrote "always base on main." The restore PR broke that rule anyway. So this time we changed settings instead:

- **Automatically delete head branches** is on. When A's branch is deleted on merge, GitHub retargets B to main.
- Creating a stacked PR now requires checking that setting first.
- When a fixed feature is reported missing again, we also list PRs merged into non-main bases.

## History

- 2026-10-03 — lunch switch restored again; eight lost PRs found and deferred; branch auto-delete enabled
