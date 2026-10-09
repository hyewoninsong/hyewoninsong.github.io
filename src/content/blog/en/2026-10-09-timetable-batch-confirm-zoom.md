---
title: "The confirm button grows into the confirm sheet — except when you save"
date: 2026-10-09T19:45:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The batch-change sheet now zooms out of the ✓ button and shrinks back into it on cancel. The system zoom transition is two lines; the save path left a lone ✓ floating over the grid."
---

When you change an event's color or title and tap ✓, SuperTimetable asks whether to apply the change to the other events that share that style. That small sheet now grows out of the ✓ button and shrinks back into it when you cancel, so the button you tapped and the sheet you got read as one object.

## Half the sheet was empty

The sheet uses the system medium detent, but its content sat in the top half. The close button was a hand-drawn 36pt circle, visibly smaller than the X on the edit sheet behind it.

![Batch-change sheet — before/after blocks fill the spare height, and the X matches the edit sheet's X](/blog/timetable-batch-confirm-zoom/sheet-settled.png)

| | Before | After |
|---|---|---|
| Presentation | Slides up | ✓ button grows into the sheet |
| Close button | Custom 36pt circle | Toolbar button, same as every other sheet |
| Spare height | Empty | Before/after blocks stretch to fill it |

We did not shrink the sheet to fit. Content-measured sheet heights were removed from this app a day earlier because the sheet moved every time its content changed. Instead the part of the content that is a picture — the two blocks — takes `maxHeight: .infinity`. Timetable blocks are tall anyway.

## The zoom is two modifiers

`matchedTransitionSource(id:in:)` on the source (it works on a `ToolbarItem` too) and `navigationTransition(.zoom(sourceID:in:))` on the sheet content. The way back comes free: X or swipe-down shrinks the sheet into the ✓.

![Four frames of the ✓ button growing into the sheet](/blog/timetable-batch-confirm-zoom/zoom-open.png)

## Saving left a ✓ hovering over the grid

Both action buttons dismiss the confirm sheet *and* the edit sheet underneath in one go. With the zoom attached, the confirm sheet still tried to return to its source — a button on a sheet that was already sliding away. For about 0.2 seconds a black ✓ circle floated alone over the timetable.

![On save — the edit sheet drops while the confirm sheet shrinks into a ✓ left over the grid](/blog/timetable-batch-confirm-zoom/save-ghost.png)

The fix: keep the `sourceID` in state and have the two save buttons swap it for an unmatched id just before dismissing. With no source to return to, the sheet leaves with the edit sheet. Cancel and swipe still zoom back.

Screenshots cannot show this. A UI-test tap waits for the screen to settle, so five shots taken right after the tap were all the settled state. Record the simulator while the test runs and lay the frames out at 30fps — once each for open, cancel, and save.

One more thing: while the zoom is active the source button is gone from the accessibility tree, so a test that asks for its frame with the sheet up fails.

## Where it stands

All three paths are verified frame by frame on iPhone. The iPad edit popover's ✓ carries the same source, but has not been captured there yet.
