---
title: "We put the watch app back a month after removing it — one day per page"
date: 2026-11-15T03:42:50+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Scroll today's schedule on your wrist and swipe sideways for yesterday and tomorrow. Calendar recurrence is not re-implemented on the watch; the iPhone expands it into dated days and sends those."
---

You can now read today's schedule on your Apple Watch: a full-width vertical timeline you scroll with the Digital Crown, with yesterday and tomorrow one swipe away. We removed a watch app right before a release a month ago. This one is new, screen and data both.

## The watch shows one column of the grid

The iPhone timetable is a grid with days side by side. A watch has no room for that, so we took a single day column and stretched it to the watch's width: a time axis on the left, colored blocks on the right, a red line for now.

![Today's page — time axis, colored blocks, red current-time line](/blog/timetable-watch-day-view/day-today.png)

| Gesture | Result |
|---|---|
| Digital Crown or vertical swipe | Scroll that day's timeline |
| Horizontal swipe | Previous or next day |
| "Today" at the bottom | Jump back to today (only shown on other days) |

Opening the app lands near the current time. Other days open at their first event.

![Next day — the title becomes the date and a Today button appears](/blog/timetable-watch-day-view/next-day.png)

An hour is 50pt and blocks never get shorter than 20pt, so a 30-minute event still shows its title. Overlapping events split into side-by-side columns.

![Two overlapping events in separate columns](/blog/timetable-watch-day-view/overlap-columns.png)

## Recurrence lives in one place

The watch cannot read the iPhone's files, so the iPhone sends data over WatchConnectivity. Weekly timetables are easy: seven weekday lists cover every date. Calendars have biweekly rules, moved single occurrences and deleted ones.

- **Send the series and let the watch expand them.** Small payload, but the recurrence logic would exist twice, and the two copies would drift. Rejected.
- **Let the iPhone expand and send dated days.** The iPhone resolves 7 days back and 35 days ahead with the function it already uses and sends "date → events". The watch only draws. This is what we shipped.

The cost: if the iPhone app stays closed for more than 35 days, the watch runs out of days and asks you to open the app instead of showing stale events. The window is re-sent every time the app comes to the foreground. Payloads over 60KB shrink the future window by halves; today always stays.

## The watch follows what you opened last

There is no picker on the watch. It shows whichever timetable or calendar you last opened on the iPhone. Opening a document changes two stored values in a row, so callers only signal "something changed" and the payload is built one second later from the settled state. Identical content is not re-sent.

## Still no complication

The removed version had a watch-face complication, which brought a watch app group, a second target and extra provisioning. This time it is one app target with its own storage.

## Where it stands

The screen is checked in the simulator across 18 languages including right-to-left. Real iPhone-to-watch delivery still needs a paired device, and a build with a watch app needs watch screenshots on the store.

## 2026-11-15 — Tap a block to read its notes

A block on the watch is only as tall as the event is long. A 30-minute event barely fits one line of title, so notes never had a place, and the iPhone did not send them at all.

Now tapping a block brings up a detail screen: the full title, the date, the time, and the notes. Long notes scroll with the crown.

![Detail screen for a calendar event, with the two kinds of notes in separate boxes](/blog/timetable-watch-day-view/detail-calendar.png)

The order matches the iPhone: title, notes for all dates, notes for this date. When an event has no per-date notes the box is simply labelled "Notes". Timetable events repeat weekly, so they show a weekday instead of a date.

![Detail screen for a timetable event, with the weekday in place of a date](/blog/timetable-watch-day-view/detail-timetable.png)

Two decisions:

- **Send the two notes separately.** A helper that joins them into one string already existed, and using it was one line. But then the wrist cannot tell which text belongs to today only.
- **When the payload overflows, drop notes first.** The bundle sent to the watch is capped at 60KB. Adding notes must never make an event that showed yesterday disappear, so notes go first, then the calendar's date window, then whole documents.

The note fields are optional and empty notes are not sent, so most payloads are unchanged, an older watch app ignores the new fields, and a newer one still reads its cached older bundle.

Not yet checked on a paired physical watch.

## History

- 2026-11-11 — Watch app returns as a one-day-per-page timeline (timetables and calendars, no complication)
- 2026-11-15 — Tapping a block opens event details (title, time, notes); notes are now sent to the watch
