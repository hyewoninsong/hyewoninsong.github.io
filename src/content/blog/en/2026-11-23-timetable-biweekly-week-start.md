---
title: "An every-other-week Sat + Sun event lands on different days depending on where the week starts"
date: 2026-11-23T19:56:31+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
summary: "Exporting a whole calendar to Apple Calendar and .ics, the hard part was biweekly repeats. 'Every two weeks' reads the week boundary; iCalendar lets a rule carry that boundary, EventKit does not. So for Apple Calendar we write one event per weekday."
---

SuperTimetable now exports a whole calendar with its repeat rules, not just the week on screen. The part that took the longest was one rule: every other week. The same "biweekly Sat + Sun" event could land on different dates on the receiving side.

## "Every other week" reads the week boundary

A weekly repeat only needs weekdays. "Every two weeks" means one week on, one week off, so something has to say where a week begins.

Take a biweekly Sat + Sun event starting Saturday, January 3. With weeks starting on Monday, Saturday and Sunday are the last two days of the same week.

| Week (Mon–Sun) | On | Dates |
|---|---|---|
| 12/29 – 1/4 | yes | Sat 3, Sun 4 |
| 1/5 – 1/11 | no | |
| 1/12 – 1/18 | yes | Sat 17, Sun 18 |

With weeks starting on Sunday, that Sunday belongs to the next week, which is an off week.

| Week (Sun–Sat) | On | Dates |
|---|---|---|
| 12/28 – 1/3 | yes | Sat 3 |
| 1/4 – 1/10 | no | |
| 1/11 – 1/17 | yes | Sun 11, Sat 17 |

Saturdays stay put; Sundays slide a week. It only happens when the interval is two weeks or more and the event holds weekdays on both sides of the boundary. A single-weekday biweekly event is just "every 14 days from its first day".

## The standard puts the boundary inside the rule

This is defined behaviour in RFC 5545. A recurrence rule has a `WKST` part naming the first day of the week, defaulting to Monday, and the RFC says it matters exactly here: a weekly rule with an interval above 1 and weekdays listed. Its own example, starting Tuesday, August 5, 1997:

```
FREQ=WEEKLY;INTERVAL=2;COUNT=4;
BYDAY=TU,SU;WKST=MO
```

- with `WKST=MO`: Aug 5, 10, 19, 24
- with `WKST=SU` instead: Aug 5, 17, 19, 31

In the standard, the week start travels with the event. It is not the receiving device's setting.

## Three destinations, three answers

Inside the app, each calendar has one week-start value and everything reads it, so dates never disagree. For `.ics` we write that value as `WKST`, and write `DTSTART` as the first real occurrence, because receivers count weeks from there.

EventKit is the odd one out. `EKRecurrenceRule` has no way to set the week start; `firstDayOfTheWeek` exists but is read-only. If the rule cannot say it, the receiver decides.

## So Apple Calendar gets one event per weekday

- Saturday event: every 2 weeks from Jan 3 → 3, 17, 31
- Sunday event: every 2 weeks from Jan 4 → 4, 18, Feb 1

A single-weekday event never reads the boundary. Two alternatives lost: matching the device's current week start breaks when the setting changes or another device opens the same account, and expanding every occurrence into separate events cannot express a repeat with no end.

The cost is that Apple Calendar shows two events, and editing "all events" on one changes only that weekday. Weekly repeats still go out as a single event.

## What is verified

On a simulator's real Apple Calendar, the split events land two weeks apart, deleted occurrences are gone and moved ones appear once. We did not reproduce the slide itself on a Sunday-start device; we chose not to leave the result to the receiver. Whether Google Calendar or Outlook honour `WKST` in an imported `.ics` is still untested.
