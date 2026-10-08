---
title: "Nine time-saving features picked, three left out, one pulled back out"
date: 2026-10-08T15:36:00+09:00
app: "timetable"
tags: ["devlog", "design", "data"]
summary: "Nine features that cut the effort of building and editing a timetable, what we turned down, why biweekly classes went in and came out the same day, and the Shortcuts action."
---

In a timetable app, the slow part is not looking at it but building and fixing it. So instead of adding new surfaces, we picked only features that cut typing, nine of them. One (biweekly) came back out the same day, so eight remain.

## The nine

| Feature | What it saves |
|---|---|
| Bulk alerts on | One tap in the `...` menu (inside its Alerts submenu since that afternoon) turns on "N minutes before" for every class. Only bulk-off existed |
| Location field | Shows on blocks, widgets, Watch, Siri and calendar export. Removed the next day (see the bottom) |
| Title suggestions | Existing titles appear as chips while typing; picking one brings its color |
| Shortcuts "Add class" | Add a class by voice without opening the app |
| Auto color | Least-used palette color; same title, same color |
| Import from another timetable | Pick from a checklist of title+color cards with time rows (the same list as calendar export); alarms are not copied; works across axis types (blocked at first — see 2026-10-08 below) |
| Two ways to duplicate | Option-drag on iPad; long-press Duplicate to copy to another day |
| Biweekly (removed same day) | Odd-week and even-week classes. Pulled because alarms could not follow |
| Live Activity | Today's remaining classes on the Lock Screen |

## What we left out

- **Create on several days at once.** Someone who meant to move a class finds it in two places. Creating gets cheaper, fixing gets costlier.
- **Import from a photo (OCR).** Timetable photos have merged cells and small text. If it comes in wrong, checking takes longer than typing.
- **Biweekly, after the fact.** See the entry at the bottom.
- **Import from Calendar.** Calendars hold everything, so choosing what to import becomes the new chore.

The rule was one line: if undoing a mistake costs more than the typing saved, cut it.

## Biweekly: built on ISO week parity, pulled because of alarms

We need to know whether this week is odd. A semester start date matches school calendars best, but it would put a date in the timetable, change the saved data shape, and need updating every term. We built it on the parity of the ISO 8601 week number instead, with a per-timetable "this week is odd/even" chip to line it up with the school. Users say what this week is; the app computes the stored flip.

The limits showed early: in 53-week years two odd weeks can follow each other, and AlarmKit repeats by weekday, so it cannot express every other week. We first planned to ship with a note that alerts ring weekly. Off-week blocks stayed visible at 0.45 opacity with a dashed border, and calendar export used `INTERVAL=2`. All of that is gone now; see the entry below.

## Shortcuts asks the app instead of writing the file

The obvious way to build "Add class" is for the intent to write the shared mirror file. The read-only intents already read it. But when the app is running, its store never re-reads that file, so its stale in-memory state overwrites the new class on the next save. Writing directly would also skip alarm re-sync, Watch sync, backup and undo.

So the intent only hands a request to the app, and the app's store does the save. The cost is that the app comes to the front. The upside is the new class is shown selected, which doubles as confirmation. The rule we kept: an intent that changes saved data never writes the file itself.

## Where it stands

The remaining eight are open PRs, not merged. Location bumps the save version, so merge order may mean a rebase one step up. The Shortcuts action with the app fully closed is not yet verified on a device.

## 2026-10-07 — we pulled biweekly the same day

We tried to solve the alarm limit above and ended up removing the feature. AlarmKit's only repeating schedule is `.weekly([weekday])`. A biweekly alarm would have to be a one-off `.fixed(Date)` registered for the next matching week, then re-registered after it rings. Re-registration happens when the app comes to the foreground, so if you do not open the app for 4 weeks, the following occurrence is simply missing. A class alarm that silently does not ring is the most expensive failure there is.

Keeping "the class is biweekly but its alarm rings weekly" as a caption was no better: people would be turning off alarms on every off week. We did not want to pick between a missing alarm and a wrong one, so the feature went. Save-file version v19 stays as an empty version with no fields, so files written by that day's development build still read. Same rule as before: if people cannot trust it, cut it even when it saves typing.

## 2026-10-08 — import across timetable types, and say what will not fit before you pick

On day one we blocked importing between clock-based and period-based timetables, because we had not decided what happens to a class that falls between periods. A day later we decided.

Period to clock needs nothing: both types store real times, so the schedule is copied as is and the visible hours widen if needed. Clock to period needs a fit. A 9:00–10:15 class going into 50-minute periods is snapped to the periods it overlaps, in the same half-period unit the grid uses, and the fitted time is what gets **saved**. Saving the original and only drawing it fitted would show "periods 1–2" on screen while alarms and calendar export read 9:00–10:15. Each row in the picker shows where it will land.

![Picking schedules to import into a period-based timetable — each row shows the period it will land in; an already-present schedule and one outside the period range are dimmed with the reason written under them](/blog/timetable-time-saving-batch/import-unavailable-reasons.png)

Some schedules cannot be fitted: a 17:00 swim class when the last period ends at 16:40, or something that only sits in the lunch gap. Those rows stay in the list, dimmed, with the reason on the row, including the period range when that is the cause. Exact duplicates get the same treatment. We dropped the alternative of reporting "3 were left out" in an alert afterwards; by then you can no longer see which three.

One snag: SwiftUI's `.disabled` dims the whole row, including the reason you are supposed to read. We block touches instead and dim only the title and time.

## 2026-10-08 — location came out a day later, and the data stayed

The location field went in one day and came out of the edit sheet the next. It looked like deleting one text field, but location also showed on blocks, widgets, Watch, Siri and calendar export. Remove only the input and yesterday's "Room 301" keeps showing with no way to edit or clear it. So every place that displayed it went too.

What stayed is one key in the save file. The app still reads `location` and writes it back unchanged; nothing shows it. Dropping the value on read, or removing the key from the model the way we did for biweekly, would both erase it on the next save. Biweekly was pulled the day it landed, so no file held a value. Location had a day in test builds.

Hidden data needs one guard. The free-time file sent to a friend strips titles and notes, and location was added to that list. Removing that line along with the feature would send an address nobody can see on screen. The line and its test stay. Shared timetable files and iCloud backups still carry the hidden value; if location never comes back, we drop the key then.

## History

- 2026-10-07 — first entry
- 2026-10-07 — biweekly removed the same day (AlarmKit `.weekly` limit)
- 2026-10-08 — cross-type import allowed; schedules that cannot fit are disabled with a reason
- 2026-10-08 — location field removed (input and every display; stored values kept)
