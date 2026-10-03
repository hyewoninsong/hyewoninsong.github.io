---
title: "Before sending timetables to Calendar, we decided how you'd remove them"
date: 2026-10-03T21:47:19+09:00
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

So we added a series checklist between the date range and the destination calendar (later that night it moved out of the sheet into a popover — see below). Every series in the timetable shows up as a row, all checked by default. Turn off the ones that don't belong — lunch, say — and the choice is remembered per device, per timetable. Leave it off and it stays off the next time the sheet opens.

Series that split over a differing note are not merged back together. Merging them would silently drop one of the two notes. Instead, when two or more series share a title, a line under the card explains why: "Events sharing a title but differing in time or notes stay separate."

Series whose weekday doesn't fall in the chosen range aren't hidden from the list — they're dimmed, with a "Not in this period" note, while the checkmark stays exactly as the user left it. Selection and period are two different questions, and hiding one makes the other unanswerable.

The fingerprint used to detect timetable changes after export is now computed from this selection too. Flipping a series off and back on is itself a reason the next export would change the calendar.

The date range card used two calendar pickers. Picking a common range like "to the end of the year" instead of the 16-week default meant paging through months. So we added three chips under the end date — 8 weeks, 16 weeks, end of year (now four with a 1-year chip, inside the date card). The chips hold no state of their own: the chosen end date is recomputed every time, and whichever chip it matches lights up. Move the start date and the chips' targets move with it. We used chips instead of a segmented control because the series checklist already uses that grammar, and we skipped start-date presets — the start already defaults to today, so there was nothing to pick.

The period caption now gets a second line. Pick a Wednesday start and Monday/Tuesday classes land the following week, not this one — something the old summary line never said, and easy to read as a broken export. Now it adds "First event is Oct 6 (Mon)" right under the summary, skipped when the first event falls on the start date itself. We considered snapping the start date to the nearest Monday automatically, but that silently overrides what the user picked, so we dropped it.

Reopening the sheet with an existing export still showed "Add to Apple Calendar" on the bottom button, even though tapping it doesn't add — it deletes and recreates. The confirmation dialog that pops up ("Already on your calendar → Replace?") made no sense against that label. Now the button reads "Update Calendar" whenever a record exists. The confirmation stays, because deleting and recreating can't be undone regardless of what the button says.

The destructive "Remove from Calendar" button used to sit right under the status card, so it was the first thing your eyes landed on when reopening the sheet. The status card is just that — status, not an action — so it stays at the top. The remove button moved below both main buttons, to the very bottom of the sheet, matching the iOS convention of putting irreversible actions last.

The remembered date range had a gap: reopen the sheet long after a semester ends, and the stored range (last semester's dates) would still be there, looking perfectly normal ("16 weeks · 9 events") right up until you tapped Add and got repeating events in the past. The fix keeps the stored range only if its end date hasn't passed; once it has, only the length survives, and the range restarts from today.

Two smaller touches: a color dot now marks the destination calendar, for telling apart same-named calendars across accounts, and if a dedicated calendar gets deleted from the Calendar app directly, the sheet now says so in one line instead of quietly losing the status card.

Later that day, one more layout fix. A two-line note sat between the "Calendar" picker card and the "Add to Apple Calendar" button, so the button read as part of the ".ics" block below rather than the choice above it. Now the add button sits right under the picker, and the note moves below the button, since it describes what happens when you add to that calendar. The .ics button and its instructions stand apart with a section gap, as the separate path they are. When premium is locked, only the buttons dim; the picker still opens.

![The lower half of the export sheet. Under the Apple Calendar header, the calendar picker card, the Add to Apple Calendar button right below it, and a short note form one group; the .ics share button and its instructions sit apart below](/blog/timetable-calendar-export/cta-grouped.png)

## 2026-10-02, night — The picker moved out of the sheet

One row per series made the sheet long. A timetable with ten-odd classes pushed the calendar picker and the Add button well below the fold, and the same class at different times took separate rows, so you couldn't see at a glance how often English meets.

The sheet now has a single "Choose Events · 9/9" row. Tapping it opens a popover anchored to the row — a popover on iPhone too, not a sheet. Tap outside to close.

![The "Choose Events 9/9" row with its popover open below. The School card holds two rows, "Mon, Fri 08:50–12:50" and "Tue, Wed, Thu 08:50–13:40", followed by Taekwondo and English cards](/blog/timetable-calendar-export/series-popover.png)

| Group | What goes together | Order |
|---|---|---|
| Card | Series with the same title and color | Earliest weekday → its start time → title → color |
| Row in a card | Series with the same start and end time, any weekday | Earliest weekday → start time |

The card header toggles the whole class; a partly selected group shows a minus. "Earliest weekday, then earliest time" compares the single earliest occurrence, so a class meeting Monday 15:00 and Tuesday 9:00 doesn't pose as "Monday 9:00". What's stored is unchanged — still one choice per series — so earlier selections carry over.

We passed on a collapsible list inside the sheet (expanding it makes the sheet long again) and on a pushed screen or a sheet on a sheet (too heavy, the same call we made for the color picker).

### Getting the simulator to that screen

Verifying it hit three walls. `simctl openurl` puts up a system "Open in Timetable?" prompt that neither `simctl` nor the app can dismiss. `simctl launch` skips the scheme's StoreKit config, so the purchase code asks for an Apple Account sign-in. And a fresh simulator has no timetable. The existing debug flag `-premiumUnlocked` handles the sign-in; two new debug-only launch arguments handle the rest — `-openURL <url>` hands the URL to the app's own `onOpenURL` path after launch, and `UI-Testing-SampleData` loads the store sample timetables without the rest of screenshot mode. A UI test with all three opens the sheet, taps the row, and took the capture above.

## 2026-10-03 — Pick Apple Calendar or another app first

The sheet used to stack both paths: adding to Apple Calendar, and sharing an .ics file. They behave differently after the fact — the app keeps a record of what it added to Apple Calendar and can update or remove it, but it has no idea where a file ends up. Side by side, "Update Calendar" and "Remove from Calendar" read as if they applied to the file too.

So the top of the sheet got two "Export To" chips (that evening they became a dropdown under the event picker — see below). Apple Calendar is the default every time the sheet opens. The date range and event picker are shared; below them, only the chosen path shows.

![The Export to Calendar sheet with Apple Calendar and Other Apps chips at the top, Apple Calendar selected, followed by the period, events, calendar picker and add button](/blog/timetable-calendar-export/target-chips.png)

A segmented control was out — the app already retired that look in favor of chips — and a dropdown would hide one of only two options, so a Google Calendar user wouldn't know their path existed. The Other Apps side keeps the .ics button and import guide, plus one line saying files aren't tracked: share again after changes, and delete old events in that app yourself.

### Already exported? Don't ask where again

When the timetable is already in Apple Calendar, the calendar picker is gone. A status card says which calendar it's in and for what dates, with "Update Calendar" below and "Remove from Calendar" at the very bottom.

![Already-exported state: status card with a Move to Another Calendar row, Update Calendar button, and red Remove from Calendar at the bottom](/blog/timetable-calendar-export/already-exported.png)

A "Move to Another Calendar" row under the status card opens the picker only on demand, minus the current calendar, and the button becomes "Move to This Calendar". Moving removes from the old place and adds to the new one without a second confirmation — choosing to move and picking a target is already two deliberate steps.

![Moving: the row now reads Cancel, and the calendar picker and Move to This Calendar button are expanded](/blog/timetable-calendar-export/moving.png)

We decided against exporting one timetable to several calendars at once. Calendar merges every calendar into one view, so each class would show up twice, and the app keeps one record per timetable. Moving covers the real need, and a Google account added in iOS Settings already shows up in the picker.

### Two different "1 year"s

The "1 year" chip set the end to start + 1 year − 1 day, but the date picker's limit and its caption allowed one more day. Both now come from one function, and a test pins chip end == limit.

## 2026-10-03, evening — "Export To" became a dropdown under the event picker

The chips at the top didn't last. Reading top to bottom, the sheet asked "where" first, then the dates and events, and only the bottom group changed with that choice. Now "Export To" is a single row right under "Events": the chosen value on the left, an up-down chevron on the right. The sheet reads dates, what, where, then the button, and the chosen path sits directly below the row.

![The Export to Calendar sheet with an Export To row showing Apple Calendar under the Events row, followed by the calendar picker and the add button](/blog/timetable-calendar-export/target-dropdown.png)

Tap it and a menu opens with a check on the current choice; picking Other Apps swaps the group below for the .ics button.

![The Export To menu open, Apple Calendar checked, Other Apps below it](/blog/timetable-calendar-export/target-dropdown-open.png)

Earlier we rejected a dropdown because it hides one option. The chevron answers that, and every other choice in this sheet — the event picker, the target calendar — already uses the same row-and-chevron shape. The chips were the odd one out. The default (Apple Calendar, every time) and the reset of an in-progress move are unchanged.

## History

- 2026-09-28 — first version of Export to Calendar
- 2026-09-28 — markers for finding and removing events, record recovery, change notice
- 2026-10-02 — series checklist, twin-series note, dimmed out-of-range rows, end-date presets, first-event-date caption, "Update Calendar" CTA, remove button moved to the bottom, picker and add button grouped, stale-range bug fix, calendar color dot, dropped-record notice
- 2026-10-02 — event picker moved to a popover (title+color cards, same-time rows, ordering rules), debug launch arguments for simulator checks
- 2026-10-03 — Export To chips (Apple Calendar / Other Apps), status card and Move instead of the picker once exported, no multi-calendar export, end-date limit matches the 1-year chip
- 2026-10-03, evening — Export To moved from top chips to a dropdown under the event picker
