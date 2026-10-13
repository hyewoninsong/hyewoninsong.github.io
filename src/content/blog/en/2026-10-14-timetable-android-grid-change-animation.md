---
title: "Undo on the Android timetable swapped the whole screen in one frame"
date: 2026-10-14T04:32:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "Undo and redo replaced the grid in a single frame, so you could not see what went back. Day columns and hour rows now slide in and out, blocks travel from the old place to the new one, and removed blocks fade away."
---

Pressing undo replaced the timetable with a different picture in one frame. The state was right, but you could not follow which block went where. Now the grid moves from what it showed to what it shows next.

## Everything that changes moves on one curve

| What changed | Before | Now |
|---|---|---|
| A block's day, time, length | Appears at the new place | Glides from the old place; the length passes through the values in between |
| Block added or removed | Pops in or out | Fades and grows in; shrinks and fades out |
| Displayed days (Mon-Fri ↔ every day) | Columns re-divide at once | Column widths change together; Sat and Sun enter and leave at the right edge |
| Start or end hour | Rows swap at once | Rows slide in and out at the top and bottom |

![Mid-redo: the Saturday column is entering from the right and the orange block is fading in](/blog/2026-10-14-timetable-android-grid-change-animation/columns-and-block-arriving.png)

The grid does not ask what caused the change. Undo, the settings sheet, an edit: it only compares what it was showing with what the timetable says now. The spring is the one the grid uses when it zooms on unlock (0.35 s, damping 0.9), which is also what the iOS app uses for range changes.

## Rows that are leaving stay drawn a moment longer

Shrink the start from 7:00 to 9:00 and the new timetable has no 7:00 or 8:00 row. Draw only the new range and those rows vanish before they can move.

So during a change the grid draws a range that holds both the old and the new rows, and moves only the visible window across it. The rows slide out under the top edge; when the window arrives, the extra rows are dropped. Days work the same way: Mon-Fri is the start of Mon-Sun, so seven columns stay drawn while they widen and push Sat and Sun off the right edge.

![Mid-undo: the 7:00 row is sliding out at the top and the yellow block is fading](/blog/2026-10-14-timetable-android-grid-change-animation/rows-sliding-out.png)

When two axes share no rows, such as a clock timetable and a period timetable, there is nothing to slide. That change is shown at once.

## Blocks move in columns and minutes, not pixels

A spring per block in pixels is the usual approach, and it lost here. Unlocking zooms the grid 1.5x, which changes every block's pixel target on every frame; pixel springs would trail the zoom.

Instead each block's place is kept as "column, start minute, end minute", and that is what travels from old to new. Pixels are computed when drawing, so a zoom carries the blocks rigidly.

There is one progress value per change, shared by the window and every block. A second undo mid-flight starts again from whatever is on screen.

Two other options lost: animating only when the undo button was pressed (the same change would jump in the settings sheet and glide on undo), and crossfading the whole grid (cheap, but nothing travels, so you still cannot see what moved).

## One step past iOS

The iOS app animates range changes only; its blocks appear and disappear at once. On Android the blocks move too, because bringing back a deleted block is the most common use of undo, and a block popping in there would defeat the point. The block you are dragging keeps its own spring and is left alone.

## What is left

When the start hour changes, iOS holds the time you were looking at in place; Android lets the rows slide past. And when undo restores a selected block's length, its end-time label arrives slightly before the block's edge does.
