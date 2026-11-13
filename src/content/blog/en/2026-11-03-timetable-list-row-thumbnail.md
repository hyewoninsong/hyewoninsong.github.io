---
title: "The title list now shows a silhouette of each timetable"
date: 2026-11-13T17:10:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The timetable list's title view gets a small preview per row. It is not the card preview scaled down but a Canvas silhouette of the blocks, drawn in microseconds. The type icon gave up its spot."
---

The timetable list has two views: cards you swipe through, and a plain list of names. The list is faster when you have many timetables, but names alone made you think twice about which was which. Like a reading app that keeps a tiny cover in its list view, every row now carries a silhouette of its timetable.

## A whole timetable in 40 points

![Title list — each row has a small silhouette on the left, blocks placed in their day columns in their own colors](/blog/timetable-list-row-thumbnail/titles-thumbnails.png)

The silhouette is 40×52pt. Schedules sit as colored rectangles on a day-column × time-range grid with faint hour lines. No text, no day headers, no time axis — none of it would be legible at that size, and all you need is the shape. A packed Monday-to-Friday timetable and one with a few afternoon blocks are told apart before you read the name.

Period-based timetables use the same rule as the card preview: equal-height slots per period and an empty band where lunch is. Edit mode keeps the silhouette next to the checkmark and the reorder handle.

![Edit mode — the checked row and reorder handles, silhouettes unchanged](/blog/timetable-list-row-thumbnail/titles-edit-mode.png)

## Why not shrink the card preview

The obvious route was to reuse the preview image the card view already renders. Two reasons said no.

The card image is an offscreen render — `UIView.drawHierarchy` over the real grid view, blocking the main thread for 80ms or more per image. The card view gets away with it by rendering only the center card and a few neighbors and caching them. A list creates dozens of rows per scroll; rendering per row would freeze the list for seconds on open.

The cache key does not fit either. It includes the card's measured width and height, which come from the pager. The title list has no pager, so it cannot even form the key.

So the silhouette is a single `Canvas`. It reads the day columns and vertical range from the model and fills one rectangle per schedule. It costs microseconds, so there is no cache and no delay, and a color change shows on the next body. The known pitfall where an offscreen render done in the background loses its grid lines does not apply — that is an offscreen-render problem, and `Canvas` draws on screen.

The coordinate rules are borrowed, not invented: period timetables use the same virtual axis as the grid and the card (one period = 60 virtual minutes, lunch = half a slot), and right-to-left languages flip only the column order, as the grid does.

## The type icon gave up its spot

In late September each row got a time-based / period-based icon, justified as "the thing that tells the shape of a timetable when there is no card preview". The silhouette does that job better — a period timetable reads as even slots with an empty lunch band without any icon.

Keeping both was considered. A 28pt icon beside a 40pt silhouette made the left edge heavy and pushed the name right. A tiny type badge in the silhouette's corner was unreadable at 40pt. VoiceOver still reads the type as the row's value, so the visible slot went to the silhouette alone.

## Where it stands

Line widths and gaps are tuned for 40×52pt; a smaller use would need new constants.

## 2026-11-04 — Android got the same thumbnail

![Android timetable list with a silhouette on each row, the selected row outlined](/blog/timetable-list-row-thumbnail/android-titles-light.png)

![The same list in dark mode](/blog/timetable-list-row-thumbnail/android-titles-dark.png)

The Android title list now swaps the 28dp kind icon for a 40x52dp silhouette, drawn on a `Canvas` with plain rectangles for the same reason as on iOS: shrinking the card preview would lay out text per row and leave only color blobs at 40dp. The coordinates come from a pure function. Period timetables use the same virtual axis as the card preview, with lunch as an empty band, and right-to-left day order is flipped once there, never in the drawing code. There is no cache and no offscreen render, so an edit shows up on the next composition.

The kind icon is gone visually, but a screen reader still hears the kind as the row's state description. The thumbnail itself is hidden from accessibility as decoration.

## 2026-11-11 — The calendar list follows the same two views

The calendar segment of the same sheet was a plain list of names with swipe-to-delete, a grammar the timetable side had already dropped. The view-style button now applies to both segments, and duplicate, rename, delete and reorder live in edit mode on both.

![Calendar card view: this month's grid with colored bars under the days that have events](/blog/timetable-list-row-thumbnail/calendar-month-card.png)

Each calendar's card is the current month, paged sideways. Unlike the timetable card, it is not a baked image. A month is 42 day cells and a few bars, so the card is built from the same parts as the real month view and changes whenever that view does. What got cheaper is the data: the whole grid is resolved in one pass and grouped by date, where per-cell lookups would run 42 times per card. A test compares the two per day. The month shown is today's, not wherever the calendar was last scrolled, because a list is for comparing calendars side by side.

![Calendar title list: a small month on each row, days with events filled in the event's color](/blog/timetable-list-row-thumbnail/calendar-title-rows.png)

In the title list, the 40×52pt slot holds a small month drawn on a `Canvas`: at first one square per day filled with the first event's color (the picture above). That version lasted a day; it is now a scaled-down month card, for the reason in the 2026-11-12 section below.

### After a delete, every button went dead

Deleting a calendar in edit mode should hand the target to the next one. The delete worked, but the target vanished and duplicate, rename and delete were all disabled. The screen right after the alert closed looked fine; it only showed on the second delete.

The list state was one struct passed down as a `@Binding`, and the alert's `isPresented` was a binding built from one of its fields. Logging showed the setter being called twice on dismissal: the first call sees the state after the delete, the second, 35 ms later, sees the state from before it. Writing one field through a struct binding reads, modifies and writes the whole struct, so the second call put the deleted calendar back as the target. A guard in the setter does not help, since the stale copy passes it too. The state is now an `@Observable` class, so a field write goes to the one live object. Anything confirmed through an alert now gets one more step after it closes.

Not yet checked on iPad widths, the foldable iPhone, or a real device.

## 2026-11-12 — The small month has to be the big month, shrunk

After a day of use, the small month and the month card did not read as the same calendar. The card has white cells, a day number, and colored bars under it. The small month was a mosaic of color-filled tiles. Switching views flies the card into its row thumbnail, and it landed as a different drawing.

![The small month at real size, enlarged four times, and the month card: the same bars on the same days](/blog/timetable-list-row-thumbnail/calendar-thumb-month-style.png)

The thumbnail is now the card in miniature: hairlines between weeks, a 1.5pt dot where the day number goes (a filled circle for today, weekend colors, dimmed neighbors), and the day's event bars underneath in the card's order, as many as the row height holds: two in a six-week month, three in a five-week one.

The original reasoning was that numbers and four bars are unreadable at 40pt. True for the numbers, but the thing that needs to survive is the shape, "a mark with colored lines under it", and dots and 1pt bars keep it. Still one `Canvas` pass at the same size. Not yet checked in the real list, in right-to-left languages, or on iPad.

## 2026-11-13 — One line of text next to the picture: what is on now, what comes next

Even with the silhouette, a row was a picture, a name, and a lot of empty space. The thumbnail already makes the row tall enough for a second line, so the question was only what to write there.

The rule: write what the picture cannot say. Day range, hours, and event count are already in the silhouette. What you can answer without opening the timetable is "what is happening now, and what is next". The logic is the one the widget and the Siri shortcut use, and the first version borrowed the widget's wording too.

![First version, with the widget's wording: no end time for the event in progress, and a finished day reads only "Done for today · Mon 11:00"](/blog/timetable-list-row-thumbnail/row-status-first.png)

On screen, two of those sentences fell short. A widget can stop at "Now · English", but in a list the next question is "until when". And "Done for today · Mon 11:00" never says what is at 11 on Monday.

![Final version: the row in progress carries its end time, and a finished day names the next event with its day and time](/blog/timetable-list-row-thumbnail/row-status-final.png)

| State | The row says |
|---|---|
| An event is in progress | Now · English · until 17:05 |
| More events later today | Next · English 13:00 |
| Today is over or empty | Next · Music Theory · Mon 11:00 |
| Nothing in the next week | No events today |

Calendar rows follow the same rule, looking seven days ahead. Each row recomputes on its own every minute.

One thing went in and came back out: a small bell at the end of rows whose timetable has alarms. The app removed its per-timetable alarm switch two months ago, and a bell in that spot reads as something you can tap. The two new sentences shipped in all eighteen languages. Later the same day the remaining states went on screen: 12-hour time, dark mode, Arabic, iPad, and the folding iPhone. One thing broke. A one-line limit truncates at the tail by default, so a long title pushed out the end time, the very thing this line added.

![Bottom row: a long title shrinks in the middle and the end time stays](/blog/timetable-list-row-thumbnail/row-status-long-title.png)

Truncation now happens in the middle. Splitting the title into its own text would look cleaner, but where the time sits in the sentence differs per language. Not yet checked on a real device or on Mac.

## History

- 2026-11-03 — silhouette thumbnails in the title list, replacing the type icon.
- 2026-11-04 — Android port: `Canvas` silhouette, pure-function coordinates, kind read as state description
- 2026-11-11 — the calendar list gets both views: a month card and a small month per row; an alert setter writing back a stale struct copy
- 2026-11-12 — the calendar thumbnail becomes a miniature of the month card: day dots, event bars, week lines; the filled-tile version is gone
- 2026-11-13 — a second line per row: what is on now and what is next, with the end time and the next event's title; the alarm bell was tried and dropped
- 2026-11-13 — remaining states checked on screen; long titles now truncate in the middle so the end time survives
