---
title: "Past midnight, 'today' was still yesterday — Date() in a computed property is only read on re-render"
date: 2026-11-26T13:26:10+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "Leave the app open across midnight and the today highlight stayed on yesterday until you touched the screen. The cause was a computed property reading Date(), and a test step that hid it."
---

Leave the timetable open across midnight and the "today" marker in the weekday header stayed on yesterday. Scroll once, or open a sheet, and it jumped to the right day. It now follows within 30 seconds without a touch.

## A bug that touching the screen fixes is invisible during development

Today's column was computed like this:

```swift
private var windowToday: Date {
    DayWindow.resolve(now: Date(), startHour: startHour, endHour: endHour).day
}
```

It reads correctly: every call resolves today from the current time. The question is when it gets called. SwiftUI re-evaluates `body` when state the view read has changed. `Date()` is not state. Time passing is not an event SwiftUI sees, so this property is only re-read when the view happens to re-render for some other reason.

The same screen has a 10-second timer that moves the current-time line. That timer only changes `@State` owned by the child views that draw the line. The children re-render; the parent that computes today and hands it to the header does not.

While developing, we touch the screen constantly, so the parent kept re-rendering and today was always right. The bug only appears when the app sits untouched, like an iPad propped on a desk.

## Re-render only at the moment the day changes

Putting a 30-second timer on the parent would work, but the parent holds the whole grid. We did not want to re-evaluate it twice a minute for nothing.

The check lives in a small modifier instead:

```swift
.onDayRollover(currentDay: { /* today, right now */ }) {
    dayRolloverTick &+= 1
}
```

Every 30 seconds, on the system's significant-time-change notification, and when the app becomes active, the modifier reads today again. If it matches the last value, nothing happens. If it differs, it bumps one integer on the parent. The today property reads that integer, so the parent re-renders once, at the moment the day turns.

A midnight notification alone is not enough here. A day in this app can end after midnight: with an end time of 2 a.m., Tuesday 01:30 still belongs to Monday's column. The rollover time differs per timetable, so the modifier has to ask periodically.

## The test procedure was hiding the bug

The suspicion had been written down 47 days earlier, from reading the code. The manual test for it had a step that said: "touch the screen a few times so it redraws." The step that removes the bug was part of the procedure, so the test always passed.

The step now reads: "without touching the screen, wait one minute past midnight." A test for a time boundary needs a step where you do nothing.

## Where it stands

The weekday header and the calendar month view share the modifier. A unit test guards that it only fires when the day changes; the real midnight crossing still needs a manual check with the clock set by hand. For any display computed from `Date()`, the question to answer is what makes this view re-render.
