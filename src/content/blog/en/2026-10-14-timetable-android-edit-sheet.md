---
title: "The Android edit sheet was vanishing in a single frame"
date: 2026-10-14T03:20:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "Tapping the check mark did not slide the sheet away; it deleted it. The library has no setting for sheet speed, so we place the sheet ourselves, and brought its rows and colours in line with the iPhone sheet while there."
---

The sheet for creating or editing a class in SuperTimetable for Android came and went too fast to see. Its rows were tall, and the close / title / save row sat well below the top edge. It now moves at a speed the eye can follow and uses the same measurements as the iPhone sheet.

## "Too fast" was three different problems

| How it closes | Before | Now |
|---|---|---|
| Check mark, X, delete | No animation; gone in one frame | Slides down in about 0.4 s |
| Back, tap outside | About 0.15 s | About 0.4 s |
| Opening | About 0.3 s | About 0.5 s, no overshoot |

The first row was the worst. The save button wrote the change and then cleared the state that mounts the sheet. A `ModalBottomSheet` that leaves the composition has its window removed on the spot; the exit animation only runs when the sheet closes itself. Every path closed the sheet, so every test passed.

Now the save happens first and the state is cleared after the sheet has slid away. A second tap on the way down is ignored, and the scrim fades on the same curve.

## No speed setting, so we place the sheet ourselves

The plan was to swap the theme's motion scheme around the sheet. The class is in the library file, but in material3 1.4.0 it is internal and the compiler refuses it.

What we do instead: while the sheet is entering or leaving, we decide where it is. The library exposes where it currently has the sheet, so we shift it by "where our curve says, minus where the library put it". The library's quick motion cancels out exactly. Once the sheet is up we let go, and dragging and swiping are the library's again.

What lost:

- **Reflection on the hidden speed fields.** Works in debug, silently does nothing in a minified release.
- **Shifting at draw time only.** Cheaper, but position callbacks inside the sheet do not fire again, so the style popover anchored to the colour circle opens where the circle was mid-rise.
- **Writing our own sheet.** Keyboard, predictive back and nested scrolling, all redone for two springs.

Both springs are critically damped (0.55 in, 0.45 out). A sheet that overshoots lifts off the bottom edge.

## Grey ground, white cards, every row 52

![The edit sheet in light mode: X, title and check at the top of the colour banner, then day, start and end, alert, memo and delete as white cards on a grey ground](/blog/timetable-android-edit-sheet/sheet-light.png)

It used to be grey cards on a white sheet, the reverse of iPhone. Material's surface steps get darker as they rise from a white ground, so the iPhone pair went in as its own tokens.

- Start and end rows went from 72 to 52. Values sit in grey capsules of equal width.
- The header row's centre moved from 76 to 38 below the top edge.
- The selected day's capsule fills its cell.
- Delete is a card-coloured capsule with a red label.

Touch targets did not shrink: a capsule draws at 34 and still takes touches at 48.

![The same sheet in dark mode: a near-black ground with cards one step lighter](/blog/timetable-android-edit-sheet/sheet-dark.png)

## What is left

Only the edit sheet has the new motion and cards; settings and share sheets still have the old ones. And because the placement leans on how the library positions the sheet, each library upgrade gets a screen recording stepped frame by frame. A screenshot of the settled sheet shows none of these problems.
