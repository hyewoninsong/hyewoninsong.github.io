---
title: "The tutorial now starts inside the display settings sheet"
date: 2026-10-09T17:13:27+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The settings sheet and the tutorial used to appear on top of each other. The sheet is now step one of the tutorial. Along the way, a ring drawn 14pt off taught us that iOS 26 draws partial-height sheets at 0.96 scale."
---

Opening a timetable for the first time now begins with choosing which days and hours to show. Before, the settings sheet and the tutorial did not know about each other, and the welcome card could rise behind an open sheet.

## Set the frame first, then add events

Tapping Start on the welcome card opens the display sheet. A one-line hint sits at the top, and a finger taps the ✓ button on a loop. Pick days and hours, tap ✓, and the sheet closes straight into step two, creating an event.

![The display sheet with a tutorial hint capsule at the top and a blue ring and finger on the ✓ button](/blog/timetable-tutorial-display-sheet/sheet-step.png)

That made ten steps; period-based timetables set their period rules in the same sheet. (Since 2026-10-09 both kinds have eleven. See below.)

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

## 2026-10-07 — The resize handles vanished, but only in the tutorial

At the resize step a selected block had its outline but no handles. The tutorial's blue highlight pointed at an empty spot.

![Before: the selected block has its outline, but only a faint mark where the bottom handle should be](/blog/timetable-tutorial-display-sheet/handles-covered.png)

It would not reproduce. Six probes using the debug argument that starts the tutorial at a given step all showed the handles: both grid types, a yellow block, iOS 26 and 27, a full create, move, resize run.

The clue was in the pixels of the report. The handle area was the block color times 0.967, evenly, at full size. A hidden handle leaves nothing; one that is fading in is also small. Full size and faint means it was drawn and **covered**.

The cover was a copy of the same block. Tapping a block on a locked timetable shows an info card and draws a copy of that block on the top layer, without handles. Unlocking with the lock button clears it. The tutorial's Start button unlocked the grid without going through that path, so anyone who tapped a block while the welcome card was up carried the copy into the tutorial.

Start now clears that state, and the copy is only drawn while the grid is locked, so a future unlock path cannot bring it back.

![After: same steps, handles visible](/blog/timetable-tutorial-display-sheet/handles-shown.png)

The debug shortcut starts on an unlocked grid and cannot create this state at all. A flow needs one run through its real entrance, including whatever a person can do while the entry screen is still showing.

Two smaller changes went in with it. The highlight around the title field sat flush on the text field, so its bottom edge landed on the underline; it now wraps the text and underline with 8pt of room.

![The title highlight wraps the text and its underline with room to spare](/blog/timetable-tutorial-display-sheet/title-outline.png)

The blue glow that was fixed in the top-left of the coach card now drifts around inside it, driven by four sines with periods that never line up. With Reduce Motion on it stays where it used to be.

## 2026-10-09 — The demo was showing a move you cannot make

In a period-based timetable, the "create" demo drew its ghost block from period 4 straight through the lunch slot into period 5. Events cannot sit in lunch, and a real drag stops in front of it. Nothing was saved wrong; the guide was simply showing something you could not follow. The move and resize demos had the same problem.

The demo picks a free spot from whatever is on screen. It already tried to avoid lunch by cutting the search range to "before lunch". But cutting a range only trims where a block may **start**. Period 4 is before lunch, so it stayed a candidate, and the end of a two-period block was only checked against the end of the grid.

Each candidate is now checked from start to end. A two-period block that would touch lunch looks for two periods on the other side first, then falls back to one. The move demo skips targets that touch lunch, and the resize demo grows only up to it. This holds when the lunch slot is hidden too, because the boundary is still a line events cannot cross.

![The dashed create ghost sits in periods 5 and 6, below lunch](/blog/timetable-tutorial-display-sheet/create-after-lunch.png)

The tests missed it because the demo planner was only tested on a grid with no lunch, and captures were taken on an empty timetable where the lunch area never got picked. A calculation that saves nothing still says "you can put it here", so it has to see the same walls as the real gesture.

## 2026-10-09 — Before locking, outline the whole day row and time column

Tapping the day row or the time column opens the display settings. Only the period tutorial mentioned it, and it outlined a single period cell, which read as "only this cell is tappable".

Both kinds of timetable now teach this in the step just before locking. One outline runs around the whole day row and the whole left column. A finger taps the row, then the column. Tapping either opens the sheet and moves on to the lock step. Both tutorials are eleven steps.

![Period timetable: one blue outline joins the day row and the period column, with the coach card tucked inside the corner](/blog/timetable-tutorial-display-sheet/shortcut-outline-period.png)

![Time timetable: the same outline, with the copy saying "times"](/blog/timetable-tutorial-display-sheet/shortcut-outline-time.png)

The coach card normally sits at the top of the grid, on top of the day row, so it covered the thing it was pointing at. For this step it drops below the day row and to the right of the column. Moving it to the bottom lost because the next step's lock button is down there and the card would jump twice. Two separate outlines lost because they read as a choice between two things.

Not yet checked by hand: the iPad layout, and a full run from the welcome card.

## History

- 2026-10-05: tutorial starts in the display settings sheet; 0.96 scale correction for partial-height sheets
- 2026-10-07: locked-tap copy covering the handles; roomier title highlight; drifting card glow
- 2026-10-09: demos no longer cross lunch; the step before locking outlines the whole day row and time column
