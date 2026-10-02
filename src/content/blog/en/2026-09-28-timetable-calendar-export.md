---
title: "Before sending timetables to Calendar, we decided how you'd remove them"
date: 2026-10-02T12:30:47+09:00
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

## 2026-10-02 — Choosing which series actually go out

A timetable has blocks that have no business on a calendar — lunch, study hall, empty slots. Until now, all of them went out with everything else. There was a second wrinkle too: the rule for merging series (same title, time and note) was correct, but that correctness was itself confusing. A single different character in a note turns one class into two "Calculus" entries on the calendar, and the summary line's count gave no hint why.

So we added a series checklist between the date range and the destination calendar. Every series in the timetable shows up as a row, all checked by default. Turn off the ones that don't belong — lunch, say — and the choice is remembered per device, per timetable. Leave it off and it stays off the next time the sheet opens.

Series that split over a differing note are not merged back together. Merging them would silently drop one of the two notes. Instead, when two or more series share a title, a line under the card explains why: "Events sharing a title but differing in time or notes stay separate."

Series whose weekday doesn't fall in the chosen range aren't hidden from the list — they're dimmed, with a "Not in this period" note, while the checkmark stays exactly as the user left it. Selection and period are two different questions, and hiding one makes the other unanswerable.

The fingerprint used to detect timetable changes after export is now computed from this selection too. Flipping a series off and back on is itself a reason the next export would change the calendar.

The date range card used two calendar pickers. Picking a common range like "to the end of the year" instead of the 16-week default meant paging through months. So we added three chips under the end date — 8 weeks, 16 weeks, end of year. The chips hold no state of their own: the chosen end date is recomputed every time, and whichever chip it matches lights up. Move the start date and the chips' targets move with it. We used chips instead of a segmented control because the series checklist already uses that grammar, and we skipped start-date presets — the start already defaults to today, so there was nothing to pick.

The period caption now gets a second line. Pick a Wednesday start and Monday/Tuesday classes land the following week, not this one — something the old summary line never said, and easy to read as a broken export. Now it adds "First event is Oct 6 (Mon)" right under the summary, skipped when the first event falls on the start date itself. We considered snapping the start date to the nearest Monday automatically, but that silently overrides what the user picked, so we dropped it.

Reopening the sheet with an existing export still showed "Add to Apple Calendar" on the bottom button, even though tapping it doesn't add — it deletes and recreates. The confirmation dialog that pops up ("Already on your calendar → Replace?") made no sense against that label. Now the button reads "Update Calendar" whenever a record exists. The confirmation stays, because deleting and recreating can't be undone regardless of what the button says.

The destructive "Remove from Calendar" button used to sit right under the status card, so it was the first thing your eyes landed on when reopening the sheet. The status card is just that — status, not an action — so it stays at the top. The remove button moved below both main buttons, to the very bottom of the sheet, matching the iOS convention of putting irreversible actions last.

The remembered date range had a gap: reopen the sheet long after a semester ends, and the stored range (last semester's dates) would still be there, looking perfectly normal ("16 weeks · 9 events") right up until you tapped Add and got repeating events in the past. The fix keeps the stored range only if its end date hasn't passed; once it has, only the length survives, and the range restarts from today.

Two smaller touches: a color dot now marks the destination calendar, for telling apart same-named calendars across accounts, and if a dedicated calendar gets deleted from the Calendar app directly, the sheet now says so in one line instead of quietly losing the status card.

## History

- 2026-09-28 — first version of Export to Calendar
- 2026-09-28 — markers for finding and removing events, record recovery, change notice
- 2026-10-02 — series checklist, twin-series note, dimmed out-of-range rows, end-date presets, first-event-date caption, "Update Calendar" CTA, remove button moved to the bottom, stale-range bug fix, calendar color dot, dropped-record notice
