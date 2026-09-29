---
title: "A class-period axis for the timetable — real times underneath, period rows on screen"
date: 2026-09-29T16:47:49+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "When you create a timetable you now pick time-based or period-based. Period timetables stack equal-height rows for Period 1, 2, … and events snap to them as you drag."
---

School timetables are read as "Period 2", not "10:00". New timetables now start with a choice: **by time** or **by period**. Pick periods and the left axis becomes class-period rows.

## You set the periods; the rows stack at equal height

A new period timetable opens straight into the period editor. The default is seven 50-minute periods with 10-minute breaks and an hour for lunch. Drag periods or set exact start and end times (see the evening update below), add or remove periods — the only rule is that each period starts after the previous one ends.

![Period axis grid — seven equal rows, one event spanning periods 2–3 on Monday](/blog/timetable-period-axis/period-grid.png)

Each period is one equal-height row labeled with its name and times. Long-press and drag to create an event as before; it snaps to period boundaries. Dragging across periods 2–3 above saves an event from 10:00 to 11:50. Moving and resizing work in whole periods.

## Why equal rows, and why whole periods only

Drawing to real scale leaves thin break stripes between every row and blurs the one thing you want to read: what's in which period. Equal rows read like a paper timetable. And people who choose periods rarely start something mid-period, so snapping to whole periods saves fiddling; the minute-level time wheel is off for these timetables.

## Real times stored, virtual times drawn

Storing "Period 2" would have forced alarms, calendar export and widgets to learn about periods. Instead events keep real times, and **only the grid draws period i as a virtual hour i**. That virtual grid is an ordinary hour grid with 60-minute snapping, so dragging, snapping, overlap checks and the now-line needed no changes. The work moved to the boundary: events leaving the grid convert back to real times, previews coming from editors convert in, and a boundary means "start of the next period" or "end of the previous one" depending on its role. Visible times are converted back too, so you never see a fake "01:00".

The same mapping keeps events attached when you edit periods: shift Period 2 to 10:10 and its events move with it. Only events in removed periods are deleted, after a confirmation.

## What's next

Shared images, printing and widgets still draw a clock-time axis. They're correct, just not in period rows yet.

## Update, Sep 29 — periods you drag like events

Early feedback: the time-or-period choice was text only, unlocked period rows were too short to drag comfortably, and setting fourteen times with wheels was tedious.

![New timetable sheet — two "vertical axis" cards, one with clock ticks, one with Period 1–3 rows; period is selected](/blog/timetable-period-axis/new-timetable-kind-cards.png)

**The choice now shows the axis.** New timetables open in a small sheet with a name field and two radio cards. Each card draws a miniature of the real grid axis with one event on it — off the ticks for clock time, flush with a row for periods.

![Period editor — a vertical day timeline with seven period blocks on the left, the seventh selected and stretched to 17:15; start and end fields on the right](/blog/timetable-period-axis/period-editor-drag.png)

**The period editor is one day column.** Drag a block's middle to move it, its top or bottom edge to change its start or end. Drags snap to 5 minutes and, in this version, stopped at the neighboring periods (the afternoon update makes later periods shift instead), so a drag can never reorder or overlap them. Exact times were on the right — that list is gone as of the afternoon update. This version's timeline didn't scroll (scrolling and dragging would fight over the same finger; the evening update changes that), and its scale is frozen while you drag so the block stays under your finger.

![Unlocked period grid — rows 1.5x taller than when locked](/blog/timetable-period-axis/unlocked-period-rows.png)

**Unlocking zooms period rows too**, 72pt to 108pt on iPhone, while snapping stays at whole periods.

One bug on the way: blocks selected but wouldn't drag. A tap gesture attached inside a drag gesture claimed the touch first. A single `DragGesture(minimumDistance: 0)` now handles both.

## Update, Sep 29 afternoon — tap a period to edit it; later periods follow

The feedback on the morning version was blunt: setting periods was too hard, and the first period screen should also ask for days.

Three things made it hard. Seven periods meant fourteen time fields, while a real school day is a few rules ("9:00 start, 50-minute classes, 10-minute breaks"). Editing one period got blocked by its neighbors. And the timeline was 140pt wide, too narrow for labels.

**Wide timeline, one period at a time.** The per-period list is gone. The timeline spans the sheet, so every block reads "Period 2 · 10:00–10:50 · 50 min". Tap a block and the card below edits just that period: start time, length (− 50 min +), and the break after it (− 10 min +), in 5-minute steps (as of the evening update: start and end time only, shown only when a period is selected). The card keeps the same height whether or not anything is selected, so the timeline above never rescales.

**Later periods shift along, keeping their breaks.** Lengthen Period 2 by ten minutes and Periods 3–7 move ten minutes later. Dragging follows the same rule: moving a block moves it and everything after it, and stretching its bottom edge pushes the rest down. Edits stop only at the previous period's end and at midnight. Only the top-edge drag stays local, so a period you didn't touch never moves earlier.

**What lost.** The first proposal was a rule form (first start, length, break, count, lunch) that generates all periods at once. Tapping visible blocks won: it's the same grammar as the rest of the grid, and with rippling, the rule form's shortcut is only a few taps away.

**Days on first setup.** Time-based timetables open a display sheet with days right after creation. Period timetables showed the period editor instead, which skipped days entirely. The first period editor now has the same days card at the top, shared with the display sheet. Later edits show periods only.

## Update, Sep 29 evening — a tall scrolling timeline, and a card only when you pick a period

Four requests: make the timeline tall and scrollable, show the card only when a period is selected, drop the break row, and enter an end time instead of a length — while still showing how long the period is.

![Period editor — Period 2 selected with top and bottom handles; the card below shows start 10:00 AM, end 10:50 AM, and "50 min" next to the end time](/blog/timetable-period-axis/period-editor-selected.png)

**Tall timeline.** One minute is now a fixed 1.4pt, so a 50-minute period is 70pt and the day scrolls. **The card slides up only when you tap a period** and goes away when you tap empty space. It has two rows, start time and end time, with the length ("50 min", "1h 20m") next to the end time. End time wins because that's what the school's printed timetable says. Later periods still shift along, and breaks are set by dragging on the timeline.

**Scrolling vs. dragging, split by selection.** Unselected blocks only take a tap, so swiping over them scrolls. Only the selected block carries a `DragGesture(minimumDistance: 0)`, so a touch that starts on it drags immediately. The alternative, a drag on every block via `simultaneousGesture`, would turn one swipe into both a scroll and a move. The cost: tap once before dragging an unselected period. When the card appears and shrinks the viewport, the timeline scrolls so the selected block stays visible.

Still missing: auto-scroll while dragging a block past the edge.

## History

- Sep 29, early — period axis introduced
- Sep 29, morning — axis previews in the type picker, drag-to-edit periods, unlock zoom
- Sep 29, afternoon — wide timeline with a tap-to-edit card, later periods shift along, days on first setup
- Sep 29, evening — tall scrolling timeline, drag only the selected block, card on selection with start/end times
