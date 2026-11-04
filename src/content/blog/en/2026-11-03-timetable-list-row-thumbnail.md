---
title: "The title list now shows a silhouette of each timetable"
date: 2026-11-04T16:00:16+09:00
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

## History

- 2026-11-03 — silhouette thumbnails in the title list, replacing the type icon.
- 2026-11-04 — Android port: `Canvas` silhouette, pure-function coordinates, kind read as state description
