---
title: "We put the watch app back a month after removing it — one day per page"
date: 2026-11-11T20:09:37+09:00
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

The cost: if the iPhone app stays closed for more than 35 days, the watch runs out of days and asks you to open the app instead of showing stale events. The window is re-sent every time the app comes to the foreground. Payloads over 60KB shrink the future window by halves.

## A watch that has not picked follows what you opened last

The first version had no picker on the watch: it showed whichever timetable or calendar you last opened on the iPhone. That changed the same evening (see below) — the watch now follows the iPhone only until you pick something on it. Opening a document changes two stored values in a row, so callers only signal "something changed" and the payload is built one second later from the settled state. Identical content is not re-sent.

## Still no complication

The removed version had a watch-face complication, which brought a watch app group, a second target and extra provisioning. This time it is one app target with its own storage.

## 2026-11-11, evening — Pick a timetable or calendar on the watch

The morning version had no picker. That lasted half a day: to look at a different timetable on your wrist you had to take out the iPhone and open it there.

The watch app now sits on a document list — timetables first, then calendars, in the same order as the iPhone.

![Document list — a checkmark marks the one the app would open](/blog/timetable-watch-day-view/document-list.png)

| Gesture | Result |
|---|---|
| Tap a row | Opens today in that timetable or calendar |
| Back button or edge swipe | Returns to the list |
| Reopen the app | Goes straight to the document you last picked |

![A picked calendar — the back button returns to the list](/blog/timetable-watch-day-view/picked-calendar-back.png)

**The app opens on a document, not the list.** Your pick if you made one; otherwise whatever the iPhone opened last; otherwise the only document there is. The list appears only when none of those apply.

**A pick on the watch beats the iPhone.** Following the iPhone would undo your pick every time you touched the phone. So the watch keeps its own choice, and a watch that never picked still follows the iPhone. While you are on the list, nothing the iPhone does pulls you into a document.

**Everything is sent ahead of time.** Fetching a document at the moment you tap it needs the iPhone reachable right then, and a sleeping phone would leave rows that do not open. Instead the iPhone sends every timetable and calendar as one zlib-compressed payload. Over 60KB compressed, calendar windows shrink first, then documents at the end of the list arrive as names only and ask you to open them once on the iPhone. The document the iPhone is showing keeps its content the longest.

The opening rule is one pure function, compiled on its own on a Mac and run against 22 cases, since the watch target has no test bundle.

## Where it stands

The screen is checked in the simulator across 18 languages including right-to-left. The list and document screens were checked only in their end states; tapping in and back, and real iPhone-to-watch delivery, still need a paired device, and a build with a watch app needs watch screenshots on the store.

## History

- 2026-11-11 — Watch app returns as a one-day-per-page timeline (timetables and calendars, no complication)
- 2026-11-11, evening — Document list on the watch (a pick on the watch beats the iPhone's last document; all documents sent as one payload)
