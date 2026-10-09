---
title: "The confirm button grows into the confirm sheet — except when you save"
date: 2026-10-09T20:10:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The batch-change sheet now zooms out of the ✓ button and shrinks back into it on cancel. The system zoom transition is two lines; the save path left a lone ✓ floating over the grid. Later the same day: the before block was also changing colour on that path."
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

## Later on 2026-10-09 — "Change all" turned the before block into the after block

With the blocks now large, something else showed. Tap "Change all" and, while the sheet slides down, the before block takes on the after colour and title. "This one only" was fine.

Dismissing only starts the animation. The sheet's content stays on screen until it finishes and redraws whenever a `@State` it reads changes. "Change all" saved, then updated the "original style" variable to the style just saved — reasonable, since that variable is the baseline for change detection. But the before block was drawing that same variable. One of the two uses must move on save; the other must not.

The before block now draws its own copy, taken the moment ✓ is tapped. The baseline can change whenever it likes. Deleting the baseline update would also have fixed it today, but the picture would still be reading the baseline. A timer that delays the update until after the dismissal was not considered a fix.

That line had been there for six months. The save tests checked what got written, and the frame-by-frame review of the zoom looked only for the stray ✓. When a button saves and dismisses, compare the state it writes with the state the closing view draws. This fix is pinned by a source-contract test; the dismissal was not re-recorded.

## History

- 2026-10-09 evening — zoom from the ✓, toolbar X, before/after blocks fill the remaining height
- 2026-10-09 night — the before block keeps the before style while the sheet closes on save
