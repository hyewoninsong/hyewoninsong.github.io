---
title: "A sheet that popped in instead of sliding up — measuring its height was cancelling the transition"
date: 2026-10-08T19:12:45+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "A content-sized sheet had no present animation. Its height was being rewritten twice while it was still rising, and getting the initial estimate right does not fix it."
---

Tapping the day row or the time column in the timetable opens a display settings sheet. It used to appear in place with no slide-up, while dismissing animated normally. It slides up now. The same sheet was fixed twice more that day, and in the end it stopped measuring its height at all.

## Only the opening had no animation

These are the first 0.4 seconds after the tap at 20 frames per second. The sheet is fully up in the first frame.

![The sheet is already in its final position in the first frame after the tap](/blog/timetable-sheet-detent-present/before-pops-in.png)

After the fix, the same window shows it rising.

![Over the same window the sheet rises from the bottom edge](/blog/timetable-sheet-detent-present/after-slides-up.png)

The settled screen is identical in both cases, which is why screenshot checks never caught it.

## The height was rewritten twice mid-transition

The sheet sizes itself to its content: `onGeometryChange` measures the cards and feeds `.presentationDetents([.height(…)])`. It starts from an estimate and the first measurement corrects it. Logging height and content width showed what that correction does.

| After tap | Event | Height | Content width |
|---|---|---|---|
| 155 ms | Initial estimate | 608 | — |
| 189 ms | First measurement | 730.7 | 216 |
| 213 ms | Second measurement | 637.7 | 402 |

The detent set changes twice within 60 ms of the sheet starting to rise. When the set changes mid-transition, the sheet drops the transition and is drawn at the new height. Dismissal was fine because nothing changes height then.

Note the first measurement's width: 216 on a 402-point screen. The first layout pass runs before the sheet has its real width, text wraps, and the height comes out too large.

## A correct estimate does not help

Pinning the estimate to the exact final value still popped in, because the narrow-width measurement slips in between. So the fix is about timing, not the value: measurements are held, and only the latest one is applied once the sheet has finished rising.

- SwiftUI's `onAppear` fires when the transition starts. A child view controller's `viewDidAppear` marks the end, about 0.8 s after the tap.
- Waiting a fixed 0.6 s also worked. It copies the transition's duration into a constant, so it lost.
- The settled height is remembered, so the next open starts at the right height and nothing moves after it lands.

The settings sheet used the same pattern and got the same fix.

## Why it was missed

Every check of this sheet was one settled screenshot, and the source-level tests only asserted that a measurement drives the height, not when. For values driven by measurement, when they land matters as much as what they are. Sheets that measure their height now get their opening recorded and judged frame by frame.

## 2026-10-08 — It was also jumping when the height changed while open

The same afternoon, a different moment of the same sheet came up. Switching the vertical axis from time-based to period-based swaps a card, and the content grows from 614 to 783 pt. The sheet did not grow. It was at the new height one frame later.

![One frame after the tap the sheet already fills the screen](/blog/timetable-sheet-detent-present/resize-before-jump.png)

On a height change the detent set went from `[.height(old)]` to `[.height(new)]`, with the selection moved in the same update. The system only animates a move between detents that are both in the set. Once the starting detent is gone there is nothing to animate from. Two `.height` detents with different values are different detents.

Wrapping the update in `withAnimation` changed nothing on the recording. A SwiftUI transaction does not reach the controller that draws the sheet.

What works is splitting the steps:

1. Put both heights in the set. The selection is still the old one, so nothing moves.
2. On the next tick, move only the selection. The system now animates between the two.
3. After 0.6 s, drop the old height, so the sheet cannot be dragged back down to it.

![The same tap now grows the sheet over several frames](/blog/timetable-sheet-detent-present/resize-after-moves.png)

A height can change again inside that window, so the cleanup carries a transition number and only removes the old height if it still belongs to it.

The sheet was always meant to follow its content, a wheel expanding for example. It did reach the right height, but nobody had watched whether it moved there. Recording only the opening left the rest unchecked for exactly one day.

## 2026-10-08 — Sheets taller than the screen "moved" between equal heights, and shrank on the way

A third one arrived that evening. The first time Settings opened after launch, the sheet finished rising, pulled inward on all sides, then returned to full size. The period-based display sheet did it every time a wheel expanded or collapsed. It first looked tied to Face ID unlock. With app lock on, Face ID comes first on every launch, so it lined up with "first open after launch". A build without app lock did exactly the same.

![The settled sheet pulls in from both edges, then returns to full width](/blog/timetable-sheet-detent-present/over-max-before-shrinks.png)

Both sheets have content taller than the screen. A `.height(…)` detent is then clipped to the screen's maximum and the sheet draws full width, like `.large`. The fix from the previous section did the rest. On first open the estimate is corrected to the measurement, and a wheel changes the measurement. Old and new are both clipped to the same height on screen, but different values are still different detents. The system dutifully animates between them, and during that move the sheet takes the look of a detent that is not the largest: the floating, inset shape.

It only showed on first open because the settled height is remembered. From the second open the sheet rises at that height and nothing moves.

The fix is one rule. Every height that does not fit collapses to a single value, and its detent is `.large`, not `.height`. The limit is the window height minus the top safe area and the sheet's navigation bar. Above it, height changes never touch the detent set. Crossing it is still a real move between `.height` and `.large`.

![The same span: the sheet rises full width and stays](/blog/timetable-sheet-detent-present/over-max-after-stays.png)

The mechanism had been read that same morning. Toggling app lock shrank the sheet the same way, triggered by one row appearing and disappearing. App lock was removed, the row went with it, and the note said "not confirmed by reproduction, revisit if seen again". That removed one trigger, not the condition. Two more paths changed the height of an over-tall sheet.

The recording that validated the previous fix used a sheet that fits on screen. Measured-height sheets now get one taller-than-screen configuration recorded too. The wheel case was not recorded this time; a unit test pins that it takes the same path.

## 2026-10-08 — In the end, the sheets stopped measuring

After three fixes in one day the direction changed. The three bugs looked different but shared one condition: the detent changes while the sheet is up. A sheet that follows its content creates that condition every time the content changes: the first measurement, an expanded wheel, an axis switch. Each fix closed one path, and there was no way to count the ones left.

So every sheet in the app now uses only the system sizes, `.medium` and `.large`. Four were not on a preset.

| Sheet | Before | After |
|---|---|---|
| Settings | measured height | `.large` |
| Display settings | measured height | opens at `.medium`, grabber to `.large` |
| New timetable | `.medium`, then measured | `.medium` |
| Style apply confirmation | fixed 298pt | `.medium` |

The measuring helper, the view controller that reported the end of the present transition, and the height estimates are gone. None of the fixes in the three sections above exist in the code any more.

Only the display sheet needed a decision. The timetable behind it is the live preview, so `.large` would hide what you are changing. At half height the content does not fit, and by default scrolling a half-height sheet grows it. That would cover the timetable just to reach a lower card, so the content scrolls instead: `.presentationContentInteraction(.scrolls)`.

![The display sheet opens at half height with the timetable visible behind it](/blog/timetable-sheet-detent-present/system-medium-open.png)

Expanding a wheel used to grow the sheet. Now the sheet stays put and scrolls just far enough to show the whole wheel.

![With the end-time wheel expanded the sheet keeps its height and all three rows are visible](/blog/timetable-sheet-detent-present/system-medium-wheel.png)

There is a cost. Short sheets such as New timetable leave empty space below. The display sheet covers about 50% of the screen instead of 77%, so more timetable shows and the lower cards need a scroll. A content-fitted height still looks better. It cost three pitfalls in two days.

A test guards it: any `.height`, `.fraction` or `.custom` detent in the source fails. The period-based wheel scroll and iPad were not captured this time.

## History

- 2026-10-08 — Present transition was cancelled. Measurements are applied after the transition ends.
- 2026-10-08 — Height changes while open jumped. Old and new heights share the set and the selection moves a tick later.
- 2026-10-08 — Sheets taller than the screen shrank and grew back. Heights over the screen limit collapse to `.large`.
- 2026-10-08 — Measured-height detents removed. Every sheet uses `.medium` or `.large` only.
