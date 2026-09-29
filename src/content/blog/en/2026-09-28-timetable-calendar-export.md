---
title: "Before sending timetables to Calendar, we decided how you'd remove them"
date: 2026-09-28T15:43:00+09:00
app: "timetable"
tags: ["devlog", "data", "design"]
summary: "SuperTimetable can now send a timetable to Apple Calendar or Google Calendar as weekly repeating events. What shaped the feature was not how to add them but how to clear a whole semester in one step."
---

Your timetable can now go into Apple Calendar as weekly repeating events, or to Google Calendar as an .ics file. Classes and everything else now sit on one calendar. The design question that took the longest was how to take them back out.

## The date range is asked only at export time

Repeating events need an end date. We could have added a "semester" setting to every timetable, but then the timetable file format changes and your semester dates travel with every timetable you share. Instead, the export sheet asks for a start and end date (default: 16 weeks from today) and only this device remembers the last range you used.

![The export sheet: start and end dates, a "16 weeks · 9 repeating events" summary, the destination calendar, and buttons for Apple Calendar and .ics sharing](/blog/timetable-calendar-export/sheet.png)

"9 repeating events" counts series, not blocks. Blocks with the same title, time and note are treated as one class on different days, so Monday and Wednesday calculus becomes a single "every Mon, Wed" event.

## Repeating events alone don't make cleanup easy

Deleting a series removes every occurrence, but a timetable has several series, and hunting down nine of them at the end of term isn't a good ending. So the default destination is **a new calendar named after the timetable**: delete that calendar and the semester is gone. The sheet also has a "Remove from Calendar" button.

You can still pick an existing calendar. In that case the app remembers the IDs of the series it added, and "Remove from Calendar" deletes only those.

## Write-only access wasn't enough

Since iOS 17, calendar access comes in two levels. Write-only is the lighter ask, but it can't create a calendar and can't find the events again later. Keeping the one-step removal promise needs full access, and the permission text says exactly that.

## What we left out

- **Calendar alerts.** The app already rings its own alarm before class; calendar alerts would ring a second time.
- **Direct Google sync.** Google gets an .ics file. The Google Calendar iOS app can't import .ics files, so the sheet tells you to import on the web, into a new calendar you can delete later.
- **Live sync.** Editing the timetable later doesn't update the calendar. Exporting again replaces what you added, after asking first.

## A simulator gotcha

`simctl privacy grant calendar` did not give the app full calendar access on the iOS 26.2 simulator. The app still read "denied". Resetting the permission and having the UI test tap "Allow Full Access" on the real prompt worked.

## Where it stands

We haven't yet confirmed on a real device whether a Google account rejects calendar creation. Skipping holidays and every-other-week classes are not in yet. It shipped free and moved to Premium on 2026-09-30.

## 2026-09-28 — Marking the events we add

The first version kept its "remove only what the app added" promise with event IDs remembered on the device. Reinstalling the app loses that record, and calendar sync can change event IDs. Events we couldn't find were skipped without telling anyone.

Now every event carries a marker in its `url` field: a deep link back to the timetable. `EKEvent` has no app metadata field, and notes are the user's space. Tapping the link in Calendar opens the timetable. Removal finds events by marker first and stored ID second, and says how many it couldn't find. If the device record is gone, opening the sheet rebuilds it from the markers. In that case the app removes only its own series and leaves the calendar itself alone.

When the timetable changes after an export, the app doesn't rewrite the calendar on its own. That would silently undo edits made in Calendar, like a skipped class or a per-event alert. It stores a fingerprint of what it exported and shows "Your timetable changed after this export" until you export again.

## History

- 2026-09-28 — first version of Export to Calendar
- 2026-09-28 — markers for finding and removing events, record recovery, change notice
