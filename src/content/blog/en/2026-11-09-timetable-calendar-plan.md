---
title: "A calendar on top of the timetable — alternating weeks and \"this day only\" changes"
date: 2026-11-11T18:36:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
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

Week and month views, the list segment and the virtual timetable are still there (only the toggle between week and month was removed on 11-11, last section). Assignment, date exceptions and holidays were removed on the evening of 11-10 and replaced by the calendar's own repeating events (last section). Alarms do not know about calendar events yet; since AlarmKit repeats only weekly, a series with an end date will need one-shot alarms registered a few weeks ahead. That decision, widgets and Siri, and Android come next.

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

Touching a repeating event asks for scope: two choices when editing, three when deleting.

| Action | Question |
|---|---|
| Edit title, time, color, memo | This event · All events |
| Delete | This event · This and following · All events |
| Drag or resize on the grid | Same question after you let go; Cancel puts it back |
| Change weekdays, range, weekly/biweekly | No question — the whole series |

![Delete alert for a repeating event: this event, this and following, all events, cancel](/blog/timetable-calendar-plan/event-delete-scope.png)

Editing has no "this and following" because it means splitting the series, after which "all events" stops having a clear meaning. Deleting gets it because it is just moving the end date one day back.

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

The month view draws at most four bars per day; the week view draws only events inside the visible days and hours. So some have no partner.

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
