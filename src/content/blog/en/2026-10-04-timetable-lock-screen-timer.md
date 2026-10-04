---
title: "A lock screen widget's countdown that updates without a new widget render"
date: 2026-10-04T13:05:02+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "The time left until a class starts or ends now counts down on the lock screen, second by second, without the widget redrawing. SwiftUI's timer-interval text subscribes to the system clock directly."
---

Timetable's lock screen widget shows today's current or next class. It used to show just the start and end time — "19:00 – 20:00." The phone already knows what time it is; what it didn't tell you was how long you had. Now there's a number for that too, and it counts down on its own: "19:00 – 20:00 · ⏱ 12:34."

## What changed

The rectangular lock screen layout keeps its three lines — status ("Next · Swim 20:00"), time range, timetable name — and the inline layout compresses to "title · time left." Both follow the same rule: counting down to the end if the class is in progress, to the start if it hasn't begun yet.

The number isn't pushed by new widget data. SwiftUI has `Text(timerInterval:countsDown:)`, which takes a start and end Date and redraws itself every second against the system clock — no new WidgetKit timeline entry required. All the widget has to supply is which two Dates to count between: for an in-progress class, from (when this entry was built) to (when it ends); for an upcoming one, to (when it starts). Once that range is set, the text runs on its own.

## Why this, and what lost

SwiftUI has two timer-style texts. `Text(date, style: .timer)` counts up or down from a single reference point. `Text(timerInterval:)` takes a closed range and counts within it, with `countsDown` choosing the direction. Both update without new entries, but our two cases ("until it ends," "until it starts") are both bounded intervals, so the range-based one fit without us reformatting anything.

The bigger question was whether this needed a new translated string. This app had exactly that kind of caption once — "starts in 1h 46m" — and killed it the same day it shipped, because it changed the look of the Today widget header and an in-app chip more than anyone wanted. That decision still stands; this change doesn't touch those two spots. It lands somewhere new (lock screen only), and the number itself needs no translation — `timerInterval` formats "12:34" using the system locale on its own. No string, no new keys.

## Where it tripped

Picking the lower bound of the range was the fiddly part. The honest answer is "now" — but this codebase has a rule against reading `Date()` inside widget view code, because WidgetKit pre-renders entries ahead of time; a bare `Date()` call freezes at whatever moment the timeline was built (that's exactly what caused an earlier bug where a widget read "8:54" at 8:55). So the lower bound is the entry's own timestamp instead. That's fine — `Text(timerInterval:)` itself ticks off the real system clock, so the displayed number stays accurate even though the range's lower bound is a few seconds stale; it only marks where counting started, not how much time has passed since.

One more thing: if the range were ever built backwards — end before start — `ClosedRange` construction traps. The status logic already guarantees the end is later than now for an in-progress class, but to avoid any minute-boundary edge case flipping that by a second, the two dates get sorted into lower/upper before the range is built.

## What's left

Lock screen widgets don't have a capture mirror the way home screen widgets do — there's no way to render the same view inside the app and screenshot it. So this one shipped with the date math covered by unit tests, and seeing the number actually count down on a real lock screen is still on the list.
