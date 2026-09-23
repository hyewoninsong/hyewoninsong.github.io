---
title: "90 App Store screenshots, one command"
date: 2026-09-24
app: "daily-planner"
tags: ["devlog", "appstore", "swiftui"]
summary: "10 iPhone and 8 iPad marketing cards in five languages, captured by code instead of by hand — with the sample data and the frozen clock living inside the app."
---

SuperPlanner's App Store page now has ten iPhone cards and eight iPad cards, in five languages — Korean, English, Japanese, Simplified and Traditional Chinese. Nobody tapped through the app 90 times to make them. One command produces the same set every time.

## What changed

A screenshot has to look like a real day: today's and tomorrow's blocks, months of history filled into the contribution grid, a bundle parked in the drawer, three profiles. The app builds that data itself. A launch argument seeds an in-memory store — three profiles, seventeen todos, 180 days of history — before the first frame renders. Titles and notes follow whichever language the app is running in, so switching languages and relaunching switches the cards too.

The clock is frozen too. "Now" is the axis this app's screen reads by — a line across the canvas that tells you which block is in progress. If the status bar says 9:41 but the in-app now-line says something else, every card shows two clocks disagreeing. So under the capture flag, the app's own notion of "now" also stops at 9:41. Morning blocks are checked and dimmed, the current one sits right on the line, every run.

<img src="/blog/planner-store-screenshots-as-code/card-hero.png" alt="Status bar and the in-app now-line both read 9:41; the morning's finished blocks are checked and dimmed" />

## Why this, not the alternatives

Three ways to get the data existed. UI tests tapping through the app to build it went first — seventeen todos and hundreds of blocks, times five languages, times tens of minutes each, with no way to fake six months of history. Pre-seeded simulator store files were next: no way to vary the title by language, and other sessions' test resets wipe the same container. A JSON fixture bundled with the app was closest, but hand-writing hundreds of blocks in five languages isn't realistic — a rule ("this todo most days, done with this probability") is shorter than the data it produces, so the rule became the code.

Turning the now-line off for captures — something we've done on other apps — was on the table too. Here it lost: the now-line isn't decoration, it's how this screen reads a day. Freezing the clock kept it instead of hiding it.

## What the capture pipeline had to learn

**Mid-drag frames.** Capturing a block mid-move meant guessing when to snapshot. A fixed 2.4-second wait after starting the drag missed half the time — XCUITest's pre-gesture idle wait isn't constant. The fix polls screenshots on a background thread: the first frame that differs from the starting one means the finger is down, two identical frames in a row mean the drag has settled.

<img src="/blog/planner-store-screenshots-as-code/card-group-move.png" alt="A block mid-drag, with the linked blocks below it moving along" />

**Sheets** needed an extra 1.8 seconds after their first row appeared — the capture tool doesn't wait for a sheet to finish presenting, so a shot taken too early is half-blurred. **Appearance** — light vs. dark — didn't always switch on iOS 26 simulators, so a later locale's screenshots sometimes came out in the previous locale's mode; the app now sets `.preferredColorScheme` explicitly under the capture flag instead of trusting the system. **iPad's** top tab bar isn't findable through the standard `tabBars` collection, so it's located by label — and the status bar's date follows the simulator's own system language, which means switching and rebooting the simulator once per locale.

<img src="/blog/planner-store-screenshots-as-code/card-ipad-en.png" alt="An iPad card after rebooting the simulator into English — even the status bar date reads in English" />

**One footer stayed Korean everywhere.** After all five languages were captured, a drawer sheet's hint text was still Korean in the English, Japanese and Chinese cards. The string used interpolation — `"Tap to place it back at \(date) …"` — and the test that scans for untranslated Korean literals had been skipping interpolated strings, because the catalog stores the placeholder as a format specifier instead of the source's `\(…)`. Fixing the comparison to match either form surfaced seven more missing keys that had been slipping through the same gap: three delete-confirmation strings, a count label, and three duration strings missing only from the widget's own catalog.

## Where it stands

Screenshots and five-language copy are live on App Store Connect. Attaching a build to that version and submitting for review are separate steps. Widget screenshots and a preview video aren't captured yet.

## 2026-09-24 — One day later, the same segment died in all five languages

The day after the cards went up, note editing changed: instead of a narrow popover under the block, a full-width composer docks above the keyboard, chat-app style, and the keyboard comes up on its own. For the user that is the whole story. For the screenshots it meant capturing all 90 again — and on the rerun, the drawer segment stopped at the same spot in every language.

**Symptom.** The note shot was captured. The next step, opening the drawer, failed with "no drawer button". Five minutes per language, thirty minutes gone on the first pass.

**What was actually happening.** The capture test closed the popover by tapping an empty stretch of the timeline. With the composer, the keyboard owns the lower half of the screen and the timeline is scrolled up so the block being edited stays visible above it. The same coordinate now lands on a key. The composer stays open, the selection stays, and the bottom-right corner keeps the two selection buttons instead of the drawer button the test was waiting for.

Why nobody saw it a day earlier: the capture tests compile on every build but run in nobody's test plan. The composer PR wrote its own UI test, which passed. The capture test had been leaning on an app decision — "tap outside to close" — and the decision changed without anyone rereading the capture side. The note field's accessibility identifier survived, so nothing looked stale.

**The fix.** Never close by coordinate. Tap the composer's save button; if the selection is still there afterwards, relaunch — the drawer contents come from the fixture, so the previous segment's state is not needed. An "outside tap" quietly presses whatever the app now puts there.

**What would catch it earlier.** A PR that changes how something opens or closes also fixes the capture test that uses it, and runs that one segment in one language — two minutes. Before a recapture, skim the decisions merged since the last pass. A surviving identifier proves the shot, not the step after it.

## History

- 2026-09-23 — first full run, 90 cards uploaded
- 2026-09-24 — recapture after the keyboard-docked composer; the drawer segment closes through a control instead of a coordinate
