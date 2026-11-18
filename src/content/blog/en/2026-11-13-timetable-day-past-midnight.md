---
title: "A day doesn't have to end at midnight — stretching the timetable into the next morning"
date: 2026-11-18T17:13:41+09:00
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

## 2026-11-18 — A day can also start the evening before

The opposite request came five days later: let the start time go before midnight, as far back as noon the previous day. The start wheel now climbs above 00:00 to "Previous day 23:00" … "Previous day 12:00", and the end wheel stops at "Next day 12:00". The 24-hour rule stays — a full 48-hour window would put the same moment in two columns.

![A Tuesday column starting at 18:00 the evening before, with an evening event above midnight and one crossing it](/blog/timetable-day-past-midnight/grid-previous-evening.png)

Storage mirrors the earlier change: an 8 PM event the evening before Tuesday is stored on Tuesday at **−240 minutes**. Storing it as Monday 20:00 and pulling it into Tuesday's column lost for the same reason as before — an event crossing midnight would have to be split. And the weekday matters: prep for a Tuesday class belongs in the Tuesday column.

Negative minutes exposed one trap: Swift's `/` and `%` truncate toward zero, so −90 minutes became −1 hour and −30 minutes. Hours, minutes, snapping and date assembly now use floor division (−90 → −2 h 30 → 22:30 on the clock). "Now" takes the start hour too, and widgets roll over to the next day at the start time instead of midnight.

The end wheel now stops at noon the next day (36:00) instead of 47:00. Timetables saved later than that in the past five days still open as they were.

## History

- 2026-11-13 — end time can run into the next morning (up to 47:00)
- 2026-11-18 — start time can begin at noon the day before; end stops at noon the next day
