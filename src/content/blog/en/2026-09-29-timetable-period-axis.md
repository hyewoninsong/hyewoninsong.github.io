---
title: "A class-period axis for the timetable — real times underneath, period rows on screen"
date: 2026-09-29T03:04:38+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "When you create a timetable you now pick time-based or period-based. Period timetables stack equal-height rows for Period 1, 2, … and events snap to them as you drag."
---

School timetables are read as "Period 2", not "10:00". New timetables now start with a choice: **by time** or **by period**. Pick periods and the left axis becomes class-period rows.

## You set the periods; the rows stack at equal height

A new period timetable opens straight into the period editor. The default is seven 50-minute periods with 10-minute breaks and an hour for lunch. Change any start or end time, add or remove periods — the only rule is that each period starts after the previous one ends.

![Period axis grid — seven equal rows, one event spanning periods 2–3 on Monday](/blog/timetable-period-axis/period-grid.png)

Each period is one equal-height row labeled with its name and times. Long-press and drag to create an event as before; it snaps to period boundaries. Dragging across periods 2–3 above saves an event from 10:00 to 11:50. Moving and resizing work in whole periods.

## Why equal rows, and why whole periods only

Drawing to real scale leaves thin break stripes between every row and blurs the one thing you want to read: what's in which period. Equal rows read like a paper timetable. And people who choose periods rarely start something mid-period, so snapping to whole periods saves fiddling; the minute-level time wheel is off for these timetables.

## Real times stored, virtual times drawn

Storing "Period 2" would have forced alarms, calendar export and widgets to learn about periods. Instead events keep real times, and **only the grid draws period i as a virtual hour i**. That virtual grid is an ordinary hour grid with 60-minute snapping, so dragging, snapping, overlap checks and the now-line needed no changes. The work moved to the boundary: events leaving the grid convert back to real times, previews coming from editors convert in, and a boundary means "start of the next period" or "end of the previous one" depending on its role. Visible times are converted back too, so you never see a fake "01:00".

The same mapping keeps events attached when you edit periods: shift Period 2 to 10:10 and its events move with it. Only events in removed periods are deleted, after a confirmation.

## What's next

Shared images, printing and widgets still draw a clock-time axis. They're correct, just not in period rows yet.
