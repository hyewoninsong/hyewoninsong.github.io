---
title: "Nine features that save time, and three we left out"
date: 2026-10-07T13:31:47+09:00
app: "timetable"
tags: ["devlog", "design", "data"]
summary: "Nine features that cut the effort of building and editing a timetable, what we turned down and why, and two parts that were harder than they looked: biweekly classes and the Shortcuts action."
---

In a timetable app, the slow part is not looking at it but building and fixing it. So instead of adding new surfaces, we picked only features that cut typing, nine of them.

## The nine

| Feature | What it saves |
|---|---|
| Bulk alerts on | One tap in the `...` menu turns on "N minutes before" for every class. Only bulk-off existed |
| Location field | Shows on blocks, widgets, Watch, Siri and calendar export |
| Title suggestions | Existing titles appear as chips while typing; picking one brings its color |
| Shortcuts "Add class" | Add a class by voice without opening the app |
| Auto color | Least-used palette color; same title, same color |
| Import from another timetable | Pick from a checklist grouped by title; alarms are not copied, mismatched axis types are blocked |
| Two ways to duplicate | Option-drag on iPad; long-press Duplicate to copy to another day |
| Biweekly | Odd-week and even-week classes |
| Live Activity | Today's remaining classes on the Lock Screen |

## What we left out

- **Create on several days at once.** Someone who meant to move a class finds it in two places. Creating gets cheaper, fixing gets costlier.
- **Import from a photo (OCR).** Timetable photos have merged cells and small text. If it comes in wrong, checking takes longer than typing.
- **Import from Calendar.** Calendars hold everything, so choosing what to import becomes the new chore.

The rule was one line: if undoing a mistake costs more than the typing saved, cut it.

## Biweekly: ISO week parity, and alarms we could not match

We need to know whether this week is odd. A semester start date matches school calendars best, but it would put a date in the timetable, change the saved data shape, and need updating every term. We use the parity of the ISO 8601 week number instead, with a per-timetable "this week is odd/even" chip to line it up with the school. Users say what this week is; the app computes the stored flip.

Limits: in 53-week years two odd weeks can follow each other. And AlarmKit repeats by weekday, so it cannot express every other week. Alerts on biweekly classes ring weekly, and the edit sheet says so. Fixing it means registering the next single occurrence and re-registering after it rings, which was too big for this batch.

Off-week blocks stay visible at 0.45 opacity with a dashed border. Hiding them loses the overview, and odd/even badges eat titles on small blocks. Calendar export uses `INTERVAL=2`.

## Shortcuts asks the app instead of writing the file

The obvious way to build "Add class" is for the intent to write the shared mirror file. The read-only intents already read it. But when the app is running, its store never re-reads that file, so its stale in-memory state overwrites the new class on the next save. Writing directly would also skip alarm re-sync, Watch sync, backup and undo.

So the intent only hands a request to the app, and the app's store does the save. The cost is that the app comes to the front. The upside is the new class is shown selected, which doubles as confirmation. The rule we kept: an intent that changes saved data never writes the file itself.

## Where it stands

All nine are open PRs, not merged. Biweekly and location both bump the save version, so whichever lands second rebases one step up. Two paths are not yet verified on a device: the Shortcuts action with the app fully closed, and the widget's Sunday-evening caption for biweekly classes.

## History

- 2026-10-07 — first entry
