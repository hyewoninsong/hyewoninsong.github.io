---
title: "The sheet opened from the weekday row didn't show the weekday card — the flag arrived stale"
date: 2026-10-09T19:18:45+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "We reordered the display sheet so the axis picker sits right above the values it changes, then made the weekday row open the sheet scrolled to the weekday card. The scroll failed because of stale state in the sheet closure, not timing."
---

The display sheet starts with a "By time | By period" picker. The values for that axis now sit directly under it, and the weekday card moved below. In exchange, tapping the weekday row in the grid opens the sheet already scrolled to the weekday card.

## The picker was changing a card one slot away

The old order was axis → weekdays → hours. Switching the picker swaps the hours card for the period rules card, but an unrelated weekday card sat between them. The thing you tapped and the thing that changed were not neighbours.

| | Before | Now |
|---|---|---|
| 1 | Axis | Axis |
| 2 | Weekdays | Hours (or period rules) |
| 3 | Hours (or period rules) | Weekdays |
| 4 | Schedules | Schedules |

## What lost

- **Keeping the old order.** It matched the grid: weekdays on top, hours on the left. Once the picker sat at the top, keeping a control next to its result mattered more.
- **Putting period rules inside the picker card.** One card with eight-plus rows loses its grouping.

The cost: at half height the weekday card falls below the fold, for both timetable types. So the entry point decides where the sheet opens. From the weekday row it scrolls just far enough to show the weekday card. From the time axis or settings it opens at the top.

## Four timing changes, zero effect

The code is small: set a flag when opening, call `scrollTo` when the sheet appears. It never scrolled.

`scrollTo` fails silently, so "not called" and "called but ignored" look identical. We blamed layout timing and tried `onAppear`, the next run loop tick, after the first size report, and a 0.6 second delay. Each capture took 3 to 10 minutes. Nothing changed.

On the fifth run we printed the flag into the sheet title. It was false. The scroll code had never run.

## The sheet closure holds the last rendered values

```swift
revealsDays = (source == "day_header")
showingSheet = true
```

Only the `.sheet(isPresented:)` content closure read `revealsDays`. The view's `body` did not, so changing it did not re-evaluate `body`, and the closure kept the snapshot from the last evaluation — with the old value.

The fix is to pass a binding instead of a value; a binding reads storage at the moment of access. `.sheet(item:)` works too. The timing we started with was fine all along.

## Where it stands

Both entry points were captured on both timetable types. The lesson we kept: when a silent call does nothing, print the input before touching the timing.
