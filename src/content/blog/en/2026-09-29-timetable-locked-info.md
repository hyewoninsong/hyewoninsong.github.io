---
title: "Tapping a class on a locked timetable now shows its notes"
date: 2026-10-06T02:45:16+09:00
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

## 2026-10-06 — If the card would cover what you tapped, it moves up

The problem flagged under "What's left" got reported for real: tap a class near the bottom of the screen and the card landed on top of the class you had just selected.

The card now has two homes. It stays at the bottom by default and moves to just under the weekday row **only when it would cover the selected block**. Tap a class near the top, then one near the bottom, and the card swaps its content while sliding up. The green-slot card in Find Free Time follows the same rule.

![A locked grid with a late-afternoon block selected. The card sits under the weekday row instead of at the bottom, and the selected block stays fully visible.](/blog/timetable-locked-info/card-above-block.png)

The original plan was to scroll the grid so the block cleared the card. Two things stopped it: on a locked grid, scrolling is what dismisses the card, so the app would close its own card; and short timetables are fitted to the screen with nothing to scroll. A simpler "bottom half of the screen means top" rule moved the card even when nothing was covered.

Knowing whether the card covers the block needs the card's height, and that varies — a note more than doubles it. Measuring after the first render means one frame in the wrong place. So the decision lives inside a SwiftUI `Layout`: `placeSubviews` asks the card for its size with `sizeThatFits`, checks whether the bottom position overlaps the block vertically (with an 8pt gap), and places it. Measuring and placing happen in the same pass. A block tall enough to be covered either way keeps the card on the side that covers less.

The block's position is captured once, at the tap. The Find Free Time grid scrolls with the card open, and re-measuring would make the card hop every time the block passed under it.

![Find Free Time with a slot selected that runs from late morning to evening. The card sits under the weekday row rather than above the options panel.](/blog/timetable-locked-info/free-time-card-above.png)

## What's left

This hasn't been checked on a wide iPad window yet. The card still hides an hour or two of the grid — just not the class you tapped. In the Find Free Time list view the card always sits above the panel.

## History

- 2026-09-29 — Info card for locked taps, tinted notes box, day and time line
- 2026-10-03 — Time pills removed from locked taps, copy button on the card
- 2026-10-06 — Card moves under the weekday row when it would cover the selection (Find Free Time card too)
