---
title: "A sheet that popped in instead of sliding up — measuring its height was cancelling the transition"
date: 2026-10-08T00:01:33+09:00
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
