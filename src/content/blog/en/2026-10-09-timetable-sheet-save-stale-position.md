---
title: "I pressed save and the block stayed at its old place"
date: 2026-10-09T21:21:55+09:00
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
