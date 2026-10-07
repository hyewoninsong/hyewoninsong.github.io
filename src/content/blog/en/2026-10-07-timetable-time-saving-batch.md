---
title: "Nine time-saving features picked, three left out, one pulled back out"
date: 2026-10-07T15:25:30+09:00
app: "timetable"
tags: ["devlog", "design", "data"]
summary: "Nine features that cut the effort of building and editing a timetable, what we turned down, why biweekly classes went in and came out the same day, and the Shortcuts action."
---

In a timetable app, the slow part is not looking at it but building and fixing it. So instead of adding new surfaces, we picked only features that cut typing, nine of them. One (biweekly) came back out the same day, so eight remain.

## The nine

| Feature | What it saves |
|---|---|
| Bulk alerts on | One tap in the `...` menu turns on "N minutes before" for every class. Only bulk-off existed |
| Location field | Shows on blocks, widgets, Watch, Siri and calendar export |
| Title suggestions | Existing titles appear as chips while typing; picking one brings its color |
| Shortcuts "Add class" | Add a class by voice without opening the app |
| Auto color | Least-used palette color; same title, same color |
| Import from another timetable | Pick from a checklist of title+color cards with time rows (the same list as calendar export); alarms are not copied, mismatched axis types are blocked |
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

## History

- 2026-10-07 — first entry
- 2026-10-07 — biweekly removed the same day (AlarmKit `.weekly` limit)
