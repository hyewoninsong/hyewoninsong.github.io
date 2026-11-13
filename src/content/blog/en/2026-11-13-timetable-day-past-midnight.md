---
title: "A day doesn't have to end at midnight — stretching the timetable into the next morning"
date: 2026-11-13T14:59:03+09:00
app: "timetable"
tags: ["devlog", "data", "design"]
summary: "A timetable's day can now run from 2 AM to 2 AM the next day. The whole problem was which weekday an after-midnight event belongs to."
---

For someone who works nights, Monday ends at 2 AM on Tuesday. Until now a timetable's day had to sit between 0:00 and 24:00, so those two hours were stranded at the top of the Tuesday column. The end time can now be set to the next morning.

## The end-time wheel keeps going past 24:00

Scroll the end-time wheel below 24:00 and it continues with "Next day 01:00". With a start of 02:00 and an end of next-day 02:00, the Monday column holds Monday 2 AM through Tuesday 2 AM.

![Timetable settings with the end time set to next-day 02:00](/blog/timetable-day-past-midnight/end-wheel-next-day.png)

There is one rule: a day can't be longer than 24 hours. If two neighbouring days overlapped, 2:30 AM would belong to both Monday and Tuesday. A 25-hour range is struck through and can't be saved.

![An end time marked invalid because the day would be 25 hours](/blog/timetable-day-past-midnight/over-24-hours.png)

The grid simply continues below the 24:00 line. The axis reads 01:00, not 25:00.

![The grid continuing with 01:00 and 02:00 rows below 24:00](/blog/timetable-day-past-midnight/grid-after-midnight.png)

## Is a 1 AM event Monday's or Tuesday's?

The hard part was storage. We store it as "Monday, 25:00": the weekday stays Monday and the time is 1500 minutes from midnight, a number larger than a day.

The alternative was to store Tuesday 01:00 and pull it into the Monday column only when drawing. That can't represent a single event from Monday 23:00 to Tuesday 01:00 without splitting it, and every drag, resize and overlap check, all of which think in "up and down within one column", would need a weekday conversion.

Writing 25:00 on the axis lost too. The 12-hour format has no equivalent, and alarms and calendar export use real clock times anyway. The clock is shown one way everywhere; only the places where you pick a value say "Next day".

![Editing an event created after midnight — the end reads next-day 00:30](/blog/timetable-day-past-midnight/edit-sheet-next-day.png)

## Three places where the column and the real date disagree

| Place | If left column-based | What we did |
|---|---|---|
| Today highlight and now line | At 1:30 AM Tuesday the Tuesday column lights up and the line is off the grid | If the day runs past 24:00 and now falls in that overflow, it is yesterday's column at 25:30 |
| Calendar export | Start date is Tuesday but the repeat rule says Monday | Events that start after midnight are exported on their real weekday |
| Time wheel | The wheel only has 0–23 | A picked time that falls outside the day is read as its next-day value |

Alarms needed no change: the "minutes before start" maths already handled crossing a day boundary with one division, and it works forwards as well. Widgets now recompute "today" at the moment the day rolls over, which is 2 AM for a day ending at 26:00.

## Events left outside a moved range are deleted, not moved

Changing 0–24 to 2–26 leaves a Monday 1 AM event outside the day. We could have moved it to "Sunday, 25:00", but that puts an event on a weekday the user never chose. The existing confirmation ("1 event outside the range will be deleted") is the honest option.

## Where it stands

iOS and Android share the same storage rule. Period-based timetables still stay within one day. Settings, the grid and the edit sheet were checked in the simulator; the today highlight at real early-morning hours, the widget rollover and the watch still need a device.
