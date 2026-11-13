---
title: "Make Mon/Wed/Fri classes in one go — a Repeat switch for the timetable"
date: 2026-11-13T20:52:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
summary: "Turn on Repeat in the schedule editor, pick several weekdays, and the same class lands on each one. We kept one block per weekday and tied them with a group id instead of storing one schedule with a list of days."
---

A class you take three times a week is now one edit, not three. Turn on Repeat in the schedule editor, pick Mon, Wed and Fri, and the same block appears on all three days. Edit any one of them later and all three change together.

## One switch turns the weekday chips into multi-select

A new Repeat card sits right under the weekday chips. Off (the default), you pick one day as before. On, every chip gets its own highlight and you can pick several.

![New schedule with Repeat on and Mon, Wed, Fri selected](/blog/timetable-repeat-days/repeat-sheet.png)

Save, and each chosen day gets a block with the same title, color, time, note and alerts.

![The same Math block at 8:00 on Mon, Wed and Fri](/blog/timetable-repeat-days/three-days.png)

- Open a repeating schedule and Repeat is on, with every day in the group selected.
- Change the title or time and every day follows.
- Drop a day and its block goes away; add one and a new block appears.
- Turn Repeat off and the app asks first. Confirm, and only the day you are looking at stays.
- One save is one undo, no matter how many blocks it touched.

## One block per day, not one schedule with a list of days

The obvious question was: why not store a single schedule with several weekdays, the way the app's calendar does? The calendar keeps one recurring event (days, date range, template) and generates the blocks you see.

For the timetable, too much already reads "one schedule = one weekday": alerts, home screen widgets, the watch, image export and printing, calendar export, Siri, period conversion, and the Android app. Every one of them would need an expansion step. Older app versions and Android would show only the first day, so the class would look half gone. Moving just Monday's block would also need a split, like the calendar's "This event only."

The calendar could take that shape because it was new: no older readers, and date ranges and exceptions needed a rule anyway. A timetable repeat is just "the same class on these days."

So blocks stay one per weekday, and blocks from the same repeat share a `seriesID`. The schedule save format moves to version 20. Older apps still see every block; they just don't know the blocks belong together. Android reads and writes the new key in the same release.

## When a block leaves the group

A group means "these days, same time." The first version made a block leave the group when you dragged it alone. A day later that changed: dragging a repeating schedule now moves every day's block together and the group stays (see the Nov 13 section). A block still leaves the group when a quick time edit changes only that block — otherwise the next save from another day's editor would quietly pull it back. Undo restores the group. Duplicates start outside any group, and deleting one block deletes only that block.

## 2026-11-13 — A repeating schedule is selected and dragged as a group

"Drag one and it drops out" ran against the reason for grouping. Nudging a Mon/Tue/Thu class by 30 minutes would peel one block off and leave two more to drag by hand. So, for timetable repeats and for calendar repeats (the occurrences in the visible week):

| You do | You get |
|---|---|
| Select one block | The same-time blocks on the other days get the selection border too; handles and time pills stay on the one you picked |
| Drag any of them | All move by the same amount — time and day column |
| Drag sideways | Stops when the rightmost block reaches the last shown day, or the leftmost reaches the first |
| Any day hits another schedule | Everything stops, with the same rubber-band tension as a single block |
| Resize by the handle | Every day gets the same start and end |

The walls are the union of every day the group occupies: a schedule at 8 pm on Tuesday stops Monday and Thursday too. The drag code is the single-block one with two filters widened — "other schedules on my day" became "on the days the group would occupy", and "not me" became "not anyone in the group".

Push past the wall until your finger is inside the blocking schedule's time and the whole group overlaps it, exactly as a single block does — the first cut left that out and it read as broken, not blocked. What a group still won't do is shrink to fit a narrow gap; it stays at the last place it fit.

Selection is still one block. Real multi-select already exists here, but it closes the editor and only moves vertically; the other days ride along as companions for drawing, dragging and saving only. Companions must share the exact start and end, so a calendar occurrence you moved on its own stays put.

The cost: you can no longer pull a single day away by dragging. Change that day's time in the editor instead.

## What's left

Verified on the iPhone simulator; for group drag that covers the calendar week view (group selection, side and bottom walls, one scope prompt), not yet the mid-drag squish or the timetable grid. iPad, iPhone Duo and real devices are still unchecked, and the Android repeat UI is a separate port.

## History

- 2026-11-12 — Repeat switch in the timetable editor; one block per day plus a group id (schedule save v20)
- 2026-11-13 — Repeating schedules are selected and dragged as a group; reverses "dragging one block detaches it"
