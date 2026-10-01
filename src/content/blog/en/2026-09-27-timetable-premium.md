---
title: "Adding a paid tier to the timetable app — and what we chose not to lock"
date: 2026-10-01T23:56:40+09:00
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

A text box is not a class block's boundary, and recognizing a title does not reveal its duration. The initial one-hour estimate and mandatory row-review list were replaced in a follow-up proposal the same day. Valid events now create a timetable that opens directly for editing. Uncertain positions or end times in clock-based imports are omitted with a notice. Period-only tables use the app's period settings for storage; those clock times were not recovered from the image.

The first successful save is free; cancellation and failed recognition do not consume it. Further imports belong to the existing Premium purchase. This trial is local to the device, not a synchronized account credit.

The one-timetable free limit still applies. A new user's default empty timetable already occupies that slot, so they can explicitly choose it as the import destination. A timetable with events cannot be overwritten, and emptiness is checked again immediately before saving. A free first import needs a usable place to put the result.

### Compare your own candidates before automating course combinations

Premium compares two to ten timetables that the user has already created. It does not fetch university course catalogs or generate every possible section combination. Helping someone choose among their own options is the smaller, useful step we can deliver first.

The metrics are days with events, gaps between each day's first and last event, and events starting before noon. Overlaps are counted once, and weekends count too. Calling the first metric “days with events” keeps it useful for work and other plans as well as school.

There is no combined score declaring one timetable best for everyone. Users choose one ranking criterion; ties share a rank. Comparing never edits or duplicates the source timetables.

These features use the existing one-time Premium product. The product hypothesis is that easy sharing brings people in, while avoiding repeated input and comparison work gives them a reason to pay. Whether it improves installs or purchases is still unproven. Review and broader photo testing remain before release.

## 2026-10-01 — Create the timetable, then fix it in the grid

The photo-import proposal now opens the created timetable directly instead of requiring approval of every row in a separate list. Days and event lengths are easier to check in the grid where they will be used. This is implementation under review, not an announced store release.

### The large model is an optional download

Settings now offers a pinned, roughly 3.1GB Qwen3-VL 4B 4-bit model bundle. Once ready, it reads photos on the device. Network access downloads public model files; photos and recognized content are not sent to an external AI service.

![Settings shows an optional photo-recognition model download with its 3.1GB size](/blog/timetable-premium/local-photo-model-download.png)

Bundling it with the app would make everyone download it, including people who never import a photo. Automatic downloading lost for the same reason. Users choose to start, cancel, retry, or remove it. Removing the model keeps their timetables. Without it, photo import uses the existing text-recognition path.

Four real timetable images helped choose the candidate. With the same grid-transcription prompt and image enlargement, SmolVLM2 matched 0 of 118 cells, Qwen3-VL 2B matched 70, and 4B matched 97, requiring the correct subject, weekday and period. The 4B model also recovered both clock boundaries for 56 of 81 cells with known times after range parsing and AM/PM normalization. These are **Mac experiments**, not app-wide accuracy or phone-performance promises. The 35 cells in a period-only image were scored separately; preserving unknown times is not recovering clocks.

### A period number is not a recovered clock time

A table containing only period numbers creates a period-based timetable. Its stored times come from the app's existing period settings, which users must adjust if their school's bell schedule differs.

For clock-based tables, an unclear position or end time no longer becomes a guessed one-hour event. That entry is omitted and a notice explains omissions; usable events still create the timetable. An entirely unusable result does not create an empty success. Literal `null` subjects and rows whose number of cells does not match their weekdays are rejected before saving.

Removing mandatory review does not make recognition infallible. Users compare the result with the source and fix subjects, days and lengths through normal editing. The choice is to show usable work first instead of blocking the entire import behind incomplete entries.

### A pixel-limit property did not enforce the input budget

Review found that the selected Qwen processor ignored per-call `minPixels` and `maxPixels`. A compiling setting was mistaken for a bounded image. ImageIO now creates an orientation-aware thumbnail before decoding the full camera image, checks the actual dimensions, and supplies the supported `resize` input. Clock normalization is also scoped by weekday so Monday afternoon cannot turn Tuesday morning into evening; explicit 24-hour times remain unchanged.

Device and simulator builds passed, along with 35 unit tests and two UI tests covering immediate creation and download controls. Downloading the full weights and measuring repeated inference time and whole-app memory on a physical iPhone remain unverified. Host allocator peaks and simulator success do not establish phone performance.

## 2026-10-01 — A failed model run should leave the timetable intact

An iPhone crash report exposed a gap after the optional local model was added. The update adds process-memory checks and a boundary that turns supported native failures into an import error. Device-log access was blocked, so the reported crash's cause remains unknown; this is not a claim that the original failure was reproduced or fixed on the phone.

### Check process headroom again after loading

The clarified failure point was photo selection after the model download. Selection immediately starts local inference, so we checked the full ordering again. Admission now precedes GPU cache configuration as well as weight loading: even a cache-limit setter can initialize the runtime. A rejected attempt must not synchronize a GPU stream or clear its cache. This closes an observed ordering gap; the reported stage alone does not identify the actual crash cause.

A roughly 3.1GB download is not the whole inference footprint. Before loading, the app now requires the snapshot size plus 512MiB of current process headroom, measured with `os_proc_available_memory()`. Before image preparation and prefill, it samples again and requires another 1GiB. These are conservative admission policies, not measured guarantees across devices. Concurrent allocations or a changing OS limit can invalidate either snapshot.

A refusal leaves timetables and the first-import trial unchanged. The error offers an explicit diagnostic-copy action containing model, stage and memory numbers. It excludes photos, recognized text, file paths and raw native error messages.

### Put the native error scope where computation runs

Swift `do/catch` does not by itself convert MLX's native failures into Swift errors. `MLX.withError` now runs inside the detached inference task, where its task-local handler can reach the inheriting generation task. Errors are checked between stages; the iterator stops at the first captured failure. Generation is drained before models and caches are released, including on cancellation.

This cannot recover every termination. Jetsam kills the process, and the currently pinned MLX Swift 0.31.4 includes a Metal completion exception path that bypasses the scoped handler. Those limits remain distinct from the recoverable C-API failures tested here.

That runtime limitation is not permanent. [Official issue #458](https://github.com/ml-explore/mlx-swift/issues/458) is closed and newer core code includes the callback fix. [MLX Swift 0.32.3](https://github.com/ml-explore/mlx-swift/releases/tag/0.32.3) also patches launch compatibility on older OS versions, making current release notes essential.

An actual upgrade attempt hit a toolchain blocker: the new package requires Swift tools 6.3, while installed Xcode 26.3 provides Swift 6.2.4. Isolated package loading rejected the version floor; the LM package also needs a compatible update. We did not lower the manifest's tools declaration to pretend compatibility. This change keeps 0.31.4 and adds safeguards; adopting the existing upstream fix still requires a compatible toolchain and package graph.

### Even a CPU probe can initialize Metal

The first real-error test used `zeros(stream: .cpu)` and crashed during global Metal allocator initialization on the simulator. A proposed lazy `arange` probe also failed: constructing the CPU stream initialized a scheduler that created a GPU default stream. Neither failure diagnoses the user's iPhone; both invalidated assumptions about the test itself.

The final probe uses direct native device-metadata calls without arrays, streams or scheduler initialization. An empty-device getter produces a real native validation error through the production scope. An inheriting child task receives the same handler, and a healthy CPU-device getter works afterward.

The device-SDK build and 44 tests across seven simulator suites passed. That verifies error propagation, stopping/recovery and the memory policy, not downloaded-weight Metal inference. Repeated inference and the original crash on the affected physical iPhone remain unverified.

## History

- 2026-09-27 — one-time Premium, what stays free, existing users unlocked
- 2026-09-28 — app goes free, 7-day trial reconsidered and shelved, thank-you card + review request
- 2026-09-29 — custom colors fall back to the nearest basic color once confirmed free; mapping fixed twice
- 2026-09-30 — calendar export moves to Premium; disabled-button exception; unlock moved to a top card
- 2026-10-01 — browser sharing stays free, first saved photo draft is free, own-candidate comparison joins existing Premium; proposals under review
- 2026-10-01 — optional local model download, direct grid editing, period/clock distinction, and verified input-image budgets
- 2026-10-01 — process-headroom checks and scoped native errors after an iPhone crash report; corrected simulator probe assumptions
