---
title: "Turning a week stuttered because every date cell built its own DateFormatter"
date: 2026-11-22T15:22:06+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "On wide screens, swiping the calendar to the next week froze for about 0.15s on release. The profiler's top item was a DateFormatter created per cell; second was a full calendar save on every week turn."
---

On wide screens (iPad landscape, an unfolded iPhone Duo) the calendar shows the month on the left and the week on the right. Swiping the week grid froze the screen for 0.15–0.18s right as the finger lifted. That stutter is now noticeably shorter.

## Measure first

Frame timestamps from the reported recording showed 183ms and 150ms with no new frame, at swipe start and at release. To see what the main thread was doing, we seeded a calendar with two daily series spanning a year, had a UI test turn the week eight times with a recurring event selected, and attached Time Profiler. A simulator app can't be attached by host PID ("Cannot find process"); `xctrace record --device <UDID> --attach <app name>` works. We then ranked main-thread samples by frames from the app binary only.

## Number one: a DateFormatter per cell

The top app-code cost, about 530ms over 14 seconds, was the date-to-text helper. It created a `DateFormatter` and called `setLocalizedDateFormatFromTemplate` on every call. Each call is cheap; the count was not. Forty-two month cells and seven week-header cells each build a VoiceOver date label, and turning the week redraws both.

Formatters are now cached by template, locale, calendar and time zone, and callers only format with them. The time zone is part of the key because a formatter keeps the zone it was created with.

## Number two: a full save on every week turn

With a recurring event selected, the selection follows the series into the next week. Occurrence ids differ per date, so the selection counted as "newly picked" and stamped `updatedAt` to lift the event above overlapping ones. That stamp saved the whole calendar, resynced alarms, rewrote the widget snapshot, and triggered a second full redraw. If the event is already stamped later than everything else, restamping cannot change the draw order, so we now skip it (ties still stamp).

## The rest

Month cells resolved recurring events one day at a time, repeating per-series setup seven times per row; a row now resolves its seven days in one pass, checked against the per-day result in tests. A temporary counter plus `Self._printChanges()` showed one week turn redrawing the screen in four passes, with the month view tagging along each time. Making the split-view month view `Equatable` cut its redraws from 46 to 21 across eight turns.

## Where it stands

Comparing frame gaps in `simctl io recordVideo` recordings of the same gesture, the median of the ten worst stalls in an optimized build went from about 390ms to about 285ms. The simulator overstates the cost and real devices are not yet checked. The remaining cost is those four redraw passes; merging the last two touches selection ordering that was split on purpose, so it is left for later.
