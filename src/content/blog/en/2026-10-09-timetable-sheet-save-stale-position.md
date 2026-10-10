---
title: "I pressed save and the block stayed at its old place"
date: 2026-10-10T18:06:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
summary: "Change the day or time of a selected block in the edit sheet and save, and the screen kept drawing the old place. The save was right; a copy left over from tap-selection was painted on top."
---

In the timetable, select a block, tap it again to open the edit sheet, change its day or time and press the check mark. Before the fix, title, memo and colour updated at once, but the block stayed selected at its old day and time. Deselect or relaunch and it was at the new place. The save had been correct all along; only the screen right after saving was wrong. To the user it reads as "I saved and it jumped back".

## It was found by running the manual test cases for real

It surfaced the first time the app's test-case catalog was run through the actual UI, with verdicts taken from screenshots rather than from the test passing. Changing a block from Monday to Thursday left it in the Monday column, three times out of three.

![Right after saving with the day changed to Thursday, the selected block is still in the Monday column](/blog/timetable-sheet-save-stale-position/save-day-change-before.png)

After the fix, the same steps leave the block selected in the Thursday column, one second and five seconds after the sheet closes.

![After the fix, the block sits in the Thursday column, still selected](/blog/timetable-sheet-save-stale-position/save-day-change-after.png)

## Tap-selection leaves a copy that nobody cleans up

The grid picks what to draw in order: the sheet preview, else the snapshot taken at selection time (`editingSchedule`, a `@State` in the grid body), else the stored schedule. While the sheet is open the preview wins and shows the new place. On save the store updates and the preview is cleared, so the snapshot wins next and its old position is painted over the fresh schedule.

Drags clean the snapshot up when they commit. Tap-selection has no such cleanup. A month earlier the same snapshot caused a stale colour after a batch style change and was narrowed to geometry only; position was left alone because that is what the snapshot is for. Nobody counted the paths that change position from outside it: edit-sheet save, and undo.

## The fix, and what lost

When stored schedules change and no drag is in progress, refresh the snapshot from the stored schedule with the same id, or clear it if the schedule is gone. During a drag the snapshot is the finger position, so it is left alone. One hook, so undo while selected is covered too. A small pure helper with unit tests and a source-contract test guard it.

Lost alternatives: deselecting on save (hides the bug, but drops the selection of someone who wants to keep dragging); using the snapshot only during drags (right direction, but every other path would need rechecking); not taking a snapshot on tap (brings back the old geometry glitch).

## Why it was missed

The saved data was right, so unit tests and "check after relaunch" both passed. Title-only edits look fine. The old UI tests wrapped missing identifiers in `if exists` and verified nothing. The test cases now carry two separate expectations: what you see right after the sheet closes, and what you see after relaunch.

## A side note: a tool artifact, not a bug

The same run chased a "wheel shows 15 but the row says 14:00" mismatch that an earlier session suspected was an app bug. Real finger drags and taps on the wheel never reproduced it. Only XCUITest's `adjust(toPickerWheelValue:)` over several steps did: the wheel lands on the target but the last step's `valueChanged` never reaches the app. When a value looks wrong, reproduce it with a real finger before blaming the app.

## What is not checked yet

On the fixed build both test cases pass, plus neighbouring paths: save then drag from the new place, resize then undo while selected, cancel, delete and undo, duplicate. iPad's popover editor and period-type timetables are still unchecked.

## 2026-10-10 — A day later the same copy dragged the original away

The fix above made the snapshot follow the stored schedule. A day later it had gone stale along a different axis: not its values, but **whose copy it was**.

Tap a block, press Duplicate, and the copy lands 30 minutes lower, selected. Drag that copy to the next day and the picture under your finger is the copy, but on release the original has moved and the copy is still where it was. The vertical part of the move is lost. Dragging the copy's bottom handle resized the original. Selecting with a long press instead of a tap worked fine.

Duplicate runs outside the grid: it adds a schedule and moves the selection to the copy. The snapshot is `@State` inside the grid, and the earlier hook only refreshes it from the stored schedule with the same id. The original still exists, so the snapshot stays the original. Three places in the drag path then trusted it: keep the snapshot on long press if the block is already selected, use the snapshot as the base schedule while dragging, commit to the snapshot's id on release.

The rule now: with a single selection, the snapshot belongs to the selected schedule or it is empty.

- When the selected id changes and no drag is in progress, a snapshot with a different id is dropped. The grid observes the selection, so future actions that move it are covered too.
- The four places in the drag path that read the snapshot use it only when its id matches the dragged schedule.

Capturing the id at drag start and committing to it on release lost: it fixes the target but leaves the drag maths running on the original's position and length.

A UI test now runs the flow and dumps each block's day and time. Before: the original (Mon 08:50–12:50) ended up on Sat 10:00–14:00. After: the original is untouched and the copy (Mon 09:20–13:20) moved there. The same test fails with the fix reverted, and it runs with both tap and long-press selection.

It was missed because every automated flow that duplicates and drags (tutorial, store captures, promo video) selects with a long press, and because the dragged picture is the copy even when the bug is present. The earlier list of checked paths said "duplicate"; that meant duplicating, not dragging the duplicate.

What the first fix lacked is one sentence: when a copy is made to follow something, count every axis that can change what it is a copy of. We counted the stored data and not the selection.

## History

- 2026-10-09 — Selected block stayed at its old place after a sheet save; snapshot now follows the stored schedule
- 2026-10-10 — Dragging a duplicate after tap-selection moved the original; snapshot is now used only for the selected schedule
