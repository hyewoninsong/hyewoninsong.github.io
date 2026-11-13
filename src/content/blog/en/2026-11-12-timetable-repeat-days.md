---
title: "Make Mon/Wed/Fri classes in one go — a Repeat switch for the timetable"
date: 2026-11-14T02:19:44+09:00
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

A group means "these days, same time." The first version made a block leave the group when you dragged it alone. A day later that changed: dragging a repeating schedule up or down now moves every day's block together and the group stays (see the Nov 13 section; sideways drags changed again on Nov 14). A block still leaves the group when a quick time edit changes only that block — otherwise the next save from another day's editor would quietly pull it back. Undo restores the group. Duplicates start outside any group, and deleting one block deletes only that block.

## 2026-11-13 — A repeating schedule is selected and dragged as a group

"Drag one and it drops out" ran against the reason for grouping. Nudging a Mon/Tue/Thu class by 30 minutes would peel one block off and leave two more to drag by hand. So, for timetable repeats and for calendar repeats (the occurrences in the visible week):

| You do | You get |
|---|---|
| Select one block | The same-time blocks on the other days get the selection border too; handles and time pills stay on the one you picked |
| Drag any of them up or down | All move by the same amount of time |
| Drag sideways | Only the block under your finger changes day (since Nov 14; the first cut shifted them all) |
| Any day hits another schedule | Everything stops, and the block that hit it shows the rubber-band tension |
| Resize by the handle | Every day gets the same start and end |

The walls are the union of every day the group occupies: a schedule at 8 pm on Tuesday stops Monday and Thursday too. The drag code is the single-block one with two filters widened — "other schedules on my day" became "on the days the group would occupy", and "not me" became "not anyone in the group".

Push past the wall until your finger is inside the blocking schedule's time and the whole group overlaps it, exactly as a single block does — the first cut left that out and it read as broken, not blocked. Shrinking to fit a narrow gap went in for an hour and came back out: one tight gap on Tuesday should not shorten Monday and Thursday. A group stays at the last place it fit.

Selection is still one block. Real multi-select already exists here, but it closes the editor and only moves vertically; the other days ride along as companions for drawing, dragging and saving only. Companions must share the exact start and end, so a calendar occurrence you moved on its own stays put.

The cost: you can't change a single day's time by dragging. Change it in the editor instead.

## 2026-11-14 — Only the blocked block squishes; only the dragged block changes day

Two things felt off after a day. Dragging a Tue–Fri class down until Thursday hit something squished all four blocks. And dragging sideways shifted all four, so sending just Friday's block to Monday was impossible by drag.

| You do | You get |
|---|---|
| Drag up or down until one day is blocked | Everything still stops; only the blocked day's block looks pressed |
| Drag sideways | Only the dragged block changes day. The others stay and follow the time |
| Drag onto a day that holds another block of the same repeat | That block slides to the day you came from. Drop there and the repeat's days are unchanged |
| Drop one block on an empty day | The repeat stays; its days change (Mon/Wed/Fri → Tue/Wed/Fri) |

**Stopping and squishing are different values.** Stopping belongs to the group: let one day lag and "same time" breaks. The pressed shape means "this one touched a wall", so it now goes only to blocks on days where another schedule actually touches the wall. Walls that apply to every day, like the lunch slot or the end of the day range, still press them all. Haptics fire once, not once per block.

**Time belongs to the group, the day belongs to the block.** That left one question: what if the target day already holds a block of the same repeat? Blocking reads as "can't", though nothing would really change. Overlapping puts the same class on a day twice. So the two swap. Nothing changes in the saved data, and the selection moves to the block on that day, which looks like the block you dragged landed there. The slide is the spring every block already had for a day change.

The first capture showed both swapping blocks hatched as overlapping: the overlap check compares against saved positions, and mid-swap each block sits on the other's saved day. Blocks of the same repeat are no longer each other's overlap reference. The unit tests on the day math were green; only a mid-drag screenshot showed it.

## What's left

Verified on the iPhone simulator; for group drag that covers the calendar week view (group selection, the squish on only the blocked block, the swap and what is saved after it), not yet a sideways wall, resizing against a wall, or the timetable grid. iPad, iPhone Duo and real devices are still unchecked, and the Android repeat UI is a separate port.

## History

- 2026-11-12 — Repeat switch in the timetable editor; one block per day plus a group id (schedule save v20)
- 2026-11-13 — Repeating schedules are selected and dragged as a group; reverses "dragging one block detaches it"
- 2026-11-14 — Only the blocked block squishes; only the dragged block changes day; same-repeat blocks swap. Reverses "sideways moves the whole group"
