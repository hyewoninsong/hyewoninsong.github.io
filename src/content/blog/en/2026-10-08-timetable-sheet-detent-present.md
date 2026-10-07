---
title: "A sheet that popped in instead of sliding up — measuring its height was cancelling the transition"
date: 2026-10-08T04:00:57+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "A content-sized sheet had no present animation. Its height was being rewritten twice while it was still rising, and getting the initial estimate right does not fix it."
---

Tapping the day row or the time column in the timetable opens a display settings sheet. It used to appear in place with no slide-up, while dismissing animated normally. It slides up now.

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

## History

- 2026-10-08 — Present transition was cancelled. Measurements are applied after the transition ends.
- 2026-10-08 — Height changes while open jumped. Old and new heights share the set and the selection moves a tick later.
