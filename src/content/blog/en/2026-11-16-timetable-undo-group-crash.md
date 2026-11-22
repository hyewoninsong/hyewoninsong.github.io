---
title: "Undo crashed the app — one undo group never closed"
date: 2026-11-16T15:31:36+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "On wide screens, dragging a repeating calendar event, switching its scope, dragging again and tapping undo crashed the app. Pausing undo registration collided with UndoManager's automatic per-event group."
---

On wide layouts (iPad landscape, an unfolded iPhone Duo), dragging a repeating calendar event, switching its edit scope, dragging again and tapping undo quit the app. Undo now steps back one drag at a time.

## Where it died

The wide layout puts an edit pane next to the grid. While one event is selected, everything you change is saved but grouped into a single undo step. The app does this by calling `disableUndoRegistration()` while the selection lasts, then registering one snapshot when it ends.

The crash needed four steps: drag with "all events", switch the scope bar to "this and following", drag again, undo. The TestFlight crash log showed `-[NSUndoManager undo]` throwing from the undo button. The single-column iPhone layout never crashed, because it has no edit pane and no grouping.

## What was happening

`UndoManager.groupsByEvent` is on by default. The first registration in an event opens a group, and the run loop schedules `endUndoGrouping` for the end of that event.

Switching scope closed the old group and opened a new one in the same tap: enable registration, register the snapshot (opening the automatic group), disable registration again. When the scheduled close ran, registration was off and the close did nothing. The group stayed open, and the next `undo()` threw.

Closing the group by hand made it worse. The scheduled close runs anyway and throws as an unmatched `endUndoGrouping`.

## The fix

- Register the snapshot inside an explicit `beginUndoGrouping`/`endUndoGrouping` pair. No automatic group is opened.
- If an automatic group is already open in that event, wait to disable registration until just after it closes. The undo manager schedules its close at run-loop order 350000, so `RunLoop.perform(_:target:argument:order:modes:)` with order 350001 runs right after it.

## Why tests missed it

The grouping tests turned `groupsByEvent` off and opened groups by hand, so they never went through the run loop's scheduled close. The new tests use a default `UndoManager` and spin the run loop between steps. They crash on the old code.

The crash log came from the App Store Connect API (`betaFeedbackCrashSubmissions` → `crashLog`), since the device wasn't attached.

## Where it stands

Verified on the iPad simulator. Not yet checked on an unfolded Duo or on Mac.
