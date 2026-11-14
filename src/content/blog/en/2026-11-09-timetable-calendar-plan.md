---
title: "A calendar on top of the timetable — alternating weeks and \"this day only\" changes"
date: 2026-11-14T17:49:03+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data", "android"]
summary: "Assign a timetable to each week (alternating weeks included) and keep cancellations and makeup classes on their dates only. The grid was reused as is."
---

A SuperTimetable timetable is a weekly template: weekday × time. It cannot say "week A, then week B", or "this Wednesday is cancelled". So the timetable stays what it is, and a **calendar** sits on top of it: which timetable each week uses, and what is different on a specific date.

> On the evening of 2026-11-10 this assignment model was removed. The calendar no longer takes timetables; it **holds dated events of its own** — see the last section. Everything above it is the two days that led there.

## Assign by week; alternating weeks are just a rule of length two

Opening a calendar puts a strip above the familiar grid: ‹ Nov 9–15 ›, Today, a week/month toggle (the arrows and week range were removed on Nov 11 — it is now a year-and-month title and you swipe the date row; the week/month toggle went the same day, and the calendar now opens on the month, see below), and a capsule reading "This week: Siwoo · Week 1/2". The weekday header gains dates; today is a filled circle.

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

Week and month views, the list segment and the virtual timetable are still there (only the toggle between week and month was removed on 11-11, last section). Assignment, date exceptions and holidays were removed on the evening of 11-10 and replaced by the calendar's own repeating events (last section). Alarms came next: since AlarmKit repeats only weekly, each calendar occurrence gets a one-shot alarm, registered 28 days ahead and capped at 64. Android followed on 11-12 (last section). Widgets and Siri reading the calendar come after that.

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

The Apply page gained a fifth option, "Date range". In this build, choosing it added "Start date ›" and "End date ›" rows; each opened a one-month calendar and popped the moment a day was tapped. Those rows and the separate Preview page went away the next day, when the calendar moved to the top level (see 11-10 below).

![Top level with Date range chosen — Apply, Start date, End date, Timetable, Preview](/blog/timetable-calendar-plan/assignment-range.png)

Storage got one more layer rather than a rewrite: `dateRanges` (start, end inclusive, timetable) sits above the week rules and week overrides, and "which timetable on this date" is answered range → week override → rotation. Replacing the week rules with ranges lost because alternating and rotating weeks are rules, not a range, and the morning's files would have had to migrate. Overlaps are cut at write time — the old range keeps only the pieces before and after — because resolving overlaps at read time makes "remove this range" unpredictable. A week can now change timetable mid-week, so the week view borrows its axis from the timetable with the most days and the capsule lists names in date order.

The preview is a calendar: a color → name legend, then three months of grid with a band per day in that day's timetable color, consecutive days joined into one band. Days this save does not touch are dimmed — outside the range, or before this week for a week rule.

![Preview calendar — legend and the November grid, a green band from the 9th to the 20th crossing the week boundary, the rest dimmed alternating weeks](/blog/timetable-calendar-plan/preview-calendar.png)

The band color tripped once. It started as the month view's "most used block color" of each timetable; in the capture two timetables were both red, a pastel one vanished into the background, and one timetable's ten days came out in **two colors** — with a tie in block counts, a dictionary `max` picks a different winner per call. Colors that point at a timetable now come from a fixed palette by list order (ten, no blue), shared by the month-view strip and the day cells a range covers.

Blue was removed one level in: the Apply checkmark is label-colored and the date picker's selection circle is `.tint(Color(.label))`. The selection outline hiding behind the thumbnail in the title list was fixed alongside — rows in a scroll view were exactly the thumbnail's height, so they got vertical padding (`List` rows already have it).

`dateRanges` did not last a day: it went away with the weekly rule when the model changed the next evening.

## 2026-11-10 — the calendar is always on screen, and the range is picked on it

The evening build had two calendars: one to pick a range (behind "Start date ›") and one to see the result (behind "Preview ›"). Same picture, two pages, and every correction meant going back and forth. The request was blunt: keep the calendar on screen and pick from-when-to-when on it.

Both pages are gone. The sheet now shows the Apply and Timetable rows, a one-line hint, then the legend and three months of grid — drawn from the unsaved draft, so changing the scope or a timetable updates the bands in place. "Show more months" adds three at a time, up to twelve.

![The sheet as opened — Apply, Week 1, Week 2 rows above, legend and the November grid with alternating bands below](/blog/timetable-calendar-plan/assign-sheet-calendar.png)

Tap any day and the scope becomes "Date range" with that day as both start and end. The second tap sets the end; a tap before the start restarts from there; after a full range the next tap starts over. Start | End cells appear above, the one the next tap fills outlined; they are buttons, so tapping "End date" lets you adjust only the end. Endpoints are label-colored circles; days the save does not touch are dimmed.

![After tapping the 11th and the 20th — a red band from 11 to 20 with circles at both ends](/blog/timetable-calendar-plan/assign-sheet-range-picked.png)

The half-picked state is a one-day range instead of an empty end: the band never breaks and ✓ is always valid. The first month is fixed when the sheet opens, so tapping a trailing October day in the November grid does not grow a card above and shift everything down.

One bug came out of the capture probe. The `onChange(of: scope)` that resizes the slots also reset "next tap fills the start" — and a calendar tap changes the scope, so the reset fired right after the first tap and the second tap became a new start. The reset now lives only in the Apply page. The probe itself tripped on an accessibility identifier set on the whole month card, which overrode every child day button; identifiers go on the title text only.

Alternatives: keep the Preview page and only draw bands on the range page (still two calendars), or make taps work only in Date range scope (a calendar that ignores taps under a weekly rule is more confusing than one that switches).

## 2026-11-10, evening — assignment is gone; the calendar holds its own dated events

Four revisions of the assignment sheet in two days, and the problem was never the sheet. To add one class you made a timetable, assigned it to weeks or a date range, then recorded what differed on a given day. The request was one line: put things on dates directly, like Google Calendar or Apple Calendar. So everything above is removed — week assignment, the rotation rule, date ranges, holidays, date exceptions, the assignment sheet and the day sheet.

The calendar now owns its events. The + button opens the same edit sheet a timetable uses, with one more group: Repeat — Never, Weekly, Every 2 weeks. With repeat on, the weekday chips become multi-select and you get 8 weeks / 16 weeks / 1 year presets plus a start and end date.

![New event sheet: Monday and Friday chips both selected, weekly for 8 weeks, start and end date above the calendar](/blog/timetable-calendar-plan/event-recurrence.png)

The calendar underneath is the tap-to-pick range calendar built that morning for the assignment sheet — the one thing carried over from the discarded model. The range is a gray band; days that actually get an event are bold with a dot. A summary line under it — the weekdays, the date span and the count, 16 in the capture above — says how many you are about to create.

![Range calendar: a gray band starting Nov 12 and running past New Year, a dot under every Thursday](/blog/timetable-calendar-plan/event-range-dots.png)

Touching a repeating event asks for scope: three choices, editing or deleting (editing started with two; "This and following" was added on 2026-11-12, below).

| Action | Question |
|---|---|
| Edit title, time, color, memo | This event · This and following · All events |
| Delete | This event · This and following · All events |
| Drag or resize on the grid | No question: that occurrence moves, and a scope bar under the grid changes it (see 2026-11-13, night; at first this asked the same question after the drop) |
| Change weekdays, range, weekly/biweekly | No question — the whole series |

![Delete alert for a repeating event: this event, this and following, all events, cancel](/blog/timetable-calendar-plan/event-delete-scope.png)

At first editing had no "this and following", because it means splitting the series and "all events" seemed to lose its meaning afterwards. That was reversed two days later: editing now splits the series at that date (see 2026-11-12 below). Deleting had it from the start because it is just moving the end date one day back.

"All events" is not a blanket overwrite. The edit is compared field by field and **only the fields that changed** are applied to the series and to occurrences edited on their own. A memo on week 3 survives a series-wide rename. Resetting every individually edited occurrence was far less code, and silently lost that memo.

A series is a template event, a start and end date, weekdays, an interval (1 or 2), edited occurrences and deleted occurrences. A one-day event is a series whose start and end are the same day. Each occurrence's id is derived from the series id and its original date, so selection, an in-flight drag and VoiceOver focus survive a save. There is no open-ended repeat: an end date is required, two years at most.

What survived is the virtual timetable. The grid still reads `store.timetable(id:)`; what comes back is now "the occurrences that fall in this week". The vertical axis has no timetable to borrow from, so each calendar keeps its own settings (clock or period axis, visible hours, weekdays) and opens the existing timetable settings sheet. The month view lost its week strip, pins and holidays and shows a color bar per event.

![Month view: color bars per day, no week strip](/blog/timetable-calendar-plan/event-month.png)

Old files are not migrated. The calendar has not shipped, so there is no user data to protect: older files keep their name, order and week start and drop the assignments, with no backup copy. After release the answer would be different.

Calendar events have no alarms yet, and widgets and Siri still see timetables only. The scope question after a drag and the period-axis calendar are covered by tests but not yet checked on screen.

## 2026-11-11 — no arrows; swipe the date row to change weeks

The ‹ Nov 9–15 › label is gone. The top-left now shows only the year and month — a dimmed "2026" next to a bold "November" — and you change weeks by swiping the date row under it. The weekday letters stay put; only the date numbers slide, exactly one week per swipe. It is how Apple's Calendar does it. (A few hours later the grid started sliding too — two sections down.)

![Week header — dimmed year and bold month at top left, fixed weekday row, dates below with today circled](/blog/timetable-calendar-plan/week-title.png)

The header is now two layers: a fixed row of weekday labels, and under it a horizontal pager that holds only date numbers, one week per page. The pager keeps 520 weeks on either side of an anchor and quietly re-anchors when you get near an end. Pages are lazy, so only the visible week and its neighbours are ever drawn. (This scroll-view pager was removed two sections down; there are now just three pages.)

What changes during the swipe and what changes after it are split. The title follows your finger — drag halfway into a week that crosses a month and it already says "December". The grid switches once, after the scroll settles, so the app is not rebuilding a week of events for every frame of a swipe. (The week still changes once, on release — but the grid's picture now follows the finger.)

![Mid-swipe — weekday letters in place, date numbers shifted sideways, title already showing December](/blog/timetable-calendar-plan/week-mid-swipe.png)

The title's month is the month of the week's fourth day, so a week that straddles two months names the one with more days. The week containing today is the exception: it always shows today's month.

Keeping the arrows next to the swipe would have filled the corner right back up. Today, tapping a day in month view, and VoiceOver cover the rest — the title is an adjustable element that steps one week per swipe and reads the week's date range as its value. Paging the whole grid lost too: dragging a block and swiping weeks would fight over the same surface. Paging just the date row leaves every grid gesture alone. (Reversed hours later: there was a way to slide the grid while keeping a single one — two sections down.)

### The title said an Islamic month; the dates said November

While checking swipe direction in Arabic, with the region set to Saudi Arabia, the title read "جمادى الآخرة، ١٤٤٨ هـ" — the sixth month of 1448 in the Islamic calendar. The dates right under it were 9, 10, 11: Gregorian November.

![Before — an Islamic month and the year 1448 in the title, Gregorian dates 9–13 below](/blog/timetable-calendar-plan/hijri-title.png)

A `DateFormatter` given only a locale uses that locale's default calendar: Islamic for Saudi Arabia, Persian for Iran, Buddhist for Thailand. The app's date model is Gregorian, so numbers came from one calendar and words from another. It was not new, either — the old week-range label, the month view title and the dates VoiceOver reads had done this since the calendar shipped to main three days earlier. The text was just small.

It slipped through because the calendar is decided by **region**, not language. Tests built locales from a bare `"ar"`, which is Gregorian. Right-to-left checks ran with Egypt as the region — also Gregorian by default.

The rule is "does it name the same month as the numbers". Buddhist, Japanese-era and ROC calendars differ only in the year, so they stay: "พฤศจิกายน 2569" is the right title in Thailand. Calendars with different months get the same language's Gregorian form. Setting only the formatter's calendar is not enough — the date pattern is chosen from the locale's calendar, so you get an Islamic template (era marker included) filled with Gregorian values. Swap the calendar on the locale itself.

![After — نوفمبر ٢٠٢٦, the same month as the dates; the layout is mirrored so the title sits on the right](/blog/timetable-calendar-plan/gregorian-title.png)

In Arabic and Urdu you swipe right for the next week; the header already mirrors, so the pager needed nothing extra. Tests now include Saudi Arabia, Iran and Thailand as regions. Stepping the title with VoiceOver on a device and a full seven-day week are still unchecked.

## 2026-11-11, later — the calendar opens on the month; tap a date to enter its week

A calendar now opens on the month view. Tap a date and you are in the week that contains it; tap ‹ November 2026 on the week strip and you are back on the month. The week/month toggle at the top right is gone. The two views are no longer side-by-side modes but two levels: pick a week from the month, go back up to the month.

![Calendar's first screen — the November 2026 grid with a color bar per event and today circled; no week/month toggle](/blog/timetable-calendar-plan/month-first.png)

![After tapping the 19th — the week of the 16th to 20th, a back chevron and "November 2026" at the left of the strip, Today at the right](/blog/timetable-calendar-plan/week-back.png)

Back goes to the month you came from while the week on screen is still one of its rows; once you have swiped out of that grid it goes to the month the title names. Enter from November, swipe well into December, and ‹ lands on December. (At first it was always the title's month. That broke for weeks straddling two months and changed in the midday section below.) The year-and-month text is tappable too, because a lone chevron is a small target.

The previous section removed the ‹ › pair from this very spot, so the distinction matters. What left was a pair of arrows that moved sideways between weeks. What came back is one arrow that goes up a level. Weeks still change only by swiping the date row. (That changes in the very next section: swiping the grid works too.)

Four options lost. Keeping the toggle and merely defaulting to month leaves two routes to the same place. Remembering the last view means the first screen differs from one launch to the next, so the view mode is no longer stored at all (which also removes the stored value behind the segmented-control problem above). A real navigation push would rebuild the grid as a new screen and drop its zoom, selection and date pager; swapping layers in place keeps the grid as it stands. And a back button in the navigation bar's top-left would collide with the timetable list button that already lives there.

One exception: arriving with a specific event in hand skips the month and opens that event's week directly.

Verified on iPhone in Korean and Arabic. iPad and the unfolded iPhone Duo are not checked yet, and on an unfolded Duo the week view's date row was seen sitting a few columns off from the weekday letters. It looks like the date pager mis-sizing itself next to the side toolbar; that one is still open.

## 2026-11-11, morning — the grid now slides with the dates

Changing weeks now moves the date row and the event grid as one piece, and you can swipe the grid itself, not just the header. Only the weekday letters and the time axis stay put.

The swipe-the-date-row version, two sections up, lasted a few hours. Date numbers slid sideways while the events sat still, then swapped a beat after the numbers stopped — dates and events looked unrelated. And most of the screen is grid, where a swipe did nothing.

![Mid-drag — weekday letters and time axis in place, date numbers and event blocks shifted half a column to the left together, cut off at the end of the Friday column](/blog/timetable-calendar-plan/week-grid-mid-swipe.png)

(Both captures in this section predate the month-first change above, so the week/month toggle that no longer exists is still visible at the top right.)

| Gesture | Result |
|---|---|
| Swipe sideways on the header or the grid | One week over, if you pass halfway or flick |
| Drag vertically | Grid scrolls |
| Hold for 0.2 s | Select a block, or start a new event |
| Drag a selected block | The block moves; the week stays |
| Swipe from the screen edge | Back |

Paging the whole grid had lost for two reasons: fingers fighting over one surface, and a grid per week with its own selection and zoom. Each was solved separately.

There is still one grid. The neighbouring weeks are pictures of their events, drawn only while you drag. On release the week changes once, the offset jumps back by exactly one page in the same instant, and a spring takes it to zero — it reads as one continuous slide. The date row and the grid read the same offset value, so they cannot drift apart.

The fingers are sorted by a single `UIPanGestureRecognizer` instead of a SwiftUI `DragGesture`. After 8pt of movement, if horizontal is not 1.2× vertical it fails itself and the vertical scroll takes over; the scroll waits for that failure. The edit drag on a selected block and the edge back-swipe go first. The grid already sits on UIKit recognizers, and the failure relationships had to be set by hand.

Three real grids in a pager would have tripled selection, zoom and scroll position. Driving the grid from the date row's scroll view would mean feeding grid drags back into that scroll view. `DragGesture` has no way to yield to the edit drag.

### Next week's dates were showing outside the header

![Before, at rest — to the right of Friday the 13th, under the vertical toolbar strip, next week's 16 is visible](/blog/timetable-calendar-plan/week-date-leak.png)

On iPhone Duo the toolbar moves to a vertical strip at the side. Next Monday's date sat under that strip even at rest. The page was 334pt wide; the date row's frame measured 418pt.

A horizontal `ScrollView` extends its frame into an adjacent side safe area, the same way a vertical one lets content show under the home indicator. On an ordinary iPhone in portrait the side inset is zero, so nothing shows. Every earlier capture was on such a device, and I looked at screenshots without measuring the frame.

The scroll view is gone. Three pages are enough — this week and one on each side — stacked, moved with `.offset`, pinned to the column width and clipped horizontally only (today's circle pokes slightly below the row). The frame is now 334pt, and the 520-page pager from two sections up no longer exists.

### A drag that stopped, then released, was read as a flick

Drag less than halfway, hold, let go: it should return. It advanced a week.

`UIPanGestureRecognizer.velocity` keeps the value from the last movement. Holding still before lifting does not zero it. The rule "released above 250pt/s, go even if under halfway" trusted that number. Now the time between the last move and the lift is measured, and past 0.1 s the velocity counts as zero.

A quick flick and a short drag-and-release both passed. It took a third capture — drag, pause, release — to see it. Any gesture whose outcome depends on release velocity needs that third case.

In Arabic the direction flips. The offset is in screen coordinates, so the sliding layer is pinned left-to-right and only the weekday order inside each page is turned back. The earlier "the pager needed nothing extra" was the scroll view doing that work.

Checked on the folded iPhone Duo screen in Korean and Arabic. The unfolded Duo, a real device, iPad, Reduce Motion and VoiceOver are not checked yet. So whether the unfolded-Duo misalignment noted at the end of the previous section shares a root with this frame overflow is also unknown. And since this is no longer a scroll view, a two-finger horizontal trackpad scroll does not change weeks — still to do.

## 2026-11-11, midday — the tapped week row becomes the week view's header

Tap a date on the month grid and that week's row rises in place to become the week view's date row. The rows above slide up, the rows below slide down, and the event grid shows through the gap. Going back runs it in reverse: the rows close and the header's dates settle into their row. It is the move Apple's Calendar makes. Until now this was a 0.2s crossfade, which cannot show that both screens are talking about the same dates.

![Mid-rise — the 9–13 row is moving toward the header, the 16–22 row is being pushed down, and the grid is visible between them. Saturday and Sunday, absent from the week view, fade out](/blog/timetable-calendar-plan/zoom-open-mid.png)

What moves is a replica of the month view, not the real screens. The real week view mounts under the replica on tap; the replica's date numbers travel to the measured weekday slots of the real header, and then the replica is removed. The month always has seven columns and the week view only the visible days, so on a weekdays-only setup the weekend numbers fade and the weekday numbers spread to five columns.

Three options lost. `matchedGeometryEffect` on the date numbers: the two views swap in one slot, so one must leave before the other exists, and the splitting rows have no counterpart to match. Keeping the real month view alive over the grid and moving its rows: the month would have to stay mounted at all times. Reversing mid-flight: not worth it for a 0.5s decoration. Instead a 1.2s deadline removes the replica even if the completion never arrives, and Reduce Motion keeps the plain switch.

### Which month you return to

The last row of the November grid runs from November 30 to December 6. Tap it and the week view's title says December. Under the earlier rule, ‹ would open December and the header would settle into the top row — but it rose from the bottom row. So the calendar now remembers the month you entered from and returns to it while the week on screen is still in that grid. The cost: on a straddling week you can tap "‹ December 2026" and get November. The title says which month the week belongs to; ‹ goes back where you came from.

### A spring's completion fires before it settles

The first version used a spring, and the rows jumped 6–8pt on the frame the replica was removed. `withAnimation`'s completion defaults to `logicallyComplete`, which for a spring is the perceptual `duration`; the value keeps easing toward the target afterwards. Measured from recorded frames, 6–8pt of roughly 450pt was still left, about 1.4%. Invisible on an opacity or a few points of travel; visible when hundreds of points move and the completion's job is to remove the stand-in and reveal the real thing. A `timingCurve` ends exactly at its duration. The `removed` criterion was not tried, on the judgment that the replica would sit there swallowing touches through the tail.

### The bottom toolbar outlived the view that showed it

The week view has a lock button in the bottom toolbar; the month view has no bottom toolbar. After settling and swapping to the month view, the lock button hung over the month's last row for about half a second. The first guess, a late completion, was wrong: the callback came at 0.52s and the button's pixels disappeared at 1.05s. Declaring the toolbar hidden on the month view did not help. In the old 0.2s `withAnimation` swap it vanished on the same frame, and why the two paths differ is not established.

So the toolbar is hidden when the closing transition starts, and it is gone within the 0.45s the transition takes. The replica is also drawn at the size the month view last occupied rather than the current frame, which is shorter by the toolbar's height.

![Mid-settle — the rows are closing with the grid still visible in the gap; the lock button at the bottom left is already gone](/blog/timetable-calendar-plan/zoom-close-mid.png)

Neither problem shows in before/after screenshots. They showed up with the frame before and after the completion side by side, and the 30 frames after the end laid out.

Checked on iPhone in Korean and Arabic, with Reduce Motion, and when landing directly in the week view. iPad, iPhone Duo, the seven-day layout, a real device and VoiceOver are not checked yet.

## 2026-11-11, evening — the color bars grow into their event blocks

The midday transition carried only the dates. The tapped row's color bars faded as they reached the header, and the week view's blocks were already drawn underneath, simply revealed as the rows parted. Now each bar travels to its own block's place, its weekday column and its time, growing to the block's size while the title appears. Going back, the blocks shrink into the bars of their date cells.

![Mid-rise — under the 30th and the 2nd, red rectangles are growing into blocks with their titles appearing; the dimmed bar of the 2nd, a date outside the month, has reached full color](/blog/timetable-calendar-plan/zoom-blocks-open.png)

At this point the month view drew at most four bars per day; the week view draws only events inside the visible days and hours. So some have no partner. (Since midday on 2026-11-13 the bars are title chips, stacked as far as the cell's height allows, and overflow events leave from the "+n" line rather than the fourth bar's slot — see that day's section below.)

| Bar in the month view | Block in the week view | In the transition |
|---|---|---|
| yes | yes | the bar grows into the block, and shrinks back |
| yes | not visible (outside shown days or hours) | fades with the row, as before |
| none (fifth event onward) | yes | appears from the fourth bar's slot and grows |
| dimmed bar of an out-of-month date | yes | reaches full color on the way |

Curve and duration match the dates: 0.5s in, 0.45s out. Alarm badges appear once the block has nearly arrived.

### One more layer on the replica; the real blocks hide meanwhile

The flying blocks are one extra layer on top of the midday replica: an `Animatable` view that derives position, size, corner radius and title opacity from a single progress value, riding the same `withAnimation` as the dates. No new completion signal, no new deadline. Bars and blocks are matched by the event occurrence's id.

Each flying piece is two things: a colored rectangle that grows from the bar's frame to the block's frame, and the real block view at its real size centered in it, revealed during the first half. The rectangle fades near the end, leaving the same pixels as the real block underneath. The grid reports its own frame and layout metrics, and the layer reads that frame on every frame it draws, so blocks keep heading for the right place while the week view scrolls itself into position.

While the replica carries the blocks, the real grid hides its own. That flag is derived from the replica's state rather than toggled separately. The replica can go away on completion, on the 1.2s deadline, or because another screen abandons the transition; a separate switch would eventually miss one of those and leave the blocks invisible. Un-hiding is not animated either: riding the replica's 0.12s fade would give a moment where both copies are half transparent.

![Mid-settle — the 9–13 row is coming back down and three blocks are shrinking toward their date cells, titles still centered](/blog/timetable-calendar-plan/zoom-blocks-close.png)

### What lost

- `matchedGeometryEffect` between bar and block: same reasons as for the dates, plus the blocks live in a scroll view that clips them under the header.
- Moving the live block views: their frames are already owned by selection, dragging and resistance, and the scroll view clips them, so they cannot start from a row outside the viewport.
- Scaling the block image up from the bar (`scaleEffect`): a 40×3 bar to a 60×70 block is a different ratio on each axis, so the title flies squashed.
- Crossfade in place: the point was to move like the dates.

### The title flew clipped and popped in late

The first cut aligned the block image to the top left of the growing frame. Laid out frame by frame, the title was cut off below the frame while it was still flat and only came up near the end, because a block centers its title and a small top-left window shows the empty top. Centering the image in the frame keeps the title visible from the start. The final picture is identical in both versions; only the middle frames differ.

Getting those frames took a wrong turn too. Simulator screen recording writes a frame only when the screen changes, so idle time has no frames and "the tap happened at second N" does not hold; a 0.5s transition fits entirely inside that error. Cutting by time gave the wrong frames. Reading each frame's timestamp and splitting where the gap exceeds 0.25s yields one burst per transition (40–48 frames for 0.5s, 36–41 for 0.45s), which can then be extracted by frame number.

Checked on iPhone in Korean (first, middle and last rows) and in Arabic with the mirrored layout. Period-based calendars, going back with a block selected, days with overlapping events, iPad, iPhone Duo and a real device are not checked yet.

## 2026-11-11, night — the repeat calendar is one month, paged sideways

Turning on repeat used to make the event sheet two or three screens long: the range calendar stacked three month cards, and a year-long repeat stacked more than twelve, with alerts and notes below all of it. Now there is **one** month card.

![Event sheet — biweekly repeat with the 16-week preset, start and end cells above a single month card titled February 2027 with back and forward arrows](/blog/timetable-calendar-plan/recurrence-one-month.png)

| Action | Result |
|---|---|
| `‹ ›` in the card header, or a horizontal swipe on the card | previous / next month |
| Tap the start or end cell | the calendar jumps to that date's month |
| 8 weeks · 16 weeks · 1 year chip | the calendar jumps to the new end date's month |
| Tap a day | start, then end. The month does not move |

The card always draws six weeks, so paging never changes the sheet's height. Picking works as before: first tap is the start, second the end.

The calendar follows changes made outside it and ignores its own. If tapping a dimmed next-month day paged the card under your finger, the second tap would land on the wrong day.

A popover was the first idea and lost for three reasons: on iPad the event editor is already a popover, an iPhone popover makes day cells too small, and it brings back the separate range screen removed a day earlier. A collapsible calendar is shorter still, but the calendar stops being always visible and the sheet height jumps on every expand.

One precaution: with button cells a swipe could end up picking the day it passed over, so cells are now tap gestures (a tap fails on movement) with the button trait and an accessibility action added back. The swipe is recognized alongside the sheet's vertical scroll and pages only when it ends at least 50pt sideways and 1.5× more horizontal than vertical. iPad popover and Arabic layouts are not yet checked by eye.

## 2026-11-12 — the same calendar on Android: same file, a different moment to roll the alarm window

The Android app now has the calendar too: the `Timetables | Calendars` segment in the list, a month view where tapping a date opens its week, repeats with scope questions, week swiping, the month ↔ week transition, and per-occurrence alarms. Only the **final shape** of everything above was ported; the assignment model that was dropped along the way never crossed over. The code is up in three parts (model and storage, screens, motion and alarms) and is not released yet.

`calendars.json` is the same file on both platforms: same keys, same version numbers, same rules for older versions, unknown newer versions and broken elements.

| Action | Result |
|---|---|
| `Calendars` segment in the list sheet | calendar cards, a title list, search |
| Tap a date in the month view | the tapped week row rises into the date row and the color bars grow into blocks |
| Swipe sideways in the week view | date row and grid slide together to the previous / next week |
| `‹`, system back, the back gesture | the same transition in reverse, back to the month |
| Edit, drag or delete a repeating event | a scope question; one question is one undo |
| An alarm on a calendar event | rings once, on that date at that time; opening it lands on that occurrence's week |

### A platform with a back button

Android has something iOS does not: system back. In the week view it means "back to the month"; in the month view it is left alone. The back gesture starts the closing transition when it commits. Tying the transition to the finger's progress would look better, but it adds one more cancel path to a transition that already guards against double taps, rotation and an alarm cutting in (a generation counter and a 1.2-second deadline).

Week swipes do not start at the screen edges, which belong to the back gesture. `systemGestureExclusion` could claim them, at the cost of back not working in the week view only.

### One live grid and two pictures, not three grids

A `HorizontalPager` with three week grids is the easy way to page weeks, and it splits scroll position, selection and the zoom anchor three ways. iOS dropped that route for the same reason. There is one live grid; the neighboring weeks are pictures with no gestures and no accessibility nodes. On release the week changes and the week you left becomes the picture on the other side.

One deliberate difference from iOS: a grid that is locked and zoomed does not page. A horizontal drag there is an editing gesture, and a zoom anchor that crosses into another week would leave the grid locked on the wrong one.

### No midnight signal, so a ringing alarm rolls the window

Each occurrence gets a dated alarm, from today through 28 days, nearest first, up to 64 slots: the same numbers as iOS. What differs is **when** that window moves forward. iOS rolls it on launch and at midnight. Android has no midnight signal, so it rolls when the app comes to the foreground, on reboot or a time zone change, and **whenever any alarm rings**.

A daily WorkManager job was not chosen, which leaves one limit: if no alarm rings and the app stays closed for more than 28 days, later occurrences will not ring. Weekly alarms with a date check at ring time lost as well. They cannot express biweekly repeats, end dates or a single changed occurrence, and discarding at ring time lights the screen for nothing.

### A cleanup that never ran for calendars

Found on the emulator: discard a new event with X in the calendar's week view, or move to another week with a block selected, and the bottom buttons stayed in their duplicate / delete shape with nothing selected.

The grid clears the selection of an event that no longer exists, but only "when the grid is drawing the current timetable", a guard that stops an outgoing grid from clearing an incoming grid's selection. A calendar never becomes the current timetable. It enters the grid as a virtual timetable outside the list, so that widgets and alarms keep one meaning of "current document". The guard was always false, the cleanup never ran for calendars, and the unit tests only ever built the grid from a timetable.

The guard now asks "is this grid drawing the document on screen" instead, and the decision is a pure function tested with calendars too.

Two more gaps of the same family turned up, neither written as a guard.

The "Remove alarms from all timetables" row in Settings clears calendar alarms too, but the value that enables the row still counted timetable alarms only. With alarms on calendar events alone, the row was disabled. This one came over from iOS unchanged, so the "does it match iOS" check passed. It matched, and both were wrong. Both apps are fixed.

The other is the grid's change animation. On Android the grid moves from its old state to the new one whenever the event list changes, whatever the cause: removed events fade out, new ones fade in. Changing the calendar's week swaps the whole list under the same document, so the mechanism read it as an edit that deleted everything and added something else. Mid-slide back to today, the leaving week's block was still fading inside a grid that already carried this week's dates. It only showed with animations slowed ten times. Another week is another page, not an edit, so the mechanism is rebuilt when the week changes.

The traps iOS hit above (a stale velocity after a pause read as a flick, a spring completing before it settles, the bottom bar lingering over the month view while closing) have the same causes in Compose, so they were blocked during the port. `VelocityTracker` stops reporting once the finger stops, too.

So far this has been checked on an emulator at phone width and in unit tests. Alarms ringing on their dates on a real device, tablets and unfolded foldables, dark mode, and the case of not opening the app for more than 28 days are still to be checked.

## 2026-11-12 — "This and following" now edits too, by splitting the series at that date

Editing a repeating event now asks the same three questions as deleting. Pick "This and following" and the series splits in two at that date: earlier occurrences stay as they were, and only the ones from that day on change.

| You pick | What happens |
|---|---|
| This event | Only that occurrence changes |
| This and following | The series splits at that date; only the later part changes |
| All events | Every occurrence of that series changes |

The same three appear after the ✓ in the edit sheet and after dragging or resizing a block. Changing the rule itself (days, range, weekly or biweekly) still applies to the whole series without asking.

Two days ago this option was left out on purpose, because after a split "all events" seemed to lose its meaning. But a room or time changing mid-semester is the most common edit a timetable sees, and with only two choices you either fix the remaining weeks one by one or rewrite the weeks that already happened. Apple Calendar and Outlook settled this long ago: once split, the two are unrelated, and "all events" means all of the series you are touching.

Three options lost.

- **No split, one per-occurrence override for each later date.** The save format stays the same, but overrides pile up and a one-off edit can no longer be told apart from "everything after".
- **Link the two halves with a group id.** You could still edit the original series as one, but "all events" would need a second question, and the save format would change.
- **Let the earlier half keep the original id.** See below.

An occurrence's id is derived from the series id and its original date. The block you picked belongs to the later half, so the later half keeps the series id and that block's id never changes: the selection survives, the alarm keeps its slot, and a dragged block does not blink out for a frame after the question. At the first occurrence there is nothing before it to split off, so it behaves like "All events". At the last one the later half becomes a single-day event. Occurrences you had edited or deleted individually go to whichever half their date falls in. Saving with nothing changed does not split.

Undo is one step. The split and the edit are saved together; saving them separately would leave a middle state after one undo, two series with identical contents. One undo merges them back, redo splits again. Dragging several blocks at once splits each series only once, at its earliest picked date.

Writing the tests surfaced two older bugs. With a Wed/Fri series that starts on a Friday, moving Friday to Tuesday for "All events" pulled the start date back three days and created a Wednesday occurrence that never existed. Dates of other weekdays inside the extended margin are now recorded as deleted. And deleting "This and following" at the first occurrence of a Monday series that starts on a Sunday left a single-day event on that Sunday; the series is now removed outright when nothing would remain before the cut.

Unit tests cover the split, undo and the edge cases. The four-button alert, the screen after a drag, and the iPad edit popover have not been checked by eye yet.

## 2026-11-12, midday — the two-year cap on repeat ranges is gone, and the sheet stops counting

A repeating event's end date could be at most two years after its start. That cap is removed: open a series that is running out, move the end date later, and the past occurrences stay where they are.

The cap hurt because it was measured from the start date. A cap measured from today moves as time passes; one measured from the start never does. To carry a two-year-old class into another term you had to split the series with "This and following" so the later half got a fresh two years, or move the start date and lose the past occurrences.

- **Remove the cap** — chosen. It is what Apple and Google Calendar do, and no user needed the range limited.
- **Measure the cap from today** — the smallest change, but you would still have to extend again every two years.
- **Keep it and split to continue** — a split series means "All events" edits only reach one half.

There is still no "never ends" option; an end date is required and the presets stay at 8 weeks, 16 weeks and 1 year.

One more edge turned up. When reading dates from the file, the app rejected anything after 2100-12-31 — a line it had drawn itself to filter out garbage dates. With the length cap gone you could page the calendar to 2101, and a series saved that way would fail to load on the next launch. The first reaction was to make those days untappable. But it is not an OS limit, just our own line, so the line was removed: the upper end is no longer checked.

The cap had been hiding one thing. Occurrences are not stored; dates are derived from the rule (start, end, weekdays, every N weeks). The derivation walked from start to end one day at a time — 732 steps at most, which was fine, but about 27,000 out to 2100, and the edit sheet ran it three times per render.

The first fix was to make it faster: jump week to week and build the selected weekdays directly, so the work scales with occurrences instead of days. But a weekly series on all seven weekdays has as many occurrences as days. So the direction changed: stop counting wherever a count is not needed.

| Place | Before | Now |
|---|---|---|
| Summary line | "Weekly Mon, Wed · range · 16 times" | no count |
| Whether ✓ is enabled | counted everything and checked for zero | only looks for a first occurrence (about 12 weeks at most) |
| Dots on the range calendar | built every date in the range | asks only the 42 visible cells |
| "Stop repeating?" alert | "7 other schedules will be deleted." | "The other schedules will be deleted." |
| 50 events per day limit | checked every occurrence's day on save | limit removed |

Rendering the edit sheet no longer depends on how long the range is. The whole range is still needed when splitting or deleting "this and following" and when applying a style to a series — once per tap, and those use the week-by-week derivation.

Alarms and the watch were not touched; both look at a window near today, not the whole range. Picking an end date past two years on screen, and how a decades-long range feels, have not been checked by eye yet.

## 2026-11-12, evening — on wide screens the calendar splits in half: month beside week, then week beside day

On a landscape iPad or an unfolded iPhone Duo the calendar now splits the screen exactly in half. It opens with the month on the left and that week's grid on the right; the week being shown is tinted in the month, and swiping weeks on the right moves the month along.

![Landscape iPad: month on the left, the week grid on the right, the shown week tinted](/blog/timetable-calendar-plan/split-month-week.png)

Switch to week | day and the grid slides into the left half while the right half shows that single day, one column of the week view. (The first version switched on tapping a date; later that night the switch moved to a menu, see below.) Swipe it to step a day at a time; stepping past Friday moves the week on the left as well. Portrait stays a single pane.

![After tapping a date: week on the left, that day on the right](/blog/timetable-calendar-plan/split-week-day.png)

There is still only one live grid. The grid owns window-wide things (the edit popover anchor, keyboard shortcuts, the lock, the bottom toolbar), so two of them would fight. The day pane is a picture built from the same piece that draws neighbouring weeks during a swipe; you edit on the left and the day follows. The grid keeps its place in the view tree, so it slides from right to left without losing its lock state or scroll.

One trap on the way: the first build stayed split after rotating to portrait. The split decision read the content's own size, but in split mode each pane has a fixed half width, so the content never shrank and the decision never changed. Deciding from the size a `GeometryReader` is offered fixed it. Checked on the iPad simulator only; Duo, Mac and devices are still to do.

## 2026-11-12, night — four pairs, picked from a menu in the top-right corner

Two pairs left half the wide screen underused, and editing still opened a popover on top of a half-width pane. Now there are four pairs (three since the next day — see below), picked from a "Month | Week ⌃⌄" menu in the top-right corner, where Apple Calendar keeps its view menu.

![The menu: Month | Week, Week | Day, Week | Edit, Day | Edit](/blog/timetable-calendar-plan/split-mode-menu.png)

| Pair | Left | Right |
|---|---|---|
| Month \| Week | month; tapping a date moves the week | week grid |
| Week \| Day | week; picking an event moves the day | that day (a picture) |
| Week \| Edit | week | editor for the picked event |
| Day \| Edit | one-day grid | editor for the picked event |

Tapping a date no longer changes the layout. When one tap rearranged the screen, anyone who only wanted to move the week lost the month every time. The pair is a layout choice, not a place you go into, so there is no `‹` in split mode, and the choice survives a relaunch.

**One tap opens the editor.** With the popover, a first tap only selected and a second opened it, because the popover covered the block. The pane covers nothing, so one tap is enough and a second tap shows no popover. The pane is the same screen as the popover (save, delete, scope questions, new events from `+`); one window-wide flag turns the popover off while the pane is on screen.

**The pane has no X or ✓; edits apply as you go.** One undo step is one field: tapped values save at once, the time wheel saves when it stops, title and memo save when typing pauses for about a second or focus leaves. Saving on every keystroke would make undo useless; one step per selected event would undo the title when you only wanted the time back. The questions ✓ used to ask (which occurrences of a repeating event, whether to restyle matching events) are asked once per event and the answer is reused; cancelling drops that change.

![Week | Edit as of Nov 12: no X or ✓ (brought back on Nov 14)](/blog/timetable-calendar-plan/split-week-edit.png)

The pane rebuilds its form when the stored event changes from outside (a drag on the grid, undo). The first version compared the store against the value the form sent, but saving a single occurrence adds fields in the store, so the pane read its own save as an outside change, rebuilt, and forgot the scope it had just been given. It now compares against the value read back after saving, and the answers live in the pane rather than the form.

**Day | Edit uses the live grid, not the picture.** The picture has no toolbar (lock, undo, `+`, Today) and no dragging. Instead the live grid is narrowed to one weekday. Its week swipe is off there, because the neighbour it slides in is the same weekday next week, not tomorrow. You step days by swiping the date strip above it.

Checked on the iPad simulator in landscape only. iPhone Duo, Mac, devices and Arabic are still to do.

## 2026-11-13 — three pairs; portrait shows one of them full screen; timetables get Week | Edit too

The menu now offers three pairs: Month | Week, Week | Edit, Day | Edit. Week | Day is gone — its day pane was a picture you could not edit, and Day | Edit already shows the same day as a live grid. A stored Week | Day choice falls back to Month | Week.

Rotating an iPad to portrait used to drop you into the iPhone layout whatever pair you had picked. Now portrait shows **the left view of the picked pair, full screen**:

| Pair | Landscape | Portrait |
|---|---|---|
| Month \| Week | month and week | month (tap a date for its week, `‹` back) |
| Week \| Edit | week and editor | week |
| Day \| Edit | one-day grid and editor | one-day grid |

The menu stays in portrait and reads "Month · Week · Day"; it is one setting, so choosing Day in portrait gives Day | Edit in landscape. Hiding it would strand a portrait user in Week | Edit with no way back to the month. Editing falls back to the popover. iPhone is unchanged.

Timetables now split too: on a wide landscape screen a timetable is always Week | Edit, with the same split rule and centered divider as the calendar and no menu. One tap on a block opens it in the pane.

Checked on the iPad simulator in both orientations. iPhone Duo, Mac, devices, Arabic and narrow Split View windows are still to do.

## 2026-11-13, afternoon — a week strip above the day view; swipe the grid and the day follows your finger

The day view lost its "Thursday, November 12" title and gained a **row of the week's weekdays and dates**, as in Apple's Calendar. The day you are looking at sits in a filled circle — the accent color for today, the text color for any other day — and an unselected today keeps an accent-colored number. Tap a date to go there.

Swiping changed too. You used to swipe the title to change days; the grid ignored horizontal swipes. Now **the grid slides with your finger and the previous or next day shows beside it.** Past the halfway point the circle in the strip moves first; let go and the new day settles in. Stop short and it springs back; a quick flick is enough. Only visible weekdays count, so a weekdays-only calendar goes from Friday to next Monday, and the strip slides to the new week. Tapping a date, swiping the grid and the Today button all select that day's first event and scroll to it, and Today now jumps to today's date, not just today's week.

No new machinery: the week pager (a UIKit pan, one offset value, commit on release then spring the rest) now takes a unit — a week or a day. Yesterday's reason for disabling swipes in the one-day grid — the neighbor picture was the same weekday next week — goes away once the neighbor is drawn as that date's column.

One trap on the way: in landscape Day | Edit the app froze on the splash screen at 99% CPU, with `sample` showing grid bodies re-evaluating forever. The parent was handing a freshly built closure down through the environment on every render. Closures can't be compared, so SwiftUI treats the environment as changed each time and redraws the grid; something the grid touches redraws the parent, and the loop closes. Portrait never ran that branch, so builds and unit tests stayed green. The fix is a reference box held in `@State` (only its closure is swapped per render), with the shown date passed as a plain comparable value.

Checked on the iPad simulator in landscape. Mid-swipe frames, iPhone Duo, Mac, Arabic and VoiceOver are still to do.

## 2026-11-13, morning — the edit pane's color reaches the top, and the left headers match across pairs

On an unfolded Duo, two things looked off. The edit pane's event color started below the toolbar, leaving a white band at the top, and the left pane's header changed shape between Week | Edit and Day | Edit — the day strip ran from the screen edge with big 34pt circles, and the time axis labels grew larger in the day view.

![iPad landscape timetable split — the edit pane's event color fills up to the toolbar and across the whole pane](/blog/timetable-calendar-plan/split-pane-header-full.png)

The grid painted an opaque navigation bar background, and the pane's header stopped under it. Wide (regular) layouts now hide the bar background and let the document paint what sits under it. Hiding it only while the edit pane was visible applied inconsistently within one run, so it is fixed per layout. The pane's 560pt readable width moved from the whole form to the cards, so the color band spans the full pane on iPad.

The day strip now uses the week header's exact metrics — offset by the time axis, same column width, 13pt weekday, 12pt date, same height and rule — with the filled circle on the shown day as the only difference. A one-column day grid scales its text by the week's column width rather than its own wide column. In Month | Week, the month's weekday letters match the week header's size.

Fixed along the way: moving from a timetable to a calendar in Day | Edit made the edit popover appear next to the pane. Both documents toggled one window-wide "pane is editing" flag, and the leaving view's `onDisappear` ran after the arriving view had switched it on. The flag is now "does any owner hold it", with one owner per view instance.

Checked on the iPad simulator in landscape. iPhone Duo, dark mode and Mac are still to do.

## 2026-11-13, midday — the month view's color bars become title chips, with "+5" on the last line when they don't fit

A day cell in the month view used to show its events as unlabeled color bars, four at most. With the repeat-range and per-day caps gone, days with dozens of events are real. If some days can never show everything, the few that are shown should at least be readable. So each bar is now a **title chip**: the event's color with one line of title.

![The November month view — each day cell stacks colored chips with event titles. The 13th shows three chips and a gray "+5" line; long titles are cut at the chip's edge with no ellipsis](/blog/timetable-calendar-plan/month-title-chips.png)

Three rules:

- A title wider than its chip is **cut at the chip's edge, with no ellipsis.** In a seventh of the screen's width, "…" costs a letter or two of the title. Half a glyph showing is fine.
- The number of lines comes from the **cell's measured height**, not a fixed count. Cell height more than doubles between a six-row month on an iPhone and a five-row month on an iPad.
- When a day doesn't fit, **the last line is a gray "+n".** It takes the last chip's line instead of spilling out of the cell, so "+1" never appears — one leftover event simply gets that line.

Text color follows the same setting as week-view blocks, and chips in out-of-month cells are dimmed. The calendar card on the home screen draws the same cell, so it changed too. The tiny month thumbnail in the title list keeps its color bars; there is no room for letters.

Cutting without an ellipsis is not a one-line setting: give a `Text` a width and SwiftUI adds "…" for you. The chip is an empty frame with only a height; the title is laid over it at its natural width with `fixedSize()`, aligned to the leading edge, and the rounded rectangle clips whatever sticks out. Which edge is leading follows the title's own script, as block titles do.

The month ↔ week transition follows: chips grow into blocks where bars used to. The chip's small title fades as soon as it leaves, so the same words never read twice at two sizes. Events folded into "+n" start from that line, transparent, and grow into their blocks; on the way back they shrink into it.

Adding the chips broke a UI test that nobody touched — it **passed while opening the wrong week.** The day cell carried a date label and an identifier but was never made an accessibility element. On a container that is not an element, an identifier and label apply to each element inside it. With only a date number inside, 42 cells were 42 elements; with titles, the same identifier matched 88, and a test that picked cells by index was off everywhere. Hiding the chips from accessibility did not bring the count down. The cell is now one element (`accessibilityElement(children: .ignore)`) whose value is the first three titles plus "and n more" — better for VoiceOver too, which reads full titles rather than stopping on each clipped chip.

A source check meant to catch exactly this already existed, but its pattern matched only lowercase-and-underscore identifiers and skipped interpolated ones — the kind used on repeated cells and rows, where index-based tests are most exposed. The pattern is wider now.

Checked on the iPhone simulator in Korean, light mode: a six-row month and the transition both ways. iPad, iPhone Duo, Mac, a real device, dark mode, Arabic titles, the largest text size and the home card's chips are still to do. The Android month view still draws bars.

## 2026-11-13, midday — in the edit pane, touch and hold an empty slot and the event is simply there

(Reversed on Nov 14 — new events in the pane are drafts with X and a checkmark again; see the last section.)

The edit pane saves as you edit, with no close or confirm buttons. New events were the exception: double-tapping an empty slot opened a "New Event" form in the pane, and that form alone still had its X and checkmark. On screens that show the pane, touching and holding an empty slot (drag while holding to set the length) now saves the event right away and opens it in the pane for editing, with the cursor in the title field.

![iPad landscape timetable: an untitled block created by touch and hold is selected, and the edit pane on the right waits for a title with no X or checkmark](/blog/timetable-calendar-plan/pane-long-press-create.png)

To back out, use Delete Event at the bottom of the pane, the same button editing uses, or undo once. The toolbar `+` and the right-click "New Event" save the same way. The popover on a portrait iPad and the sheet on iPhone are unchanged: they still open a draft you confirm.

Two alternatives lost. Moving the buttons down (Add and Cancel where Delete sits) puts the save button below the alarm and memo cards, out of sight, and still leaves a form that has to be confirmed inside a pane that otherwise never asks. A single tap that saves immediately turns every stray tap into a real event, and would need a hidden rule to delete untouched ones. Touch and hold was already the start of drag-to-create (0.2 s) and does not happen by accident, so while the pane is visible a tap on empty space only deselects and a double tap creates nothing.

The cost: touch and hold, then walk away, and an untitled event stays. There is no automatic cleanup; delete and undo are enough.

Checked on an iPad simulator in landscape with a timetable. Calendar split pairs, period-based timetables, the unfolded Duo, Mac and real devices are still to do.

## 2026-11-13, midday — drag a block open in the edit pane: the pane follows, and the block stays put

A screen recording from an unfolded Duo showed the timetable's Week | Edit split. With an event open in the right pane, dragging that block on the left and letting go made it **animate back to where it started**. The same recording asked for three more things: let the pane follow the drag, move the title to the top center of the left pane, and pull the pane's content up into the empty strip at the top.

![Mid-drag — the block's time pills and the pane's start and end both read 10:45 and 12:45](/blog/timetable-calendar-plan/split-drag-live.png)

### Why the block jumped back

The pane saves as you edit, and it saves once more when it goes away, so nothing is lost. When the stored event changes from outside (a drag on the grid, an undo), the pane rebuilds its form so a stale draft can't overwrite that change. But the rebuild signal (`onChange`) arrives after one more render, and in that render the old form already received the new event as its input while its `@State` draft still held the old position. When the old form disappeared it compared its draft against that fresh input, saw a difference, and saved the old position.

The fix: compare against the event **as it was when the form opened**, captured once in `@State`. The calendar's edit pane uses the same form and is fixed too. (This covered only drags within one weekday column. A drag to another weekday still snapped back until that night — see "2026-11-13, night" below.) The checklist line for this screen now says "drop, wait two seconds, the block is still there".

![After the drop — the block stays at 11:15–13:15 and the pane agrees](/blog/timetable-calendar-plan/split-drag-dropped.png)

### The pane only displays the drag

While a drag is in progress, the grid publishes the dragged event (only when the pane is visible, only when the 5-minute snap changes) and the pane draws it in the weekday chips and the start and end rows. The form's draft is untouched; swapping the draft would trigger live saving mid-drag.

### Moving the toolbar title without breaking the tap

A layer drawn into the bar row looked right but the navigation bar swallowed its taps, and `.offset` inside the principal item moved only the pixels while the hit area stayed put. What worked was padding the opposite side by twice the shift, computed from layout, so the slot itself grows. Screenshots looked identical in all three attempts; `isHittable` and a real tap told them apart. The edit pane now ignores the top safe area except the status bar (read from the window via UIKit), so its header sits in the toolbar row.

Checked on an iPad simulator in landscape. The Duo, Mac and real devices are still pending.

## 2026-11-13, evening — put a timetable into a calendar, as a copy

Once calendars started owning their own dated events, one thing was missing: there was no way to bring an existing timetable in. Now there are two.

- In a timetable, `…` › Export to Calendar, pick **Calendar in This App** as the destination, then a new calendar or one you already have.
- In a calendar, `…` › **Import Timetable**, and pick a timetable.

Either way you choose a period and which events to include, and the timetable's events land as **weekly repeating events** for that period.

![The Export to Calendar sheet — below the period card and event picker, the destination is "Calendar in This App" and the target is a new calendar](/blog/timetable-calendar-plan/export-in-app-target.png)

![November in the new calendar — title chips on each weekday from the 13th onward](/blog/timetable-calendar-plan/timetable-imported-month.png)

### One more branch on an existing sheet, not a new screen

The export sheet already asked for a period, the events to include, and where to put them (new calendar or existing). Sending to an in-app calendar asks exactly the same things. A dedicated sheet would have duplicated the period card and the checklist and added a near-identical menu row, so the destination menu got one more option instead. Import Timetable opens the same sheet with the receiving calendar fixed.

### After the copy, the two are strangers

The first design at the top of this post had the calendar *point at* timetables, and it was torn out within two days. This time it is a copy from the start: edit the timetable afterwards and the calendar does not change, and vice versa.

| Decision | Value |
|---|---|
| Grouping | Events with the same title, time, color and notes merge into one repeating event across weekdays |
| Alarms | Not copied — they would ring twice |
| New calendar | Inherits the timetable's name, axis type, visible hours and day range |
| Existing calendar | Appended; one undo removes the whole import |
| Over the limit | Nothing is added rather than a partial import |

There is no "update": importing the same timetable twice gives two sets. Verified end to end on the iPhone simulator; iPad, Duo, Mac and real devices are still to do.

## 2026-11-13, night — a drag to another weekday still snapped back; a form the pane replaced no longer saves on its way out

Another recording arrived from the screen fixed at midday. A block open in the edit pane, dragged and dropped, went back to where it started, and follow-up drags sometimes stuck and sometimes returned to an earlier position. The guess that came with it was duplicate event ids, which had once produced exactly this. It wasn't that: there was one event in the save file, and the midday fix had a hole.

![Before — art class dragged from Tuesday to Saturday, after the drop. The pane says Saturday 12:55–14:05 while the block is back in Tuesday's column](/blog/timetable-calendar-plan/pane-drag-cross-day-before.png)

### The reference had two parts and only one was pinned

The form's "was this edited?" reference is the event plus its repeat rule (which weekdays it sits on). Midday pinned the event at open time. The rule was a constant recomputed in `init` from whatever event the form was handed. A vertical drag within one column leaves the rule alone, so it passed; a drag across columns moved the rule's reference to the new weekday and the disappearing form again looked edited. The midday check had only dragged vertically.

The erratic follow-ups came one step later. The pane remembers the last value its form saved, and treats a store change to that value as the form's own save, so it doesn't rebuild. After the old form rewrote the old position, that memory and the store disagreed, and some drags stuck while others reverted.

### What closes the path: a replaced form doesn't save

Three changes:

- The rule part of the reference is captured at open time too (`@State`).
- A form the pane replaced (its `.id` changed) does not save when it disappears. The pane hands the form its revision number; if the number differs at teardown, the form only cancels its pending save. A form that disappears because the user picked another event still saves.
- When an outside change triggers a rebuild, the pane clears its "last value the form saved" memory.

The first alone fixes the recording, but it is the same kind of fix as midday's and reopens the day another input-following part joins the reference. The second closes the path. Checking the store at teardown ("don't save if it isn't what I opened") lost because the form would need its own save log to tell its saves from outside changes, while the pane already knows it did the replacing.

The cost: an edit made in the pane and followed within 0.4 seconds (the save debounce) by a drag of that block on the grid is dropped. The later action wins.

![After — the same drag, after the drop. The block sits where it was dropped on Saturday and matches the pane](/blog/timetable-calendar-plan/pane-drag-cross-day-after.png)

The check drags the block Tuesday → Saturday, back, and across again, reading its frame 0.4, 1.6 and 3.6 seconds after each drop. Before the fix the block was already back in Tuesday's column at 0.4 seconds (363pt from the drop point); after, all three drags stay put at all three times.

### Found while reproducing: unlocking froze the app

On an iPad simulator in landscape, unlocking the grid to reproduce the drag hung the app, every time — not a crash, the main thread never left layout. The cause was the title moved over the left pane at midday. It is a toolbar item that measured where its own leading edge landed and derived its leading padding from that, and the padding was the item's width. On the locked screen this settled in a few passes. Unlocking adds the undo and redo buttons, the toolbar moves its items, and during that move each new width got a different position: the measured value changed 108,686 times in 62 seconds. Why the toolbar places the item differently per width during that move is not something I confirmed.

The fix breaks the loop: the item's width comes from layout values only, and the measured edge decides only how far the title shifts **inside** that fixed width. Across three lock toggles the measurement updated 99 times and stopped, with the title within 0.5pt of the pane's center, right-to-left included. The midday checklist had a line for "unlock, title stays centered" that was never run; every capture ended on the locked screen. Both problems have the same shape: a written check exercised only in its easiest case.

Verified on an iPad simulator in the timetable's Week | Edit split. The calendar splits, the undo path (unit-tested only), the unfolded Duo, Mac and real devices are pending, and the hang was reproduced on this one simulator only.

## 2026-11-13, night — dragging a repeating event no longer asks; a bar under the grid changes the scope

Every drag or resize of a repeating event used to raise an alert: this event, this and following, all events, cancel. Nudge a class three times and you answered three times. Now the drop moves **that occurrence only**, and a small scope bar appears above the bottom buttons.

![Right after a drop: a scope bar above the bottom buttons, with "this event only" selected](/blog/timetable-calendar-plan/drag-scope-bar.png)

| You do | What happens |
|---|---|
| Drop a repeating event | Only that occurrence moves; the bar shows "This schedule only" |
| Tap another segment | The drag you just made is re-applied with that scope |
| Drag again without deselecting | It goes in with the scope you picked |
| Deselect, or pick another event | The bar goes away; next time starts from "only" again |
| Undo | One per drag, however many times you changed the scope |

There is no Cancel any more. Undo does that.

**The choice lasts as long as the selection.** Pick "All schedules" once and the following drags keep using it, which is what makes repeated fine-tuning painless. It is forgotten when the selection ends. Remembering it app-wide would let a careless drag a week later move a whole term.

Three alternatives lost. Guessing from the change (weekday moved means one, time changed means all) asks nothing but hides its rule. A "default drag scope" setting cannot fit a choice that differs per situation. A chip next to the selected block, set before dragging, competes with the handles and time pills already there.

Delete and the edit sheet's checkmark still use alerts. The options are the same three everywhere; only how they are asked differs, by how often the action repeats.

**Changing the scope keeps a single undo step.** Tapping another segment calls `undo()` on the drag and saves it again with the new scope in the same pass. `UndoManager` clears the redo stack when a new action registers, so one entry remains. This is only done when the top of the stack is still that drag: the event list is recorded right after the save and compared at tap time. If you undid or edited something in between, the bar is already gone.

**Long labels fall back to one chip.** Three segments fit on an iPhone in Korean, Japanese and Chinese. "This and following schedules" does not, so `ViewThatFits` drops to a chip showing the current scope, with the three options in a menu.

![English: the chip opens a menu with the three scopes and a checkmark on the current one](/blog/timetable-calendar-plan/drag-scope-menu.png)

Checked on the iPhone simulator in Korean and English. The iPad split, the folded Duo, Arabic and dark mode were checked the next day (below). Android still asks with the alert.

## 2026-11-14 — picking "This and following" turned the bar into a chip and pushed it left

Going through the cases left unchecked the day before turned up a bug right away on a Korean iPhone. Tapping **"This and following"** in the three-segment bar replaced it with a single chip stuck to the left, and it never came back. The day before, only "All schedules" had been tapped, and that one was fine.

![Before the fix — after picking "This and following", the bar collapsed into one chip on the left](/blog/timetable-calendar-plan/drag-scope-bar-chip-bug.png)

The bar sits in a `ZStack` inside the grid's `overlay`, and a `ViewThatFits` picks between the segments and the chip. Measuring with `onGeometryChange` showed the chip version was 129pt wide and placed where the segments had started, not centered. `ViewThatFits` was choosing against roughly the segments' own width (about 256pt), not the screen's 370pt. Only the selected segment was semibold, so the row's width changed by a few points per choice; the longest label going bold pushed it over. Fixing only the weight made the chip appear from the start, so the narrow width was the cause and the weight only the trigger. Why the overlay offered that width wasn't pinned down.

The fixes:

- `.frame(maxWidth: .infinity)` on the bar, so it gets the overlay's full width and centers itself. That alone keeps the segments centered for every choice.
- Segment widths are reserved at the bold weight (a hidden bold copy under the real label), so the row no longer shifts when you tap.
- The chip's text was accent blue; a `Menu` label prefers the tint over the inner text color. `.tint(.primary)` matches the segments.

![After the fix — with "This and following" picked, the three segments stay centered](/blog/timetable-calendar-plan/drag-scope-bar-following-fixed.png)

Also checked: "This and following" from the screen (this week stays, later weeks move, one undo restores all of them); the iPad [Week | Edit] and [Day | Edit] splits with the edit pane open while switching scopes; the folded Duo and dark mode; Arabic, which gets the chip because three segments don't fit an iPhone. The quick time sheet only opens from the "Time" pointer menu in a narrow iPad window, which UI tests can't trigger, so that stays a manual step. The lesson: a bar that changes shape gets tapped through every value, and its position is measured, not eyeballed. Still open: the unfolded Duo, Mac, and real devices.

## 2026-11-14 — the edit pane gets its X and checkmark back

For two days the edit pane saved as you typed and a touch and hold saved a new event on the spot. Put next to Apple Calendar on iPad, which keeps an X and a checkmark in the same place, that felt off, so the buttons are back.

The pane now uses the same form as the popover: X, "Edit Event", checkmark. Edits preview on the grid and are saved once when you tap the checkmark (one undo step); X throws them away. Repeating-event scope and the shared-style question are asked at the checkmark. After either button the selection clears and the pane says nothing is selected. New events are drafts again: touch and hold, `+` or a secondary click opens a "New Event" form that the checkmark adds and X discards.

Keeping live saving and only adding buttons lost: a checkmark over edits that are already saved has nothing to confirm. Keeping the event open after the checkmark lost to matching the popover.

### Buttons in the toolbar row didn't respond

The pane's header row used to sit in the navigation bar's row, which was fine for a title. With buttons there, the checkmark hid under the grid toolbar's trailing buttons and X didn't receive taps — the bar takes touches in its row first. The button row now sits just below the bar row, which stays filled with the event color.

Checked on an iPad landscape timetable; the calendar split, scope questions, unfolded Duo and real devices are still to check.

## 2026-11-14, evening — two memos: one for every date, one for that date

A repeating event had one memo field. If it held the room number, there was nowhere to write "quiz this week" without choosing "This event only" and replacing the memo for that occurrence, which hid the room number on that day. The memo is now two fields.

- **Notes for all dates** show on every occurrence.
- **Notes for this date** show on that occurrence only.

Opening an occurrence of a repeating event shows both fields in the edit sheet. New events and one-off events keep a single field.

![The lower part of the edit sheet: a field labelled for all dates, and below it a field labelled with the occurrence's date](/blog/timetable-calendar-plan/date-memo-edit-fields.png)

Everywhere the order is title, notes for all dates, notes for this date: on the grid block and on the card that appears when you tap an event in a locked calendar.

![The info card on a locked calendar: under the title and time, one box for the common notes and one for the date's notes](/blog/timetable-calendar-plan/date-memo-locked-card.png)

### Memos never ask for a scope

Editing a repeating occurrence normally asks "This event only / This and following / All events". Memos skip that question, because the field you typed in already answers it.

| What you edited | Where it goes |
|---|---|
| Notes for all dates | The whole repeating event |
| Notes for this date | That occurrence |
| Title, time, color | The scope picked in the alert |

A save that changed only memos closes without an alert. If the title changed too, the alert appears but applies to the title alone; the common notes still reach every date. The one exception is "This and following", which splits the series at that date, so edited common notes land on the later part only.

### Both show; neither hides the other

The first design let the date's notes replace the common notes on the block, to save space. It was dropped: the room number matters on quiz day too. Blocks still show at most two memo lines, one each when both exist.

### The date's notes follow the occurrence

They are stored per date on the series, not inside the "edited occurrence" record. Stored there, an "All events" edit would overwrite them, and an occurrence with only a note would count as edited when dragging. Moving an occurrence carries its note; splitting a series sends each note to its side; deleting an occurrence or shortening the range removes it, and undo brings it back. Turning repeat off joins the two memos into the single field, common notes first. The widget and the watch join them the same way. Memos saved earlier with "This event only" become that date's notes.

Checked on iPhone only so far; the iPad edit pane, the foldable, and right-to-left languages are still to be looked at.

## History

- 2026-11-09, early morning — calendar phase 1: week assignment, day-only exceptions, month view, virtual timetable.
- 2026-11-09, afternoon — assignment sheet folded to one row per item with drill-in picking; timetables picked with the card/list picker.
- 2026-11-09, evening — date-range assignment, calendar preview with bands and legend, timetable color palette, no blue one level in.
- 2026-11-10 — preview and range pages removed; the calendar sits at the top of the sheet and the range is tapped on it.
- 2026-11-10, evening — assignment model dropped; the calendar holds dated events: weekly/biweekly repeat, two edit scopes, three delete scopes.
- 2026-11-11 — week strip shows year and month only; weeks change by swiping the date row under fixed weekdays. Fixed title and date numbers disagreeing in Islamic-calendar regions.
- 2026-11-11, later — the calendar opens on the month view; tapping a date opens its week, ‹ year-and-month on the strip goes back. Week/month toggle removed, view mode no longer stored.
- 2026-11-11, morning — the date row and the event grid slide together when changing weeks, and swiping the grid works too. The date row is no longer a scroll view (fixes next week's dates leaking under a side toolbar, and a paused release being read as a flick).
- 2026-11-11, midday — month → week lifts the tapped week row into the week header; week → month settles it back. Back returns to the month you entered from (the title's month once you swipe out of it). Fixed a spring completion firing before settle and a bottom toolbar that lingered.
- 2026-11-11, evening — in the month ↔ week transition the color bars grow into their event blocks and shrink back; the real blocks hide meanwhile (derived from the replica's state). The block image is centered in the growing frame.
- 2026-11-11, night — the repeat range calendar is a single month card paged with ‹ › or a swipe; cells and presets jump to their date's month. "Show more months" removed.
- 2026-11-12 — calendar ported to Android: the same `calendars.json`, system back returns to the month, week swiping with one live grid and picture neighbors, the alarm window also rolls when an alarm rings. Fixed a selection cleanup that never ran for calendars, a remove-alarms row that stayed disabled with calendar-only alarms (iOS too), and blocks fading on a week change.
- 2026-11-12 — editing a repeating event offers three scopes too. "This and following" splits the series at that date (the later half keeps the id; one undo merges it back). Fixed a phantom occurrence from moving a weekday and a leftover single-day event from deleting "following" at the first occurrence.
- 2026-11-12, midday — removed the two-year length cap on repeat ranges; the 2100 date ceiling is gone too. The edit sheet no longer counts occurrences (count removed from the summary line and the alert, the 50-per-day limit dropped, dots only for the visible month).
- 2026-11-12, evening — wide landscape screens split in half: month | week, then week | day after tapping a date. The day pane is a picture; one live grid. Fixed a split that survived rotation (it measured its own content).
- 2026-11-12, night — four split pairs picked from a top-right menu only; tapping a date no longer switches to week | day. The edit pane opens on one tap, replaces the popover, and saves as you edit (undo per field, scope and style asked once). Day | Edit narrows the live grid to one column.
- 2026-11-13 — three split pairs (Week | Day and its day picture removed). Portrait shows the picked pair's left view full screen, with the menu reading Month · Week · Day. Timetables split into Week | Edit on wide landscape screens.
- 2026-11-13, afternoon — week strip above the day view (filled circle on the shown day, tap to jump). The grid slides a day at a time with the finger, neighbors visible. Today goes to today's date. Fixed an infinite redraw from a per-render closure in the environment.
- 2026-11-13, morning — edit pane color reaches the top and spans the pane (wide layouts hide the bar background). Day strip, day-grid text scale and the Month | Week weekday letters use the week header's metrics. Fixed the popover appearing beside the pane after switching documents.
- 2026-11-13, midday — month day cells show title chips instead of color bars (titles cut without an ellipsis, line count from the cell's height, a gray "+n" last line on overflow). The month ↔ week transition is chip ↔ block, with folded events leaving from the "+n" line. The day cell is one accessibility element (42 cells had become 88 elements and a UI test tapped the wrong week).
- 2026-11-13, midday — new events in the edit pane: touch and hold an empty slot (or `+`) saves immediately and opens the event in the pane, no draft, no X or checkmark; back out with Delete Event or undo. Double-tap no longer creates while the pane is visible. Popover and iPhone sheet unchanged.
- 2026-11-13, midday — fixed a block dragged from the open edit pane snapping back (the disappearing form compared against its live input). The pane follows a drag. The timetable split's title sits over the left pane (inside the toolbar, still tappable), and the edit pane reaches the toolbar row.
- 2026-11-13, evening — two ways to put a timetable into an in-app calendar: "Calendar in This App" in the export sheet (new or existing calendar) and Import Timetable in the calendar menu. A copy as weekly repeating events; no alarms, no update.
- 2026-11-13, night — fixed a block dragged to another weekday still snapping back (the repeat-rule part of the reference is pinned at open time; a form the pane replaced doesn't save on teardown). Fixed a hang when unlocking in the wide split (the toolbar title item's width comes from layout, not from its own measured position).
- 2026-11-13, night — removed the scope alert after dragging or resizing a repeating event. The drop applies to that occurrence only and a scope bar under the grid changes it; the choice lasts while the selection does, and a scope change stays one undo step. Delete and the edit sheet still ask.
- 2026-11-14 — fixed the scope bar collapsing into a left-aligned chip after picking "This and following" (full overlay width, bold-width segments, chip ink). Checked the iPad split, folded Duo, Arabic, dark mode and "This and following".
- 2026-11-14, afternoon — the edit pane is back to X and checkmark: edits save on the checkmark, X discards, the pane clears afterwards, and new events are drafts again. The button row sits below the toolbar row (in it, the checkmark was covered and X ignored taps).
- 2026-11-14, evening — a repeating event has two memos (all dates, this date), shown in that order on the block and the locked info card. Saving only memos never asks for a scope: common notes reach the whole series (the later part for "This and following"), date notes stay on that occurrence. Older "This event only" memos become date notes.
