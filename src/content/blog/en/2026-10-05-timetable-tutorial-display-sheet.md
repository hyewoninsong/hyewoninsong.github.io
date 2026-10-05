---
title: "The tutorial now starts inside the display settings sheet"
date: 2026-10-05T11:01:16+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The settings sheet and the tutorial used to appear on top of each other. The sheet is now step one of the tutorial. Along the way, a ring drawn 14pt off taught us that iOS 26 draws partial-height sheets at 0.96 scale."
---

Opening a timetable for the first time now begins with choosing which days and hours to show. Before, the settings sheet and the tutorial did not know about each other, and the welcome card could rise behind an open sheet.

## Set the frame first, then add events

Tapping Start on the welcome card opens the display sheet. A one-line hint sits at the top, and a finger taps the ✓ button on a loop. Pick days and hours, tap ✓, and the sheet closes straight into step two, creating an event.

![The display sheet with a tutorial hint capsule at the top and a blue ring and finger on the ✓ button](/blog/timetable-tutorial-display-sheet/sheet-step.png)

That makes ten steps, or eleven for period-based timetables, which set their period rules in the same sheet.

## Why the sheet became a step instead of being hidden

Hiding the sheet during the tutorial was the easy fix. But days and hours have to be decided before the first event anyway, so the sheet belongs at the front.

Three options lost:

- **Skip the welcome card and open the sheet directly.** The Skip button needs to come before the sheet.
- **Keep the hint only on the card above the grid.** The grid dims behind a sheet, and on iPad the sheet can cover the card. The same sentence now appears inside the sheet.
- **Float the hint at the bottom of the sheet.** This sheet is sized to its content, so a floating hint would cover the settings. It went into the top of the scrolling content, and the sheet grows with it.

The step completes when the sheet saves, which happens exactly once however it is closed. Waiting for the sheet to finish dismissing would delay the next hint by the length of the animation.

## The ring was 14pt off the button

In the first capture the ring sat to the left of ✓. Vertically it was fine.

![Before the fix: the blue ring is drawn to the left of the ✓ button](/blog/timetable-tutorial-display-sheet/ring-off.png)

The ring is positioned by measuring the button with `frame(in: .global)` and subtracting the drawing layer's own global origin. That code was exact in the full-height event sheet.

iOS 26 draws a partial-height sheet inset from the screen edges and **scaled down**: 8pt on each side and 0.96 on an iPhone 17 Pro. Global frames measured inside the sheet are post-scale, while the layer draws in pre-scale coordinates. Subtracting the origin gives 0.96 of the real distance, so the error grows with distance from the origin: 364 × 0.04 ≈ 14.6pt for a button at the right edge of a 402pt sheet.

The layer now measures both its own size and its global size and divides by the ratio. Nothing is hard-coded to 0.96, and full-height sheets and popovers still get a ratio of 1.

## Where it stands

Verified on iPhone from first launch through step two with real taps. iPad and period-based timetables have not been captured yet.
