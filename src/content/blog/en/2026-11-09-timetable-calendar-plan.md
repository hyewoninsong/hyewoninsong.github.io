---
title: "A calendar on top of the timetable — alternating weeks and \"this day only\" changes"
date: 2026-11-09T11:58:29+09:00
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

The top level is "Apply  Alternate weeks from here ›", a Timetable group with "Week 1  Siwoo ›" and "Week 2  Ria ›", and "Preview ›" with the six week names summarized under it. Only when a rotation is chosen does a "Rotation length" stepper row appear — controls that finish in place stay at the top level. The Apply page is four rows with one checkmark; picking one pops straight back. X and ✓ live on the top level only.

Picking a timetable started as four name rows with radios. The owner's call was "both preview and list, never pick by title alone" — a timetable is recognized by its shape. So the slot page reuses the picker the timetable list already has: a card pager where the centered card is the choice (ring and check badge), a toggle to a title list with silhouette thumbnails, sharing the list sheet's view-mode setting. "None" stands in the same place — an empty card at the end of the pager, the last row of the list.

![Slot page as cards — the Siwoo card centered with ring and badge](/blog/timetable-calendar-plan/pick-cards.png)

![The same page as a title list — thumbnails, names, "None" as the last row](/blog/timetable-calendar-plan/pick-list.png)

Tap and swipe do different things. **Tapping** a card or row commits and pops. **Swiping** changes the value but keeps the page open — the centered card is the value, so leaving with ‹ keeps whatever was centered. A momentary nil from the horizontal scroll position is ignored; reading it as "none" made the value jump mid-swipe.

Three alternatives lost: a stepper inside the Apply page (you would have to stay on that page after choosing "rotation", unlike the other three), `Picker` with `.navigationLink` style (free summary on the row, but items are text only, no cards), and a ✓ on the slot page (consistent with the period-import sheet, but the reference the owner pointed at makes tap the completion).

One small catch: options built as `Button` inside a `List` are tinted blue down to the label even with `.foregroundStyle(.primary)`. It only showed in a capture; `.tint(Color(.label))` keeps the text in label color and the checkmark in the accent.

## History

- 2026-11-09, early morning — calendar phase 1: week assignment, day-only exceptions, month view, virtual timetable.
- 2026-11-09, afternoon — assignment sheet folded to one row per item with drill-in picking; timetables picked with the card/list picker.
