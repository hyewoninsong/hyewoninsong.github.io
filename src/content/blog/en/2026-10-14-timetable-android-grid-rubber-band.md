---
title: "On Android, the timetable now moves when you pull past the edge instead of stretching"
date: 2026-10-14T09:54:49+09:00
app: "timetable"
tags: ["devlog", "android", "gesture"]
summary: "Android stretched the grid at its scroll edge. In a timetable the height of a row is the time, so a stretched grid is a wrong picture. The grid now uses the iPhone rubber band, and the official Compose slot turned out not to work for a timetable that fits the screen."
---

Pull the SuperTimetable grid past its top or bottom on Android and the whole grid now follows your finger, then returns when you let go. Before, the content stretched: a one-hour class looked like seventy minutes for a moment.

## Stretching and moving say different things

Since Android 12 the default edge response is a stretch of the drawn content. That suits a list of text. In a timetable, row height is time, so blocks, titles and hour marks all got taller together. On Android 11 and below the same edge showed a glow, so there were two behaviours depending on the OS.

The iPhone app leaves the shape alone. It moves the grid as one piece and shows the background in the gap, following less the further you pull.

![The timetable at rest: 9:00 starts right under the weekday header](/blog/timetable-android-grid-rubber-band/grid-at-rest.png)

![Pulled down: the grid and hour marks come down unchanged, the weekday header stays](/blog/timetable-android-grid-rubber-band/grid-pulled-down.png)

| Action | Before | Now |
|---|---|---|
| Pull past the edge | Content stretches (glow on 11 and below) | Grid follows as one piece, less with distance |
| Let go | Stretch relaxes | Back in about half a second, no overshoot |
| Fling into the edge | Small stretch | One bounce past the edge |
| Timetable that fits the screen | Nothing | Pulls both ways |

The numbers are the ones the iPhone scroll view uses. For a finger `x` past the edge the grid moves `(1 − 1 / (x × 0.55 / d + 1)) × d`, where `d` is the viewport height. The way back is a critically damped spring with stiffness 100.

## Only the grid

- **Keep the system stretch.** Familiar, but it distorts the one screen where height is information, and it differs by OS version.
- **Rubber band everywhere.** Sheets and lists are close to system surfaces. Changing them too makes the whole app move unlike the platform.
- **No edge response.** A pull that gets no answer reads as a stuck scroll.

So it started with the grid, and settings sheets and lists of text still stretch. Two exceptions arrived the same day: the image export preview and the card preview in the timetable list, both pictures of the timetable (see the sections below).

## The official slot ignores content that fits

Compose has a slot for this: implement `OverscrollEffect` and pass it to `verticalScroll`. That was the first plan.

The locked timetable is drawn to fit the screen exactly, so there is nothing to scroll. A scroll container that can scroll neither way hands nothing to its `OverscrollEffect`. The rubber band would have been missing on the most common screen, where the iPhone still bounces.

A `NestedScrollConnection` around the container receives whatever the scroll leaves over in every case. Leftover becomes pull, a returning finger undoes the pull before the content scrolls, and a fling's leftover velocity becomes the single bounce. The system effect is turned off with `overscrollEffect = null`.

Two details mattered. The translation has to sit before the content's clip, or the clip stays behind and cuts the moved grid. And a scroll can end without a fling, for example when the unlock zoom disables scrolling mid-pull, so the grid is released whenever scrolling stops.

![Right after a fling reaches the top: the grid has gone past once and is on its way back](/blog/timetable-android-grid-rubber-band/fling-bounce.png)

## Where it stands

Slow pull, release and fling were checked frame by frame on an emulator. The auto-scroll while dragging a class does not pull the grid; only a finger's scroll does. A timetable taller than the screen and the feel on a real device are next.

## 2026-10-14 — The export preview gets the same rubber band, and the sheet only follows a pull that starts at the top

The "grid only" line moved within half a day. The preview in the image export sheet is the timetable itself, and it still stretched at its edges. It now uses the grid's rubber band: same curve, same spring back.

A scroll inside a sheet raises a question the grid never had. Is a finger dragging down at the top pulling the picture, or pulling the sheet?

| Drag | Response |
|---|---|
| Down, starting with the picture resting at its top | The sheet follows the finger and can be dismissed |
| Down, after scrolling reached the top in the same drag | The sheet stays, the picture pulls against resistance |
| Up at the bottom | The picture pulls |
| Fling into the top | The picture bounces once, the sheet does not move |

![A drag down that started at the top: the whole sheet comes down](/blog/timetable-android-grid-rubber-band/share-sheet-follows.png)

![Still dragging after the scroll reached the top: the sheet stays and only the picture comes down, leaving a gap above it](/blog/timetable-android-grid-rubber-band/share-preview-pulled.png)

What decides it is the state the drag **began** in, which is how an iPhone sheet with a scroll view behaves. Two alternatives lost.

- **Always hand a pull down at the top to the sheet (the Material default).** The sheet starts leaving in the middle of a scroll gesture, and a fast fling back to the top could close it.
- **Always rubber band; close only with the grabber or X.** The simplest rule, but the preview covers most of the sheet, and every other sheet closes by dragging its content down.

It is one condition added to the grid's `NestedScrollConnection`: remember on the first move whether the content was resting at its top, drop that flag once the drag scrolls or pulls the content, and while it holds leave downward leftover to the parent sheet. A fling's leftover velocity is consumed here, so it never reaches the sheet.

The same change fixed the print preview. Zoom and pan used to work only inside a rectangle the size of the paper, about a third of a phone screen with the options open. Now everything between the header and the options panel is the zoom area: the paper itself grows, shadow included, a pinch that starts on the margin works, and pan limits follow that area rather than the paper.

![The print preview at rest: the paper sits in the middle of the upper area](/blog/timetable-android-grid-rubber-band/print-at-rest.png)

![Zoomed in: the paper leaves its original rectangle and fills the upper area](/blog/timetable-android-grid-rubber-band/print-zoomed-stage.png)

## 2026-10-14 — The card preview in the timetable list follows too

The line moved once more. The timetable list is a row of cards you swipe sideways, and each card holds a drawing of that timetable, scrolling vertically when it is taller than the card. That drawing was still stretching at its edges. The grid, the export preview and this card are three pictures of the same timetable, and one of them answered a finger differently.

Now the drawing in the card moves whole past either edge and springs back. A short timetable that fits the card can be pulled both ways too, where before a pull got no answer at all.

![The timetable list at rest: the day row sits at the top of the card](/blog/timetable-android-grid-rubber-band/list-preview-at-rest.png)

![The drawing pulled down and held: only the picture moves, while the outline, the check badge and the name stay put](/blog/timetable-android-grid-rubber-band/list-preview-pulled-down.png)

Two choices:

- **Only the picture moves.** The card's outline and shadow, the check badge and the name stay where they are. Moving the whole card would read as dragging the page, which competes with the sideways swipe.
- **Both edges belong to the picture.** The export sheet hands a pull that starts at the top to the sheet. The list sheet does not close by dragging, so there is nothing to hand it to. Same component, that one condition off.

The title-only view of the same sheet is a plain list of names and keeps the system response. The rule is unchanged: a picture of the timetable gets the rubber band, everything else behaves like the platform.

Swiping to the next card mid-pull ends the vertical scroll without a fling, so the pull is released when the scroll reports it has stopped. The fitting case was checked on the emulator by holding the drag and capturing; flinging a long timetable into an edge is for the next test build.

## History

- 2026-10-14 — The grid's scroll edge goes from stretch to rubber band.
- 2026-10-14 — Rubber band in the image export preview; the sheet follows only a pull that starts at the top. The print preview zooms across the whole upper area.
- 2026-10-14 — Rubber band in the timetable list's card preview; only the picture moves, the card outline and check badge stay put.
