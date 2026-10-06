---
title: "The lock zoom stuttered because we were measuring toolbar buttons"
date: 2026-10-06T20:40:35+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "Unlocking a timetable zooms the grid to 1.5x. The animation was running at 30fps. The curve and the coordinates were right; the cause was toolbar button frames being measured during the same moment."
---

Locking a timetable shrinks it to fit the screen, and unlocking zooms it to 1.5x so blocks are easier to drag. That transition felt slightly choppy. It now runs at 60fps from the frame after the tap.

## Everything was in the right place, on too few frames

This zoom had been fixed twice before, both times by pulling video frames and checking positions. This time the positions were correct, so we measured timing instead: the interval between `CADisplayLink` ticks while the zoom ran, over six toggles.

| | Before | After |
|---|---|---|
| Frame interval during zoom | 26–67ms | 16–17ms |
| Tap to first zoom frame | 120–130ms, 500ms on the first toggle | 20–100ms |
| Bottom scroll margin | 0 → 160 → 19.8 → 0 | steady at 0 |

A 0.25 second animation was being drawn in eight frames.

## Toolbar frames arrived on every frame for over a second

Each bottom toolbar button reported its global frame through `onGeometryChange` into a `@State` dictionary on the grid's root view, so a time label being dragged would not hide behind a button. Unlocking adds undo, redo and add buttons. The iOS 26 toolbar morphs them in: widths grow from 5pt to 28pt, positions spring into place, and every intermediate value is reported. That was 38 to 44 state changes per toggle, each one re-evaluating the root view and every schedule block, during the same 0.3 seconds as the zoom.

`onGeometryChange` only delivers the final value when SwiftUI is interpolating an animation, which makes measured values feel infrequent. A toolbar morph is UIKit changing real layout each frame, so you get all of them.

## New buttons are measured before they are on screen

The first frame reported for a newly inserted button was `(-11, -11)`. The bottom margin is the distance from the scroll view's bottom edge to the topmost button, so a top edge of −11 pushed it to its cap of 160. On short timetables that are scaled up to fill the screen, the margin feeds the scale, which went 1.47 → 1.10 → 1.42 → 1.47 across the first three frames of the zoom.

## Publish measurements only after they settle

The fix is one property wrapper, `@SettledState`. Writers read and write the latest value immediately. The view only sees a change once writes have been quiet for 0.15 seconds. Frames are rounded to whole points so sub-point jitter at the end of the morph does not delay settling.

Filtering only the off-screen frames would have fixed the margin and left the per-frame invalidation. Freezing the margin during the toggle would have left the state churn too.

The cost: for about a second after unlocking, the time label does not know where the new buttons are.

## Position and timing are separate checks

Extracting video at 60fps hides dropped frames, because a dropped frame is the same picture twice. Tick intervals show them directly. We also stopped tapping through a UI test, which adds its own stalls, and had the app toggle itself from a launch argument.

These numbers come from a debug build on the simulator. The check on a 120Hz device is still to come.
