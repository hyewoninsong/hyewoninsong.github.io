---
title: "Every timetable opened by growing out of the top-left corner"
date: 2026-10-05T09:10:00+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "A spring meant for range changes was also animating the first fill of the view's state. We blamed the wrong change first, and only per-frame numbers set it straight."
---

Picking a timetable from the list now draws the grid in place from the first frame. Before, it sat slightly bunched in the top-left and spread out over about 0.2 seconds, which read as a bug.

## 0.2 seconds of unfolding

![Three frames right after picking a timetable. Hour labels appear twice and the incoming grid's columns start narrow](/blog/2026-10-05-timetable-grid-entrance-first-load/entrance-before.png)

The two timetables overlapping is the intended crossfade. The incoming one overlapping **at a different size** is not. The right edge of its blocks went 318 → 327 → 333 → 337 → 339 → 341pt across six frames, and the top edge slid from 201 to 225pt.

![The same frames after the fix. The incoming grid is at its final position from the start; only opacity changes](/blog/2026-10-05-timetable-grid-entrance-first-load/entrance-after.png)

After the fix the first captured frame reads 341 / 225, and so do the next 60.

## A spring cannot tell "first fill" from "change"

A day earlier we made display-range changes (start and end hour, number of days) spring instead of jump, with one `.animation(_:value:)` on a key built from those values.

The grid keeps the range in `@State`. It renders once with defaults (9–18, default days), and `.task` writes the stored values on the next update. To `.animation(_:value:)` that is a key change like any other, so it springs. A different day count animates column width; a different start hour animates vertical position.

The fix disables implicit animation for the first load only:

```swift
var transaction = Transaction()
transaction.disablesAnimations = true
withTransaction(transaction) { loadTimetableSettings() }
```

Later loads (undo, a change from another window) still spring, as they should. Gating `.animation` on a "loaded" flag lost because the flag and the values change in the same update, which is already animated. Seeding the state in `init` was not possible: the store is an environment object.

## We blamed the wrong change first

A timetable-switch crossfade shipped the same day, so it was the first suspect. We cut the animation flowing into the new grid, looked at a small contact sheet of the recording, judged it fixed, and opened the PR.

Re-exporting frames at full resolution showed the doubled hour labels were still there. At 90 pixels wide the difference was invisible.

So we built four variants into one binary and recorded them in one run: original, crossfade off, animation always blocked, animation blocked conditionally. With the crossfade off the grid still grew in. Blocking from outside did nothing either, because the spring is attached inside the grid by its own `.animation(value:)`, not inherited from above.

Two things became procedure. Judge a transition by listing an edge coordinate per frame: a converging sequence is an animation, a flat line passes. And when two recent changes are suspects, compare variants with each one switched off in the same build.

## Where it stands

The iPad layout shares the grid code but was not measured separately. When putting an animation on a value, first count the paths that fill that value for the first time.
