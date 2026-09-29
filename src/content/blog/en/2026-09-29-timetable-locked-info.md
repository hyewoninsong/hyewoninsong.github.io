---
title: "Tapping a class on a locked timetable now shows its notes"
date: 2026-09-29T14:39:06+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "SuperTimetable opens locked, so most of the time you are just looking. Tapping a class used to show only its start and end time. Now a card slides up with its color, title, day and time, alerts, and notes."
---

SuperTimetable opens a timetable locked so you can't drag a class by accident, which means most of your time in the app is spent looking at a locked grid. Until now, tapping a class there only lifted the block and showed its start and end time. To read the note you wrote or check when the alert fires, you had to unlock and open the editor.

## A card slides up from the bottom

Tap a class while locked and a glass card rises from the bottom of the screen, in the same place and style as the card in Find Free Time.

| Row | What it shows |
|---|---|
| Top | Color dot · title |
| Second | Weekday and start–end time ("Monday · 9:00 – 10:00") |
| Alerts | One line per alert that's on, e.g. "15 minutes before" and the sound |
| Notes | The whole note, scrolling inside its box when it's long |

Rows with nothing in them are left out entirely, so a class with no alerts or notes doesn't turn into a list of "None". Tap empty space, scroll the grid, or unlock, and the card goes away, the same rules as before.

![Two alert rows above the notes box. Only the box is tinted a shade darker, with a scroll bar on the right.](/blog/timetable-locked-info/memo-box.png)

## Notes get their own tinted box

Notes are capped at 110 points: a short note takes only its own height, and a long one scrolls within that height, so the card never hides too much of the grid. At first the notes sat on the card's own surface, and scrolling made the middle of the card appear to slide with no visible edge. Putting the notes in a slightly darker inset box (`tertiarySystemFill`, with corners concentric to the card) makes it clear that only the text inside the box moves.

## Why a bottom card

- **A bubble next to the block** would cover neighboring classes when the note is long, and it has to be pushed back from the screen edge for the rightmost day or the latest hour.
- **A sheet** covers almost the whole grid and adds a step to close it, which gets in the way of tapping through several classes in a row.
- **A bottom card** keeps the grid visible. Tapping another class just swaps its contents, and it's the same pattern the app already uses in Find Free Time.

## What's left

This hasn't been checked on a wide iPad window yet. Because the card sits over the bottom of the grid, an evening class can end up hidden behind it. If that turns out to be a real problem, the first fix to try is scrolling the tapped block into view.
