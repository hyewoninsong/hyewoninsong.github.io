---
title: "The Android edit sheet was vanishing in a single frame"
date: 2026-10-14T04:45:27+09:00
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
| Opening | About 0.3 s | About 0.4 s, no overshoot |

The first row was the worst. The save button wrote the change and then cleared the state that mounts the sheet. A `ModalBottomSheet` that leaves the composition has its window removed on the spot; the exit animation only runs when the sheet closes itself. Every path closed the sheet, so every test passed.

Now the save happens first and the state is cleared after the sheet has slid away. A second tap on the way down is ignored, and the scrim fades on the same curve.

## No speed setting, so we place the sheet ourselves

The plan was to swap the theme's motion scheme around the sheet. The class is in the library file, but in material3 1.4.0 it is internal and the compiler refuses it.

What we do instead: while the sheet is entering or leaving, we decide where it is. The library exposes where it currently has the sheet, so we shift it by "where our curve says, minus where the library put it". The library's quick motion cancels out exactly. Once the sheet is up we let go, and dragging and swiping are the library's again.

What lost:

- **Reflection on the hidden speed fields.** Works in debug, silently does nothing in a minified release.
- **Shifting at draw time only.** Cheaper, but position callbacks inside the sheet do not fire again, so the style popover anchored to the colour circle opens where the circle was mid-rise.
- **Writing our own sheet.** Keyboard, predictive back and nested scrolling, all redone for two springs.

Both springs are critically damped. They started at 0.55 in and 0.45 out; after measuring the iPhone sheet both became 0.35 (last section). A sheet that overshoots lifts off the bottom edge.

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

The motion and cards started on the edit sheet alone and reached Settings, Timetable Settings and the timetable list the same day (section below). Sheets with a preview, like share and print, moved over later (last section). And because the placement leans on how the library positions the sheet, each library upgrade gets a screen recording stepped frame by frame. A screenshot of the settled sheet shows none of these problems.

## 2026-10-14 — Settings, Timetable Settings and the list became the same sheet

With only the edit sheet changed, the three sheets beside it looked like another app. All three now share the grey ground, the white cards and the same rise and exit.

![The Settings sheet: white cards on a grey ground, appearance and time format as capsule chips beside their labels, green switches](/blog/timetable-android-edit-sheet/settings-grouped.png)

Choices used to take two lines each: a label, then a full-width segmented button. Now the chips sit beside the label on one row, and only the picked chip is filled. Chip width is fixed at the bold width, so picking one never nudges its neighbours.

### One switch instead of a second set of components

The share, print and calendar sheets use the same cards and rows, and at that point they were still on a white ground where a white card has no edge. So the components were not copied. One value says "this content is on the grey ground"; the cards, dividers, titles, choice rows and header read it and pick their look. No call site changed.

### A sheet that stops half way cannot aim for "fully open"

Timetable Settings opens at half height so the timetable behind stays visible. The placement trick assumed the resting place was the fully open one, which would have made the sheet rise all the way and then drop.

![Timetable Settings pulled up to full height, the end-time capsule in blue and its wheel open inside the card](/blog/timetable-android-edit-sheet/timetable-settings-wheel.png)

Rising now aims for the stop the library is heading to; leaving starts from wherever the sheet stands.

### The buttons are still there for 0.4 s

A sheet that slides away instead of vanishing leaves its buttons on screen. In Timetable Settings the X means "revert everything", so an X right after the ✓ would undo what was just confirmed. A sheet on its way out now ignores a second ✓, a late X and a type switch.

### List cards lost their face

![The timetable list: the name centred on the grey ground, the preview below with a thick black outline and a check badge](/blog/timetable-android-edit-sheet/list-cards.png)

The name stands on the ground and only the preview has an outline and a soft shadow. The open timetable's ring and check are ink, not blue: blue already means "tappable", so "this one" needed another colour.

The Settings header was reversed once: it first kept the app's "close at the top left" rule, but Settings applies live and has nothing to cancel, so it now has a single ✓ at the right, as on iOS. Dark mode and the period rules card were not checked on a device this time.

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

## 2026-10-14 — Image export, print and calendar export moved over too

Three sheets on the ⋯ menu were left. They now share the grey ground, the white cards, the capsule chips and the same rise and exit.

![The old image export sheet: the preview is a small thumbnail in the middle of the stage](/blog/timetable-android-edit-sheet/export-share-before.png)

![The new image export sheet: the preview fills the width and four chip rows sit in one card on the panel](/blog/timetable-android-edit-sheet/export-share-after.png)

Image export and print have a preview on top and an options panel below. The stage under the preview is one step darker than the panel, so in both themes a lighter sheet floats above. Print's single card became the two the iPhone has: the page (paper, orientation, size, copies per page) and the picture (time format, appearance, text colour, black and white, title).

![The print sheet: four timetables on a landscape A5 page, the "4" chip picked with a blue ring](/blog/timetable-android-edit-sheet/export-print.png)

Calendar export has no preview, so it is a plain form like Settings: grey capsules for dates, capsule chips for the end presets.

![The calendar export sheet: period, schedules and destination as titled white cards](/blog/timetable-android-edit-sheet/export-calendar.png)

### The panel is not glass

On iPhone the panel is translucent and blurs the timetable behind it. Android has no good way to blur what is behind a view, and translucency without blur lets the grid lines run sharply between the option labels. So the panel is opaque, and each card gets a hairline border so its edge reads even though panel and card are close in brightness.

The panel colour has to reach the bottom gesture strip. Painting the whole sheet in the stage colour left a dark band under the panel; the sheet is now the panel colour, and the grabber and title bar paint the stage colour themselves.

### `fillMaxWidth` does not enlarge the picture

The old preview was about 40% of the width, although the code said `fillMaxWidth()`. `Image` defaults to `ContentScale.Fit`, and inside a vertically scrolling column there is no height limit, so the box becomes "screen width by the bitmap's pixel height" and the picture stays at pixel size. The preview bitmap was rendered at one pixel per dp, which is 40% of a 2.6-density screen.

The fix is `ContentScale.FillWidth` plus rendering the preview at device density, as the export already did. The layout values looked right the whole time; only a screenshot showed it.

The lock-screen wallpaper and free-time sheets still have the old look. They share the panel component, which only draws the new look inside a grey-ground sheet.

## 2026-10-14 — We measured the iPhone sheet frame by frame and matched it

The first speed was picked by eye. Next to the iPhone the Android sheet now looked slow, and measured it was 1.6 times slower. Both directions now use the iPhone sheet's spring.

### There was no number in the iOS code

The iPhone edit sheet is the plain system sheet with no animation of its own, so no spring value exists to copy. The original 0.55 was chosen as "slower than Android's default", never against iOS.

So we measured: a tiny app that raises and lowers a system sheet on a timer, a simulator screen recording, the row of the sheet's top edge read from every frame, and a spring fitted to that track.

| | 90% there | 99% there | Fitted spring |
|---|---|---|---|
| iPhone, rising (4 runs) | 0.20 - 0.21 s | 0.36 s | no overshoot, 0.34 - 0.36 |
| iPhone, leaving (4 runs) | 0.20 - 0.21 s | 0.35 s | no overshoot, 0.34 - 0.35 |
| Android, before | 0.34 s | 0.58 s | no overshoot, 0.55 |
| Android, now | 0.21 s | 0.37 s | no overshoot, 0.35 |

All eight runs fit within 0.4%. Half of the "slow" feeling was the tail: the old spring crept the last 20 pixels for 0.3 s. Tightening the spring shortened the tail with it.

### What tripped up the measuring

- Cropping a 1-pixel column from the recording gives width 0, because the video stores colour once per two pixels. Convert the pixel format first.
- The simulator recording only keeps frames when the screen changes. Read each frame's timestamp instead of assuming 60 per second.
- The first moving frame is not the start; the sheet is already 4% up in it. Fit the start time too.
- The Android emulator could not confirm the curve. Headless, it keeps about ten frames per transition, and a fit on that lands anywhere from 0.33 to 0.65. The emulator recording only shows that the sheet glides and lands without a jump; the spring value is pinned by a test, and the side-by-side on a device is done by eye.

## History

- 2026-10-14 — Edit sheet: fixed the one-frame exit, grey ground and white cards
- 2026-10-14 — Extended to Settings, Timetable Settings and the timetable list; half-height stop
- 2026-10-14 — Style popover dropping back to the palette on touch, the selection ring that never showed, the popover's look, the sliding day capsule.
- 2026-10-14 — Extended to image export, print and calendar export; opaque panel; the preview that drew too small.
- 2026-10-14 — Measured the iPhone system sheet frame by frame and matched its speed: 0.35 both ways (was 0.55 / 0.45).
