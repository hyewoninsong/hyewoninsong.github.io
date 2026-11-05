---
title: "The SuperPDF icon is the SuperTimetable icon laid on its side — five underlines, each a different length"
date: 2026-11-05T18:27:39+09:00
app: "superpdf"
tags: ["devlog", "design"]
summary: "The page-with-mind-map icon is gone. The timetable app's five hanging bars are now five underlines, left-aligned, in the same five colours. The timetable hangs; the PDF draws."
---

SuperPDF has a new home-screen icon: five underlines in red, orange, yellow, green and blue, starting at the left edge and ending wherever each one ends.
If you know the SuperTimetable icon you will recognise it at once. It is the same five bars, turned on their side.

## The timetable hangs, the PDF draws

![Left to right: the SuperTimetable icon, the old SuperPDF icon with a page and mind map, the new SuperPDF icon with five underlines](/blog/superpdf-icon-underlines/timetable-old-new.png)

SuperTimetable's icon hangs five bars from five pegs, each a different length, the way a week's classes run to different hours.
SuperPDF lays those bars flat. They start together at the left and stop at different points on the right, because an underline is as long as the words under it. The pegs are gone; underlines have no pegs.

| | SuperTimetable | SuperPDF |
|---|---|---|
| Bars | vertical, hanging from the top | horizontal, left-aligned |
| Colours | red, orange, yellow, green, blue (iOS system) | same |
| Thickness, pitch | 141, 180 on a 1024 canvas | same |
| Length ratio | 441 : 561 : 361 : 621 : 501 | same, scaled so the longest reaches the far margin |
| Pegs | yes | no |

The numbers come straight from the timetable app's icon script. Side by side, the two icons read as one family, and the one change of direction says what each app does.

## At 60pt the old icon was three dots

The old icon was a folded page, one yellow underline and three mind-map dots branching from it. At 1024 it told the whole story. At 60pt the page was a grey square, the underline vanished and only the dots were left.
The mind map had already stepped back to an advanced feature inside the app, so the icon had no reason to lead with it.

Five underlines are still five at 60pt. The rule now: judge an icon on a contact sheet at 256, 120 and 60pt with the iOS corner mask, not on the 1024 render.

## Hand-drawn strokes, not rounded boxes

![Top row: hand-drawn strokes. Bottom row: rounded boxes like the timetable icon. Each at 256, 120 and 60pt](/blog/superpdf-icon-underlines/drawn-vs-flat-sizes.png)

Two candidates. The bottom row is the timetable bar on its side, corner radius 48. The top row has round ends and a gentle bow through the middle.
The box reads as a bar chart; the stroke reads as a marker underline, and the underlines inside the app are drawn with a hand-drawn wobble too, so the icon followed.

The first stroke wobbled too much: 8pt of sway and 5% thickness change looked like worms at 1024. Halved to a 4pt bow, 1.2pt ripple and 2% thickness. Visible at 1024, straight from 120pt down.

## What's left

No Icon Composer layered icon yet. It is one 1024 bitmap, rendered from a script; the rounded-box variant stays in the script.
