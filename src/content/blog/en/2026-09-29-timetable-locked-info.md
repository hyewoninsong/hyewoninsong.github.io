---
title: "Tapping a class on a locked timetable now shows its notes"
date: 2026-10-04T00:09:43+09:00
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

## 2026-10-03 — No more time pills, and a copy button

Once the card showed the day and time, the start and end time pills that popped up above and below the tapped block were just repeating it, and covering the neighboring classes while they did. Those pills exist to show where a block will land while you drag it; on a locked grid nothing moves. So a locked tap now only outlines the block, and the time lives in the card. The pills still appear when you drag or draw a class.

In their place, the card has a round copy button next to the title. One tap puts this on the clipboard:

```
Art
Tuesday · 2:00 – 3:10 PM
```

The note follows as a third line if there is one, and period timetables add the period after the day. It's the same string as the card's second line, so what you paste matches what you saw. Alerts are left out; when you get reminded isn't something the other person needs. The icon turns into a checkmark for 1.5 seconds with a light haptic, the same as the copy button in Find Free Time.

![A locked grid with the Art block selected. No time pills around the block; the card's button at the right shows a checkmark.](/blog/timetable-locked-info/copy-button.png)

## What's left

This hasn't been checked on a wide iPad window yet. Because the card sits over the bottom of the grid, an evening class can end up hidden behind it. If that turns out to be a real problem, the first fix to try is scrolling the tapped block into view.

## History

- 2026-09-29 — Info card for locked taps, tinted notes box, day and time line
- 2026-10-03 — Time pills removed from locked taps, copy button on the card
