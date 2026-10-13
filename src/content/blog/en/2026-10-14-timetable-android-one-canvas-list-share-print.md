---
title: "The Android timetable list now draws the same picture as the share image"
date: 2026-10-14T01:50:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "The Android app drew a timetable three different ways: the grid, the list preview, and share and print each had their own line colour and text weight. Like the iPhone app, it now has two: one grid and one export canvas."
---

In SuperTimetable for Android, the same timetable looked slightly different on each screen. The grid and the list card used different greys for their lines, and the share image had fainter hour labels than the grid. Now what you see in the list is what gets shared and printed, and the grid uses the iPhone app's line weights and text.

## The iPhone app has only two looks

| Where | Drawn with | Lines | Text |
|---|---|---|---|
| Editing grid | Grid-only colours (ground, stripe, gutter) | Hour 1pt, half-hour 0.75pt, day 0.5pt, translucent separator | Black, medium |
| List card, share, print | One export canvas | 1pt both ways, neutral grey | Black, medium |

The list preview is not a shrunken grid. It is the share canvas without its title row, drawn on the card's face. Android had a third renderer: the list card drew its own miniature with Material outline colours, small grey text and a pinned day row.

## The grid takes the numbers as they are

![Android grid with day hairlines running through the header and today in a blue capsule](/blog/timetable-android-one-canvas-list-share-print/grid-header.png)

- The line under the day row went from 1dp to 0.5dp, and the day separators now run up through the row.
- Today's day sits in a filled capsule with white text.
- Hour labels are black and medium weight with tabular digits (`tnum`), not grey and regular.
- Half-hour lines appear only while editing. Locking the grid fades them out with the stripes.

The text is pure black and white, not Material's `onSurface`. The rest of the app keeps its Material scheme.

## The list draws the canvas itself

![List card showing the timetable with the same lines and text as the share image](/blog/timetable-android-one-canvas-list-share-print/list-preview.png)

The miniature is gone. The list scales the export canvas to the card width, and the canvas now uses the iPhone palette: 1-unit neutral grey lines, three-line period labels, a centred title on the share image.

Three alternatives lost:

- **Recolour the miniature.** It would match today and drift the next time the canvas changes.
- **Keep borrowing the grid's colours for the canvas.** That was the original mismatch: the grid's line is translucent ink over stripes, the canvas line is grey on white paper.
- **Rasterise and cache it like iOS.** iOS caches because its offscreen render blocks the main thread. Android can call the same drawing code straight into the on-screen canvas, so there is no cache to go stale.

A timetable shorter than the card grows its rows to fill it. The text stays the same size.

## Still different

The 12-hour hour labels still read differently from the iPhone app, and the list preview has no alarm marks yet.
