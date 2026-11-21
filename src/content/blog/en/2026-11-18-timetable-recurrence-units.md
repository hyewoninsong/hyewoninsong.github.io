---
title: "Adding 'first and third Friday' and 'every 3 days' without adding a chip"
date: 2026-11-21T20:03:42+09:00
app: "timetable"
tags: ["devlog", "design", "data"]
summary: "Calendar repeats were weekly only. Two requests made us lay out everything the iCalendar standard offers and decide what to take and what to leave."
---

Repeating events in the calendar used to mean one thing: every N weeks, on these weekdays. Now they repeat by day, week, month or year. (At first the unit lived inside a "Custom" chip; a day later the frequency moved to the first row. See the November 19 section below.) Nothing changes for someone adding a biweekly class, and a meetup on the first and third Friday, or a pill every three days, is a single event.

## Four repeat chips, and a unit inside "Custom"

In the November 18 version the repeat row was `Never · Weekly · Every 2 Weeks · Custom` (it is now `Never · Daily · Weekly · Monthly · Yearly`). Choosing Custom adds a unit row, and each unit brings only what it needs.

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

This call was reversed a day later; the reasoning is kept as it was. A fifth chip is easier to find. But the app ships in eighteen languages and the row is already tight in languages with long words. And a Monthly chip still leaves "every 3 days" and "yearly" homeless, so Custom would need a unit anyway. One place is better than two.

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

## 2026-11-19 — A day later, frequency moved to the first row

Using the "Custom" version for real, a monthly repeat took four steps down: Custom, unit, interval, basis. Apple Calendar and Google Calendar both ask for the frequency first, and now so do we.

| Step | What you pick |
|---|---|
| 1. Frequency | `Never · Daily · Weekly · Monthly · Yearly` |
| 2. Interval | one stepper; 1 reads as the frequency name, 2 and up as "Every 2 weeks" |
| 3. Pattern | Monthly: weekday, date or last day. Yearly: one of two lines |
| 4. Span | presets that fit the frequency; Yearly offers 5, 10 and 20 years |

![Monthly selected: interval stepper, basis chips and a date grid](/blog/timetable-recurrence-units/frequency-monthly.png)

Yearly borrows from Google Calendar: instead of abstract chips it shows two sentences read from the event's date, "November 16" and "November · third Monday", and you pick one.

![Yearly selected: a date line and a third-Monday line, one checked](/blog/timetable-recurrence-units/frequency-yearly.png)

- **Five chips in eighteen languages** — the worry from the day before still holds. A row that wraps turned out to cost less than a common repeat hidden two levels down.
- **Every two weeks is now two taps** — interval chips would have kept it at one, but a single stepper works the same for every frequency.
- **The file format did not change** — the frequency is a name given to the stored rule, not a stored value. Yearly is saved as "every 12 months on that date", so older events simply read as Yearly. The cost: Monthly stops at 11 months, and Yearly lands in one month only.
- **The end date follows the frequency, if untouched** — a new event spans one year, which would make a yearly repeat a single occurrence. Switching frequency moves an end date that still equals the old default to the new one (ten years for Yearly). A date you picked stays.

Checked by eye on the iPhone new-event form. The grid after saving, the iPad edit pane and languages other than Korean are still to be looked at.

## 2026-11-21 — Same rows, but it looked busy: one card per question

After frequency moved to the first row, the repeat card held up to six rows: repeat, interval, basis, week of month, weekday, duration. Nothing was hard to pick, but the first reaction to the screen was that it looked cluttered and flat.

![Before: one card stacks six rows of the same shape, with five gray selection pills](/blog/timetable-recurrence-units/hierarchy-before.png)

The problem was not the number of rows. Every row looked equally important: the same label-plus-chips shape, the same gray pill for every selection, and the same divider between a setting and the values that belong to it. The duration presets also sat far from the end date they change.

How you pick and what gets saved did not change. Only the layout and the selection style did.

![After: three cards, only the frequency chip filled black, week and weekday inside an outlined box under Basis](/blog/timetable-recurrence-units/hierarchy-after-weekday.png)

| Card | Question | Contents |
|---|---|---|
| First | How often | Frequency chips, interval |
| Second | When | Weekdays for weekly; basis and its values for monthly; two lines for yearly. Daily has no card |
| Third | Until when | Duration presets, start and end dates, calendar |

- **One black fill per form** — only the frequency chip uses the solid fill. Two months ago we toned this form down to gray pills because all-black was loud. All-gray turned out to have no center. One filled chip at the top is the exception, not a reversal.
- **An outline, not a tinted box** — the plan was a light gray box for the values under Basis. The selection pill (#EFEFF4) is almost the same gray, so the selected chip would vanish. A 1pt outline groups them without touching the pill.

Collapsing the 1–31 grid, rewording the interval and a summary sentence at the top were proposed and left for later. Checked on iPhone in light mode only.

## History

- 2026-11-18 — day, month and year units added inside the "Custom" chip
- 2026-11-19 — frequency moved to the first row; one stepper for the interval
- 2026-11-21 — repeat options split into three cards; only the frequency chip is filled
