---
title: "The Android edit sheet was vanishing in a single frame"
date: 2026-10-14T04:13:00+09:00
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

## 2026-10-14 — The colour popover closed the moment you touched it

With the sheet done, the style popover that opens from the colour circle was the one piece still in the old look. Going in to restyle it turned up something more urgent: on the screen for making your own colour, the editor fell back to the palette the instant a finger landed on the saturation square or the hue bar. A screen built for dragging could not be dragged.

The popover kept its state keyed on "the colour it was opened with". It also applies every pick to the sheet behind it at once, and the sheet hands its new colour straight back as that opening colour. So the popover's own output came back as the key to its own state: one touch changed the colour, the state was rebuilt, and a fresh state starts on the palette.

On the palette itself nothing looked wrong. It was rebuilt into the same palette with the right colour selected, so a tap-only check always passed. Another screen had been dodging this by pinning the colour before passing it in; the edit sheet had not. Rather than rely on every caller remembering, the popover now reads its opening colour once.

![The add-colour screen after dragging the round handle across the square: the editor is still open and the sheet header behind it has taken the new navy](/blog/timetable-android-edit-sheet/color-editor-drag.png)

The captures showed a second thing: picking a palette colour drew no selection mark. The code did draw a ring, larger (54) than the swatch (44). But a 54 request inside a 44 box is silently cut to 44, so the ring was drawn at swatch size and painted over by the fill. It had never been visible. A default-state screenshot cannot show a mark is missing; it has to be captured selected.

![The style popover on a grey ground: styles in use, a Basic / Custom segmented control, the bold and mist palettes, and a ring in its own colour around the chosen blue](/blog/timetable-android-edit-sheet/popover-ring.png)

The look now matches the sheet: the same grey ground, no line under the title, and one thumb sliding on a grey track instead of two outlined buttons with a check mark. Swipe the palette and the thumb follows your finger. The editor is one square, one vertical bar, and a hex card.

The day row changed too. Switching day used to fade the old cell out while the new one faded in, which read as two cells blinking. There is now a single grey capsule, and it slides from the old day to the new one in 0.25 s. A shorter fade lost: with two things changing in two places, the eye has nothing to follow.

Custom colours still scroll vertically rather than paging twenty at a time as on iPhone; paging would need edge-flipping for the reorder drag.

## History

- 2026-10-14 — Sheet rise and exit curves, grey ground and white cards.
- 2026-10-14 — Style popover dropping back to the palette on touch, the selection ring that never showed, the popover's look, the sliding day capsule.
