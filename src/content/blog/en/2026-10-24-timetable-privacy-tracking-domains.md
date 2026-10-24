---
title: "We fixed the rule the rejection email stated, and got the same email again"
date: 2026-10-24T23:30:00+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "If NSPrivacyTracking is true, the privacy manifest needs at least one tracking domain. The email only states the reverse direction. The build that deleted the empty array was rejected with identical wording, and that identical wording was the clue."
---

Timetable 1.2.1 went Invalid Binary the moment we submitted it for review. App Store Connect shows one line — rejected — and the reason comes by email: ITMS-91064, invalid tracking information in the privacy manifest. The next build, with the fix, was rejected too. The second email was identical to the first, character for character.

## The email states one direction

`PrivacyInfo.xcprivacy` has two tracking keys. `NSPrivacyTracking` is a boolean: does the app track in the App Tracking Transparency sense. `NSPrivacyTrackingDomains` lists the domains used for tracking; iOS blocks network requests to them when the user declines ATT.

The email said:

> NSPrivacyTracking must be true if NSPrivacyTrackingDomains isn't empty.

Two days earlier we had added ads and flipped `NSPrivacyTracking` to `true`. Next to it sat an `<array/>` left over from 1.2.0. Read literally, that is not a violation. An Apple DTS answer on the forums said an empty array still counts as "present" and to delete the key. We did, kept `true`, and submitted build 333.

Same email.

## The check runs both ways

| Build | `NSPrivacyTracking` | `NSPrivacyTrackingDomains` | Result |
|---|---|---|---|
| 1.2.0 (shipped) | `false` | `<array/>` | passed |
| 332 | `true` | `<array/>` | ITMS-91064 |
| 333 | `true` | key removed | ITMS-91064, same text |

The only thing that changed from the shipped version is `true`. The validator treats the two keys as a pair: `true` requires at least one domain, and a domain requires `true`. The email spells out only the second direction, and emits the same sentence for the first.

Re-reading the DTS thread, that app had the same ad SDK stack, and the combination that passed was `false` with no key. Keeping `true` and deleting the key was a combination the thread never endorsed.

## Filling in domains was not an option

To keep `true` we would have to list domains. Listing the ad SDK's serving hosts blocks ad requests for every user who declines ATT — non-personalized ads included. Google lists no domains in its own SDK manifest for exactly that reason.

So we opened the SDK's manifest. It has no `NSPrivacyTracking` key at all. Of its seven collected data types, only Device ID is marked as used for tracking; advertising data, product interaction and coarse location are not. Our app manifest had copied all four as tracking and stacked `true` on top — declaring more than the SDK declares about itself.

We set the app's `NSPrivacyTracking` back to `false`, the value 1.2.0 shipped with, and matched the per-type tracking flags to the SDK's manifest. The App Store Connect label "Does this app use data to track you?" stays **Yes**. That question is about the whole app including its SDKs; the manifest key is validated as "these domains may be blocked". Same word, different question.

## What could have caught it

Upload does not run this check — both builds processed as VALID on TestFlight and failed only on the submit button. Our deploy lane already re-read the archived manifests, but the guard written after the first rejection checked only what the email said: empty array, or domains without `true`. It now has a third line: `true` without domains stops the lane. The build 332 archive stops on the first line, build 333 on the third, and the new manifest passes.

Two earlier moments would have caught it. When the ads PR flipped `true`, opening the SDK's manifest would have shown there was nothing to add. And when a changed fix is rejected again, compare the two emails: identical wording means the rule was misread, not the value. That comparison is now a step in the deploy procedure.

## Where it stands

1.2.2 goes back for review as build 334, together with the "Remove Ads" in-app purchase that has been waiting on the same version.
