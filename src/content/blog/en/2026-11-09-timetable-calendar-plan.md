---
title: "A calendar on top of the timetable — alternating weeks and \"this day only\" changes"
date: 2026-11-09T14:01:55+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
summary: "Assign a timetable to each week (alternating weeks included) and keep cancellations and makeup classes on their dates only. The grid was reused as is."
---

A SuperTimetable timetable is a weekly template: weekday × time. It cannot say "week A, then week B", or "this Wednesday is cancelled". So the timetable stays what it is, and a **calendar** sits on top of it: which timetable each week uses, and what is different on a specific date.

## Assign by week; alternating weeks are just a rule of length two

Opening a calendar puts a strip above the familiar grid: ‹ Nov 9–15 ›, Today, a week/month toggle, and a capsule reading "This week: Siwoo · Week 1/2". The weekday header gains dates; today is a filled circle.

![Calendar week view — dates in the header, the assignment capsule, a pinned block](/blog/timetable-calendar-plan/week-view.png)

The assignment sheet offers four scopes — this week only, every week from here, alternate weeks from here, a rotation from here — and alternating weeks means one timetable per slot. A preview lists the next six weeks. The first version laid all of it out vertically on one screen; the same afternoon it was folded into one row per item (see the update below).

![First assignment sheet — four scope radios and the week 1 / week 2 slots on one screen](/blog/timetable-calendar-plan/assignment-sheet.png)

On disk a rule is `{ from: "2026-03-02", timetables: [A, B] }`: length 1 is weekly, 2 alternating, 3 a three-week rotation, valid until the next rule starts. One week can be overridden on its own (an exam week is "none"). Alternating weeks got no concept of their own.

## Every edit inside the calendar is for that day only

Move, delete or create a block in an assigned week and the timetable file is untouched; the change is stored as an exception on that date — a copy (replace), a removal, or an addition. Changed blocks carry a small pin. Two weeks later, when the same timetable comes back, there is no trace.

Removed events are not drawn, so there has to be a place to see what changed. Tapping a weekday header opens the day sheet: assigned timetable, a holiday switch, and the day's changes with a Revert button per line.

![Day sheet — assigned timetable, holiday switch, a removed event with Revert](/blog/timetable-calendar-plan/day-sheet.png)

The month view shows a strip per week with the timetable's initial and representative color, color bars per day, a pin on days with exceptions, grey for holidays. Tap a day for its week; tap a strip for that week's assignment.

![Month view — week strips, color bars, pins, grey holidays](/blog/timetable-calendar-plan/month-view.png)

## The grid was not rewritten: the week is a virtual timetable

The biggest decision was **not** to build a new week view. The grid is thousands of lines of pinch zoom, long-press drag, resize handles, period axes and the now line. Instead, the store answers a calendar id with the resolved week shaped like a timetable. The grid reads `store.timetable(id:)` and calls `updateSchedule` as usual; the first line of each mutating store method branches on "is this id a calendar" and writes a date exception instead. Undo is a snapshot of the calendar, so the grid's undo button just works.

Two alternatives lost. Alternating weeks as "ISO week parity plus a flip toggle" breaks at the year boundary of 53-week years and had already been removed last month over alarms. And storing calendars inside the timetable save file as a sibling array was dropped on the spot: a document that spans several timetables should not live inside one of their files. Calendars have their own file; the timetable format and version are unchanged, dangling references read as "none" instead of breaking anything, and an older app build never touches the file, so a rollback keeps it.

## Why the segmented control would not switch

Two causes stacked. In the UI test, `-calendar.viewMode week` as a launch argument lands in the `UserDefaults` argument domain, which is read before the persistent domain — the app wrote the new value, `AppStorage` kept returning "week". And in the view, `Image(...).tag(.week).accessibilityLabel("Week")` buried `.tag` inside a modifier, so `Picker` ignored the item. `.tag` has to be the outermost modifier.

## Where it stands

Week and month views, assignment, date exceptions, holidays and the list segment are the prototype. Alarms do not know about calendars yet — the timetable's weekly alarm still fires on a cancelled day — and since AlarmKit repeats only weekly, calendar alarms will have to be one-shot alarms registered a few weeks ahead. That decision, a "this day only / whole timetable" scope in the edit sheet, widgets and Siri, and Android parity for the file format come next.

## 2026-11-09, afternoon — one row per item, and timetables are picked as cards

On a device the first sheet looked huge: four scope radios, a stepper, a radio list per slot and a six-week preview, fifteen rows for three items. It now follows the GoodNotes "More → Rotate page" shape: **the top level has one row per item, and picking happens one level in**, sliding sideways and back.

![Folded assignment sheet — Apply, Week 1, Week 2, Preview, each with its current value and a chevron](/blog/timetable-calendar-plan/assignment-rows.png)

The top level is "Apply  Alternate weeks from here ›", a Timetable group with "Week 1  Siwoo ›" and "Week 2  Ria ›", and "Preview ›" (the six-week name summary under it went away the same evening — see below). Only when a rotation is chosen does a "Rotation length" stepper row appear — controls that finish in place stay at the top level. The Apply page is four rows with one checkmark; picking one pops straight back. X and ✓ live on the top level only.

Picking a timetable started as four name rows with radios. The owner's call was "both preview and list, never pick by title alone" — a timetable is recognized by its shape. So the slot page reuses the picker the timetable list already has: a card pager where the centered card is the choice (ring and check badge), a toggle to a title list with silhouette thumbnails, sharing the list sheet's view-mode setting. "None" stands in the same place — an empty card at the end of the pager, the last row of the list.

![Slot page as cards — the Siwoo card centered with ring and badge](/blog/timetable-calendar-plan/pick-cards.png)

![The same page as a title list — thumbnails, names, "None" as the last row](/blog/timetable-calendar-plan/pick-list.png)

Tap and swipe do different things. **Tapping** a card or row commits and pops. **Swiping** changes the value but keeps the page open — the centered card is the value, so leaving with ‹ keeps whatever was centered. A momentary nil from the horizontal scroll position is ignored; reading it as "none" made the value jump mid-swipe.

Three alternatives lost: a stepper inside the Apply page (you would have to stay on that page after choosing "rotation", unlike the other three), `Picker` with `.navigationLink` style (free summary on the row, but items are text only, no cards), and a ✓ on the slot page (consistent with the period-import sheet, but the reference the owner pointed at makes tap the completion).

One small catch: options built as `Button` inside a `List` are tinted blue down to the label even with `.foregroundStyle(.primary)`. It only showed in a capture; `.tint(Color(.label))` keeps the text in label color. The checkmark lost its accent too that evening — nothing one level in is blue any more.

## 2026-11-09, evening — a timetable from one date to another, and the preview is a calendar

Two more notes came back on the afternoon build. The six-line preview ("Nov 9 Siwoo / Nov 16 Ria / …") did not say **from when to when**, and assignment was week-only, so "this timetable from the 11th to the 20th" could not be written. Exam fortnights and the gap between terms do not start on Mondays.

The Apply page gained a fifth option, "Date range". Choosing it adds "Start date ›" and "End date ›" rows; each opens a one-month calendar and pops the moment a day is tapped (paging months does not close it). If the end moves before the start, the other follows.

![Top level with Date range chosen — Apply, Start date, End date, Timetable, Preview](/blog/timetable-calendar-plan/assignment-range.png)

Storage got one more layer rather than a rewrite: `dateRanges` (start, end inclusive, timetable) sits above the week rules and week overrides, and "which timetable on this date" is answered range → week override → rotation. Replacing the week rules with ranges lost because alternating and rotating weeks are rules, not a range, and the morning's files would have had to migrate. Overlaps are cut at write time — the old range keeps only the pieces before and after — because resolving overlaps at read time makes "remove this range" unpredictable. A week can now change timetable mid-week, so the week view borrows its axis from the timetable with the most days and the capsule lists names in date order.

The preview is a calendar: a color → name legend, then three months of grid with a band per day in that day's timetable color, consecutive days joined into one band. Days this save does not touch are dimmed — outside the range, or before this week for a week rule.

![Preview calendar — legend and the November grid, a green band from the 9th to the 20th crossing the week boundary, the rest dimmed alternating weeks](/blog/timetable-calendar-plan/preview-calendar.png)

The band color tripped once. It started as the month view's "most used block color" of each timetable; in the capture two timetables were both red, a pastel one vanished into the background, and one timetable's ten days came out in **two colors** — with a tie in block counts, a dictionary `max` picks a different winner per call. Colors that point at a timetable now come from a fixed palette by list order (ten, no blue), shared by the month-view strip and the day cells a range covers.

Blue was removed one level in: the Apply checkmark is label-colored and the date picker's selection circle is `.tint(Color(.label))`. The selection outline hiding behind the thumbnail in the title list was fixed alongside — rows in a scroll view were exactly the thumbnail's height, so they got vertical padding (`List` rows already have it).

The Android calendar is still week-only; `calendars.json` now carries `dateRanges` and Android needs the same key.

## History

- 2026-11-09, early morning — calendar phase 1: week assignment, day-only exceptions, month view, virtual timetable.
- 2026-11-09, afternoon — assignment sheet folded to one row per item with drill-in picking; timetables picked with the card/list picker.
- 2026-11-09, evening — date-range assignment, calendar preview with bands and legend, timetable color palette, no blue one level in.
