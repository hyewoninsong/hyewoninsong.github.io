---
title: "Adding a paid tier to the timetable app — and what we chose not to lock"
date: 2026-10-01T02:08:33+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "One purchase unlocks multiple timetables, alarms, custom colors, and calendar export. Editing and sharing stay free, and everyone who already installed the app gets it all for free."
---

The timetable app now has a one-time Premium unlock. Making, editing, and sharing a timetable stays free. Only a second timetable, alarms, and self-made colors sit behind the purchase.

## A locked feature turns into the paywall when you tap it

Locked controls aren't grayed out (calendar export is the one exception, see 2026-09-30 below). They stay where they are and swap their icon for a lock: the alert row shows "None" with a lock, and the same goes for "New Timetable" and the `+` in the style picker.

![The alert row shows None and a lock instead of a menu](/blog/timetable-premium/alarm-locked.png)

Tapping one opens the paywall, and **the feature you just tapped is listed first.** The paywall never shows up on its own. It doesn't appear on first launch or after the tutorial.

![Paywall listing three benefits with a one-time purchase note](/blog/timetable-premium/paywall.png)

| Feature | Free | Premium |
|---|---|---|
| Timetables | 1 | Many (add, duplicate, import) |
| Alarms | — | Weekly alarm before each class |
| Colors | 20-color palette | Custom colors |
| Calendar export (from 2026-09-30) | Picking the range and calendar | Exporting to Apple Calendar or .ics |
| Editing, sharing, printing, widgets | All | All |

## Why these three, and why not a 7-day trial

Students start a new timetable every semester, which makes that the most natural moment to pay. Alarms help every single week. Sharing stays free, and without a watermark, because a timetable image sent to a friend is the app's best ad. Widgets stay free because they're what keeps people using the app day to day.

We considered a full 7-day trial followed by a paywall. It doesn't fit this app's rhythm. The need for a second timetable arrives months later, and a weekly alarm rings only once per class in 7 days. The rule we settled on: **gates only block creating new things.** Existing timetables and alarms are never locked or deleted, even after a refund. The one exception is custom colors: after a refund the whole Custom tab dims and can't be picked from, and events using a custom color switch to the nearest basic color (a rule changed on 2026-09-29, below).

## Existing users keep everything

`AppTransaction` tells us which build a user first installed. Anyone who installed before the paid version gets Premium for good. There's no receipt server. StoreKit 2 verifies Apple-signed transactions on the device, which is enough for a single product with no cross-platform purchases.

## What bit us

- **`originalAppVersion` is a build number, not a version.** On iOS it's `CFBundleVersion`. We read the cutoff (build 238) straight from App Store Connect, since our build numbers auto-increment on every TestFlight upload. In the sandbox the value is "1.0", so we only apply the cutoff to real App Store installs.
- **Capture mode was calling StoreKit.** A "Sign in to Apple Account" alert covered the simulator and stole taps from the UI tests. It would have ruined the automated store screenshots too. Capture and UI-test modes now skip StoreKit entirely.
- **`xcodebuild test` doesn't inject the scheme's local StoreKit configuration.** The simulator log showed `storekitd` going to the real sandbox server and getting an empty product list. To see a priced paywall locally, run the app from Xcode.

## Where it stands

The code is ready. What's left is creating the product and setting the price in App Store Connect. The first in-app purchase goes through review together with a new app version.

## 2026-09-28 — The app goes free, and we say thank you

As a paid download, too few people installed the app. Ranking in App Store search takes installs and ratings, and the price tag was blocking both. From 1.1.0 the app itself is free, and Premium is the only thing you pay for.

We looked at tightening the gates again and still passed on "everything for 7 days, then pay". Day 8, when your own timetable stops opening, is exactly when one-star reviews get written. The free tier stays as it is.

What was missing was the ask itself: **the app had never requested a review.** Now, once you've opened the app on three different days and have at least five events, opening it bursts a little confetti and shows a thank-you card. 2.5 seconds later the system rating sheet (`requestReview`) appears. At most once per version, and never within 90 days of the last time.

![An opaque white card with a heart, "Thanks for sticking with us", and a single button](/blog/timetable-premium/review-card-solid.png)

- **Not right after adding an event.** The edit sheet opens at that moment and would cover the card. On launch there's no sheet.
- **No "Do you like the app?" filter.** Sending only happy users to the rating sheet is a custom review prompt, which guideline 5.6.1 forbids. The card only says thanks.
- **Not the rating sheet alone.** iOS shows it at most three times a year and never tells the app whether it appeared, so the card has to make sense on its own.

The first version used a glass card. Over a grid of bright class blocks, the red behind it bled through and the body text vanished, so the card now has an opaque background and a shadow.

![The same card in glass: the red block behind it bleeds through](/blog/timetable-premium/review-card-glass.png)

Two testing notes. UI tests can't dismiss the system rating sheet (it's a remote view), so captures use a debug-only flag that skips it. And "days opened" accumulates on test simulators too, so the feature is off in capture, UI-test, and unit-test runs.

## 2026-09-29 — Custom colors now fall back to the nearest basic color

We reversed the "events keep their colors" rule above. The Custom tab was locked, but the "In use" strip at the top of the style picker wasn't, since it only shows styles the timetable already uses. That let a custom color, once it got in, spread to other events through the strip. Now any custom color left with a free user becomes **the closest of the 20 basic colors**. Imported timetables are converted before they're added, and saved timetables are converted once the user is confirmed free.

![Twelve custom colors and the basic color each one becomes: dark colors go to the bold row, pale ones to the mist row](/blog/timetable-premium/color-mapping-examples.png)

**Only after "confirmed free".** The conversion can't be undone, so the app doesn't act on its cached "purchased" flag. StoreKit has to report no entitlement, and the `AppTransaction` pre-paywall check has to reach a verdict. If the device is offline, nothing changes. This protects two people: an existing user on the first launch after the update, before the check has come back, and a buyer who opens the app in airplane mode. A refund arriving through `Transaction.updates` triggers the conversion right away. We decided against restoring the original colors when someone buys again. Refund-then-rebuy is rare, and supporting it would have meant another field in the save file.

**"Nearest" took two fixes.** Plain OKLab distance turned dark green `#2e7d32` gray and black blue. The basic palette has only two lightness layers, 10 bold and 10 very pale colors, so lightness differences dominated the distance. Counting the lightness difference at half weight fixed that.

![Original, full lightness weight, half weight: dark green goes from gray to green, black from blue to gray](/blog/timetable-premium/color-lightness-fix.png)

Three colors still landed on gray: `#1b5e20`, `#004d40`, and `#9fa8da`. They're clearly colored to the eye, so a second rule now drops the gray candidates whenever the source chroma is above 0.06.

![Original, first-rule result (gray), with grays excluded: green, mint, and sky](/blog/timetable-premium/color-gray-fix.png)

The 0.06 threshold is set for brown. `#795548` sits at 0.053 and still goes to gray, which reads better than orange since there's no brown in the palette. Burnt orange going to red and mid-light pastels going to the bold row were left alone, because any further change to the formula moves other borderline colors. One new constraint: changing the basic palette values now repaints free users' old basic-colored events too.

## 2026-09-30 — Calendar export moves to Premium, and this time the buttons are grayed out

Calendar export shipped free two days ago; it's now part of Premium. Someone putting a whole semester into their calendar has already decided to stick with the app, which is exactly the moment the gates above aim for.

The shape differs from the other gates. The sheet still opens, and you can still pick the date range and the target calendar. Only the two bottom buttons, "Add to Apple Calendar" and "Share as .ics", are grayed out. It's the first exception to the "don't gray out" rule: picking a range and calendar is a preview of what you'd be buying, and only the final tap needs to be held back. Buy, and both buttons come alive in the same sheet. Removing an earlier export from your calendar stays unlocked, since we only block creating new things.

### We moved the unlock button once

The first version put an "Unlock Premium" capsule right above the two disabled buttons.

![First layout: an unlock capsule of the same shape wedged above the two disabled buttons](/blog/timetable-premium/calendar-export-unlock-between-ctas.png)

Three capsules of the same shape, with the strongest one being the purchase, made the sheet read like a paywall. The explanation came after the button, and you only learned the feature was locked after filling everything in. So the unlock moved to the top, as a single row in a "Premium" card, the same shape as the Premium row in Settings, with the reason underneath. You know it's locked the moment the sheet opens, and the bottom looks the same before and after buying.

![Current layout: an unlock row at the top, the two bottom buttons grayed out](/blog/timetable-premium/calendar-export-unlock-top.png)

The unlock row opens the paywall with calendar export listed first.

![Paywall opened from the calendar sheet, with calendar export first](/blog/timetable-premium/paywall-calendar-first.png)

## 2026-10-01 — Keep starting and sharing easy; charge for repeated work

Three implementation proposals now add browser invitations, photo import, and timetable candidate comparison. They are open for review, not released store features, and the invitation page has not been deployed yet.

### An invitation should make sense before installation

Finding a free time together starts with getting each other's timetables. An app-only link gives someone without the app little context. The new browser page explains the request and offers an explicit Open SuperTimetable button. Someone who needs to install follows the App Store link, then returns to the invitation.

We kept this route free. A sharing feature depends on both people completing it, so charging the recipient would work against the reason to build it. We also chose clear return instructions over promising automatic invitation recovery after installation. The requester's name stays in a URL fragment, outside HTTP request logs; timetable data is not uploaded to the page.

The app checks readiness published with the complete website before generating HTTPS invitations. If the page is unpublished or the network fails, the existing app link and download instructions remain available. Finished code should not create an invitation that leads to a missing page.

### A photo produces a draft, not a finished timetable

Photo import reads text on the device and proposes days and times when it can identify the axes. There is no upload service or new account.

Immediate saving lost to explicit review. A text box is not a class block's boundary, and recognizing a title does not reveal its duration. When duration is uncertain, the draft explains its initial one-hour estimate. Each row must be checked against the original and marked reviewed before saving. Missing axes do not become invented Monday-morning classes.

The first successful save is free; cancellation and failed recognition do not consume it. Further imports belong to the existing Premium purchase. This trial is local to the device, not a synchronized account credit.

The one-timetable free limit still applies. A new user's default empty timetable already occupies that slot, so they can explicitly choose it as the import destination. A timetable with events cannot be overwritten, and emptiness is checked again immediately before saving. A free first import needs a usable place to put the result.

### Compare your own candidates before automating course combinations

Premium compares two to ten timetables that the user has already created. It does not fetch university course catalogs or generate every possible section combination. Helping someone choose among their own options is the smaller, useful step we can deliver first.

The metrics are days with events, gaps between each day's first and last event, and events starting before noon. Overlaps are counted once, and weekends count too. Calling the first metric “days with events” keeps it useful for work and other plans as well as school.

There is no combined score declaring one timetable best for everyone. Users choose one ranking criterion; ties share a rank. Comparing never edits or duplicates the source timetables.

These features use the existing one-time Premium product. The product hypothesis is that easy sharing brings people in, while avoiding repeated input and comparison work gives them a reason to pay. Whether it improves installs or purchases is still unproven. Review and broader photo testing remain before release.

## History

- 2026-09-27 — one-time Premium, what stays free, existing users unlocked
- 2026-09-28 — app goes free, 7-day trial reconsidered and shelved, thank-you card + review request
- 2026-09-29 — custom colors fall back to the nearest basic color once confirmed free; mapping fixed twice
- 2026-09-30 — calendar export moves to Premium; disabled-button exception; unlock moved to a top card
- 2026-10-01 — browser sharing stays free, first saved photo draft is free, own-candidate comparison joins existing Premium; proposals under review
