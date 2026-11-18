---
title: "Adding 'first and third Friday' and 'every 3 days' without adding a chip"
date: 2026-11-18T11:05:00+09:00
app: "timetable"
tags: ["devlog", "design", "data"]
summary: "Calendar repeats were weekly only. Two requests made us lay out everything the iCalendar standard offers and decide what to take and what to leave."
---

Repeating events in the calendar used to mean one thing: every N weeks, on these weekdays. Now "Custom" asks for a unit — day, week, month or year. Nothing changes for someone adding a biweekly class, and a meetup on the first and third Friday, or a pill every three days, is a single event.

## Four repeat chips, and a unit inside "Custom"

The repeat row is still `Never · Weekly · Every 2 Weeks · Custom`. Choosing Custom adds a unit row, and each unit brings only what it needs.

| Unit | Interval | What you pick | Weekday chips |
|---|---|---|---|
| Day | every 2–30 days | nothing; the start date is the first occurrence | hidden |
| Week | every 3–12 weeks | weekdays | shown |
| Month | every 1–12 months | weekday, date, or last day; with weekday, which week | only for weekday |
| Year | yearly | nothing; the start date's month and day | hidden |

![Month unit with the weekday basis and the third-week chip selected](/blog/timetable-recurrence-units/month-ordinal-chips.png)

With the month unit, the week chips `1st · 2nd · 3rd · 4th · Last` allow several at once. The one that starts selected is the week of the day you created the event on.

![Day unit: no weekday row, interval set to every 2 days](/blog/timetable-recurrence-units/every-n-days.png)

## Why not a "Monthly" chip

A fifth chip is easier to find. But the app ships in eighteen languages and the row is already tight in languages with long words. And a Monthly chip still leaves "every 3 days" and "yearly" homeless, so Custom would need a unit anyway. One place is better than two.

There is no "5th" week chip either. Most months have no fifth Friday, and people asking for it almost always mean the last one.

## Missing days are skipped, not pulled back

A monthly event on the 31st does not appear in February. That is what the iCalendar standard (RFC 5545) does, and so do we. If the 31st sometimes means the 30th or the 28th, it is not the 31st — it is the last day, so "Last day" is its own choice.

## What the standard has and we left out

- **Ending after a count** and **never-ending repeats** — the app never counts a series' occurrences up front, and both would undo that. Every repeat has an end date; picking Year stretches it to ten years.
- **Combinations like "last weekday of the month"** — a rule that needs a screen to explain did not make it.
- **Several dates in one month** — the file format accepts it, the form does not offer it.

## Dragging a block means something different per unit

Dragging a weekly series to another weekday changes that weekday. For "every 3 days" the same gesture shifts the whole rhythm. For "monthly on the 18th" it becomes the 20th. For "first Friday" dragged to Thursday, shifting dates by one day is wrong: January 1, 2027 is a Friday, and the day before is not January's first Thursday. Records move to the same week of the same month on the new weekday instead.

## Where it stands

Occurrence math, saving and scoped edits are covered by tests. On screen, only the new-event form on iPhone has been checked by eye. The iPad edit pane, right-to-left languages and alarms following the new patterns are still to be verified by hand.
