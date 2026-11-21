---
title: "Adding 'first and third Friday' and 'every 3 days' without adding a chip"
date: 2026-11-22T03:39:18+09:00
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

- **Ending after a count** — the app never counts a series' occurrences up front, and this would undo that. (**Never-ending repeats** were left out here too; they arrived on November 22 and became the default — see below.)
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
| 3. Pattern | Monthly: weekday, date or last day. Yearly: one of two lines (a month grid plus the monthly basis since November 21) |
| 4. Span | presets that fit the frequency; Yearly offers 5, 10 and 20 years |

![Monthly selected: interval stepper, basis chips and a date grid](/blog/timetable-recurrence-units/frequency-monthly.png)

This was replaced on November 21 (last section). At the time, Yearly borrowed from Google Calendar: instead of abstract chips it shows two sentences read from the event's date, "November 16" and "November · third Monday", and you pick one.

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

![After: three cards, only the frequency chip filled black, week and weekday sit right under Basis with no divider](/blog/timetable-recurrence-units/hierarchy-after-weekday.png)

| Card | Question | Contents |
|---|---|---|
| First | How often | Frequency chips, interval |
| Second | When | Weekdays for weekly; basis and its values for monthly; two lines for yearly (a month grid and basis from that night on). Daily has no card |
| Third | Until when | Duration presets, start and end dates, calendar |

- **One black fill per form** — only the frequency chip uses the solid fill. Two months ago we toned this form down to gray pills because all-black was loud. All-gray turned out to have no center. One filled chip at the top is the exception, not a reversal.
- **Remove a line instead of adding a box** — the plan was a light gray box for the values under Basis, but the selection pill (#EFEFF4) is almost the same gray and the selected chip would vanish. A 1pt outlined box grouped them, yet it put one more rectangle inside the card. In the end the values simply lost the divider above them and got a 12pt indent. Every other row has a divider, so its absence is the grouping.

Collapsing the 1–31 grid, rewording the interval and a summary sentence at the top were proposed and left for later. Checked on iPhone in light mode only.

## 2026-11-21, later — dragging follows the frequency, and Yearly starts with the month

Dragging a repeating event in week view with "All events" or "This and following" now does one clear thing per frequency.

| Frequency | Dragged to another day |
|---|---|
| Daily, every N days | the other occurrences in the week slide the same way; on release the whole series, span included, moves by that many days |
| Weekly | only the dragged block changes weekday; an occurrence already there steps aside to the nearest free weekday |
| Monthly by weekday | the drop day's "nth weekday" becomes the rule |
| Monthly by date | the dragged date becomes the drop date; a date already in the pattern is pushed to the nearest free date |
| Monthly on the last day | not moved; it returns and a toast says why |
| Yearly | same as monthly |

### The daily rule existed in the model and never reached the screen

Moving a daily series as a whole had been decided earlier the same day, with unit tests. On screen it never happened. The grid's "step aside" behaviour for series companions also applied to daily events: in a full week, dragging Wednesday onto Thursday pushed Thursday's block back to Wednesday, and the release saved the dragged block to the free weekday, which was Wednesday. Zero change, so the new rule was never called. Day-based series now skip that path and their companions slide by the same number of columns.

### The save was right and the block stayed one column over

After the fix, a drop left Monday empty and Tuesday with two blocks, while the span label had correctly moved by a day. Dumping the series after the save showed no moved occurrence. The store was right; the view was not.

The grid holds a dropped block at its drop position until the stored data catches up, and releases the hold in `onChange` of the stored list. Calendar drags save in two beats: a provisional single-occurrence save, then on the next run loop a revert and a rewrite with the chosen scope. Shift a daily series by one day and a mid-span week still has one occurrence per weekday, and occurrence ids are tied to dates. The final stored value equals the value before the drag. With both saves inside one render, `onChange` sees no change and the hold is never released.

Series that move as a whole no longer hold the drop position. Two blocks stacked on the same spot do not show in a screenshot, so the test collects block positions after the drop and counts one per weekday.

### Monthly with several dates: only the dragged date changes

An event on the 1st and the 15th lost its 1st when the 15th was dragged to the 17th; the drag replaced the whole date list with the drop date. Now only the dragged date changes. If the drop date is already in the list, that date moves to the nearest free one, toward where the drag started on a tie.

### Yearly: a month grid instead of two sentences

The November 19 version offered two sentences read from the event's date. Changing the month or day meant moving the start date, and "last day" or several dates were out of reach. Now you pick the month, and below it is the same basis row and values as Monthly.

![Yearly selected: a grid of twelve months, then the same basis row and day grid as Monthly](/blog/timetable-recurrence-units/yearly-month-grid.png)

The month is not stored. Yearly is saved as "every 12 months" and the month is the start date's month, so picking a month moves the start date to that month of the same year, and the end date with it. The file format is unchanged.

The mid-drag frames were not checked by eye; the test captures only the result. iPad and real devices are still open.

## 2026-11-22 — "No end", and it is the default

Four days ago this post said every repeat has an end date. Not anymore: a new repeating event now starts with **No end**, as in Apple Calendar and Google Calendar. The period row ends with a No end chip; pick 8 weeks, 1 year or a day on the calendar to give it an end. A one-year default had a quiet trap — a weekly class you forgot about would vanish a year later on a date you never chose.

It turned out easy because of the rule that kept it out. Every question the app asks about a series already stops at the first answer, so an endless series costs the same as a one-month one.

Apple, Google and .ics all write "forever" as *nothing* — no `UNTIL` or `COUNT` in the rule, `recurrenceEnd = nil` in EventKit. So do we now: an endless series has no end date in the file. The first version wrote December 31, 9000 instead, so that older app versions would read it rather than drop the series. We switched to the standard form the same day; a far-off date leaks into anything else that reads the file, and the version bump makes older apps warn first.

The year 9000 survives in memory only, as the upper bound for counting. Not 9999: dragging a whole series shifts its end too, and three days past 9999 is a five-digit year. Anything after 8000 counts as no end. One date formatter prints it as "No end", so no screen shows "9000".

## History

- 2026-11-18 — day, month and year units added inside the "Custom" chip
- 2026-11-19 — frequency moved to the first row; one stepper for the interval
- 2026-11-21 — repeat options split into three cards; only the frequency chip is filled
- 2026-11-21 — dragging aligned per frequency; Yearly picks a month, then the monthly basis
- 2026-11-22 — "No end" added and made the default (no end date in the file)
