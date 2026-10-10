---
title: "The sheet opened from the weekday row didn't show the weekday card — the flag arrived stale"
date: 2026-10-10T15:57:10+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "We reordered the display sheet and opened it at the card you tapped; the scroll failed because of stale state in the sheet closure. A day later the sheet became Timetable Settings and the axis picker moved into the vertical-axis group as a single row that opens a dropdown."
---

(Update, 2026-10-10: this sheet is now called Timetable Settings and the order changed again — see the last section. What follows is the October 9 story.)

The display sheet started with a "By time | By period" picker. The values for that axis now sit directly under it, and the weekday card moved below. In exchange, tapping the weekday row in the grid opens the sheet already scrolled to the weekday card.

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

## 2026-10-10 — Once the picker moved inside its group, weekdays went back on top

A day later we reworked the sheet again. It is now called Timetable Settings, and its groups use the grid's own words: weekdays are the **horizontal axis**, hours and periods the **vertical axis**.

![Timetable Settings — horizontal axis group, then the vertical axis group led by the basis row](/blog/2026-10-09-timetable-display-sheet-card-order/axis-groups.png)

Yesterday's reason for pushing weekdays down was that nothing should sit between the picker and the card it changes. That premise is gone: the tile pair at the top was replaced by a single "By time / By period" row at the head of the vertical-axis group. Picker and result now live in the same group, so weekdays return to the top, matching how the grid reads.

The open-at-the-right-place mechanism stays, with the target flipped: opening from the time axis now brings the vertical-axis group to the top. The binding fix above still carries the flag.

### The popover behind the row

Tapping the row opens a popover anchored to it. The first version was a two-row list, pinned to open below the row.

![First version — a short popover below the row, text clipped at its edges](/blog/2026-10-09-timetable-display-sheet-card-order/kind-popover-clipped.png)

In a half-height sheet there is no room for two rows under that row, so the popover was squeezed and the text clipped. Letting the system choose the direction moved it above the row, where there is space. The list still looked cramped against the glass edge, so we made it taller and put the two choices side by side: large icon, name, description, radio.

![Now — the popover above the row with both choices side by side](/blog/2026-10-09-timetable-display-sheet-card-order/kind-popover.png)

One more rule: the choice is written only **after** the popover has closed. Switching can drop events that no longer fit, which raises a confirmation alert, and an alert cannot present over a popover that is still dismissing.

## 2026-10-10, afternoon — The popover became a dropdown half a day later

The popover above shipped in the morning and was removed in the afternoon. For a choice between two values it was heavy, and having to manage its direction and size inside a half-height sheet was the hint. The row now opens a system menu in place.

![Now — a menu opening at the row, both names aligned, a checkmark on the current basis](/blog/2026-10-09-timetable-display-sheet-card-order/kind-menu.png)

What we lost is the large artwork; a menu cannot carry it. The icon stays on the row, and this is a value people pick once when they create a timetable.

The menu items took one fix as well. Buttons with a name, a subtitle, and a checkmark image on the selected one indent only the checked row.

![First attempt — only the checked row is indented, so the two names do not line up](/blog/2026-10-09-timetable-display-sheet-card-order/kind-menu-misaligned.png)

An inline `Picker` inside the menu lets the system reserve the checkmark column, so the names align. The cost: picker items drop the second line, so the description is gone from the menu and lives on as the VoiceOver hint.

The "write after it closes" rule stays. A menu does not report when it has closed, so the write waits 0.3 s for the glass to clear; otherwise the confirmation alert collides with the dismissing menu and the lifted row label may not settle back.

## History

- 2026-10-09 — Order axis → hours → weekdays; weekday row opens at the weekday card; stale state in the sheet closure.
- 2026-10-10 — Renamed Timetable Settings; horizontal → vertical → events; a row plus a side-by-side popover instead of tiles.
- 2026-10-10, afternoon — Popover replaced by a system dropdown; inline Picker for checkmark alignment, descriptions dropped.
