---
title: "The class that snapped back had an invisible twin"
date: 2026-09-30T02:29:00+09:00
app: "timetable"
tags: ["devlog", "data", "swiftui"]
summary: "Resized or moved blocks jumped back the moment you deselected them. Not a gesture bug: two schedules shared one id, and the twin came from tapping the save button several times fast."
---

In period timetables, a class you resized or moved could jump back to its old size and slot the moment you deselected it. That's fixed. The gesture code was fine. There were two schedules with the same id.

## It looked right until you let go

The report came as two screen recordings. A two-period Korean class shrunk to one period stayed shrunk while selected, then snapped back when the user tapped away. A class moved to Monday returned to Wednesday. Other blocks moved just fine. A freshly made period timetable didn't reproduce it.

## The clue was a block hatched on its own

One frame showed a block alone in an empty cell, drawn with the overlap hatch. The hatch only appears when two schedules share a time, so something invisible was sitting there.

Two schedules with the same id explain everything:

- Saving finds the first match by id and updates it. The twin keeps the old position.
- While selected, the selection layer draws the first one, so the change looks applied.
- After deselecting, the block list (`ForEach`) makes one view per id, so the untouched twin is what you see.
- Overlap detection counts both, hence the hatch.

Seeding the same schedule twice in the simulator reproduced it exactly.

![With a duplicated id: shrunk to one period (left), back to two after deselecting (right)](/blog/timetable-twin-schedule/twin-reverts.png)

## The twin came from mashing the save button

In the new-schedule sheet, the user opened the style popover, changed the style, then tapped the check button several times fast. The first tap is swallowed by the popover, so we turn it into a save that waits for the popover to disappear. That way the new color is included. A second tap in that window, or while the sheet is sliding away, saves again. The same new schedule goes in twice.

## Two doors closed

- **The sheet** ignores the check button while a save is pending, and saves a new schedule only once.
- **The store** keeps schedule ids unique where schedules come in. A duplicate within a timetable is dropped. An id already used in another timetable gets a fresh one. Every rejection is reported with the call site.

Existing twins are split apart on the next launch by the startup repair that was already there. Delete the extra block and you're done.

![Same steps on the fix: the class stays one period after deselecting](/blog/timetable-twin-schedule/fixed-stays.png)

## Why it took a while

A startup repair for duplicate ids already existed, but nothing blocked them at runtime. UI tests couldn't reproduce the mashing either: XCUITest waits for the app to go idle before each tap, so the second tap always landed after the sheet was gone. That path was checked by reading the code.

## History

- 2026-09-30 — traced snapping blocks to duplicate ids and closed the rapid-save path
