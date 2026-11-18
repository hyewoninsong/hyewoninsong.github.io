---
title: "Adding 'first and third Friday' and 'every 3 days' without adding a chip"
date: 2026-11-18T16:08:10+09:00
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

- **A stored count** and **never-ending repeats** — the app never counts a series' occurrences up front. Every repeat has an end date; picking Year stretches it to ten years. (A count did land the same afternoon, as a one-time conversion to an end date — see below.)
- **Combinations like "last weekday of the month"** — a rule that needs a screen to explain did not make it.
- **Several dates in one month** — the file format accepts it, the form does not offer it.

## Dragging a block means something different per unit

Dragging a weekly series to another weekday changes that weekday. For "every 3 days" the same gesture shifts the whole rhythm. For "monthly on the 18th" it becomes the 20th. For "first Friday" dragged to Thursday, shifting dates by one day is wrong: January 1, 2027 is a Friday, and the day before is not January's first Thursday. Records move to the same week of the same month on the new weekday instead.

## Where it stands

Occurrence math, saving and scoped edits are covered by tests. On screen, only the new-event form on iPhone has been checked by eye. The iPad edit pane, right-to-left languages and alarms following the new patterns are still to be verified by hand.

## 2026-11-18, later — a count becomes a date, and .ics files come in

One of the things left out above went in the same day, and the standard-shaped rules paid off at once: the app now reads `.ics` files exported by other calendars.

### "15 times" is never stored

The end-date presets gained a "Count" chip. Tap it, type a number, and the end date becomes the day of that occurrence. No more paging through the calendar counting lectures.

Storing the count would be closer to the standard's `COUNT`, but then every weekday edit has to move the end date, splitting a series has to split the count, and every redraw has to know which occurrence it is on. What people wanted was to stop counting by hand. Walking fifteen occurrences once, on tap, does that, and the save file did not change by a byte. The cost: the chip reads "15 times" only until the rule is edited.

### What importing a file decides

"Import Calendar File" in the calendar menu shows how many events will come in and what gets skipped before anything is saved. One undo removes them all.

| In the file | What the app does |
|---|---|
| Repeats the app can draw | Imported as repeating events |
| Repeats it cannot ("last weekday", hourly) | First day only, and the count is reported |
| All-day and multi-day events | Skipped, and the count is reported |
| Repeats with no end | Five years from today |
| Excluded dates, edited occurrences | Deleted and edited occurrences |
| Alerts | Not imported |

Expanding unsupported rules into loose single events would mean shipping a full rule expander and leaving the user with dozens of unrelated events. Importing the first day and saying so is the honest version.

Importing the same file twice does not duplicate anything. Each event's id is derived from the receiving calendar plus the file's `UID`, so a second pass finds the events already there and skips them. It does not overwrite them either; they may have been edited since.

Times are converted to the device's clock, and weekdays move with them: Monday 11 pm elsewhere can be "every Tuesday" here. Week start matters too. An every-other-week Sunday and Monday event lands on different Sundays depending on whether weeks start on Monday or Sunday, so when the file and the calendar disagree, each weekday becomes its own series and the two are linked as one group.

All of this is covered by tests only. Real exports from Google, Apple and Outlook, and the screens themselves, are still to be checked by hand.

## History

- 2026-11-18 — repeat units (day, week, month, year)
- 2026-11-18, later — end after a count, `.ics` import
