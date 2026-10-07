---
title: "Turning alerts on and off now lives in one menu"
date: 2026-10-07T17:58:00+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Bulk-on sat in the timetable menu and reset-everything sat at the bottom of Settings. Both moved into one Alerts submenu, with a new per-timetable off switch between them."
---

In SuperTimetable, the button that turns alerts on for every event was in the timetable's `...` menu, while the button that wipes them was at the bottom of the Settings sheet. Someone who turned alerts on had to go hunting to turn them off. Both now sit in an Alerts submenu, with a new "off for this timetable" action between them.

## Three actions, one menu

| Row | Scope | Undo |
|---|---|---|
| Turn On Alerts for All Events › | This timetable | One undo |
| Turn Off Alerts for All Events | This timetable | One undo |
| Reset Alerts in All Timetables | Whole app | None, asks first |

![The Alerts submenu after turning alerts on. Only the last row is red](/blog/timetable-alarm-menu/menu-on.png)

The second row is new. It clears alerts only in the timetable you are looking at, so you can silence a holiday timetable and leave the term one ringing. The third row is the old "Reset All Alerts" card from Settings. It is the escape hatch for an alert that keeps ringing after its event is gone, so it stays; only its place changed.

## The cost of mixing scopes

Two rows act on one timetable and one acts on all of them. That difference is why reset lived in Settings in the first place. We relaxed the rule for alerts only, and did three things so the rows do not blur together:

- **A divider.** This timetable above, whole app below.
- **Red text** on the one row that cannot be undone.
- **Scope in the name.** "Reset All Alerts" next to "…for All Events" does not say how far "all" goes, so it became "Reset Alerts in All Timetables".

Turning off does not ask for confirmation. It touches one timetable, so it lands on that timetable's undo stack as a single step, and one undo brings back each event's alert times and sounds. Reset touches several timetables at once and has no undo stack to land on, so that one asks.

## Rows that cannot be used are dimmed, not hidden

![After turning everything off. Turn Off and Reset are dimmed](/blog/timetable-alarm-menu/menu-off.png)

Hiding rows changes the menu's shape between visits. A dimmed row also says something useful: there is nothing to turn off right now.

One implementation detail mattered. Turning off one timetable never clears the system's alarm list wholesale, because that would also kill the other timetables' alarms. The normal reconcile after saving cancels only the alarms whose events changed.

## Still open

The Settings sheet is one card shorter. How the three-level menu unfolds on a wide iPad window has not been checked by eye yet.
