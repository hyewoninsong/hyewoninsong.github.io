---
title: "The alarm card had no countdown, because both ways to write one were wrong"
date: 2026-10-04T12:39:10+09:00
app: "timetable"
tags: ["devlog", "swiftui", "alarmkit"]
summary: "SuperTimetable's lock-screen alarm card only showed the fire time, never a countdown. The two SwiftUI APIs for a self-updating relative time each had a flaw, so the fix used a value the system already had."
---

When a SuperTimetable alarm shows up on the lock screen, the card only ever had the fire time on it — never a "in 5 minutes" line. That wasn't an oversight. The two ways to write a live-updating relative time in SwiftUI both had a flaw.

## Only two APIs could write a ticking number

A Live Activity is not a widget. Widgets get a timeline, so they can ask the system to redraw every few minutes. `ActivityConfiguration` has no such periodic refresh — the card only redraws when the app pushes a new content state, and an alarm has nothing left to do once it's scheduled.

Within that constraint, two SwiftUI APIs can show a relative time.

`Text(date, style: .relative)` updates itself automatically, but it only prints a bare number ("5 minutes") with no "in" or "ago". The card's second line already says "5 minutes before class" — a third line that just says "5 minutes" again gives no way to tell which number is which.

`Text(date, format: .relative(...))` prints the full phrase, "in 5 minutes". The catch: on a screen with no periodic refresh, that string **freezes at the moment it renders**. It's correct the instant the alarm fires, and a lie an hour later. Nothing about a single screenshot would catch it.

So the card shipped with neither — just the absolute fire time ("2:05 PM"), which can't go stale, leaving the user to do the subtraction themselves.

## The system already had the value

A third API exists: `Text(timerInterval:countsDown:)`. It takes a `ClosedRange<Date>` and counts down inside it on its own, driven by the system rather than by view refreshes.

The missing piece was where to get that range. Our alarms are scheduled as relative, repeating weekly rules — the app never computes the exact next fire date, AlarmKit does.

Looking at AlarmKit's own interface turned up the answer: the `AlarmPresentationState` passed in through `context.state` already carries it. While an alarm is pending, its `.countdown` mode holds a `startDate` and a `fireDate` — exactly the range `Text(timerInterval:)` wants. Nothing on the app side — the metadata, the scheduling service — needed to change. The system was already handing over the computed value.

## The stopping point was free too

The last question was what happens after the alarm fires. Past the end of a `ClosedRange`, `Text(timerInterval:)` simply freezes at zero on its own; the API has a `pauseTime` argument for an explicit stop, but it wasn't needed here.

The two states without a `fireDate` — `.alert` (actively ringing) and `.paused` — just drop the countdown line entirely; both are short, rare windows where the absolute time alone is enough.

The same secondary line went into the Dynamic Island's expanded view. The compact and minimal regions, around 20pt, don't have room for a second row of digits, so they keep the plain alarm symbol unchanged.

## No screenshot for this one

This change has no screenshot. A lock-screen Live Activity can't be produced in the Simulator, and XCUITest can't capture it either — it only appears with a real alarm scheduled on a device. So this one is pinned down with source contract tests instead of a picture. Set an alarm and look at the lock screen, and the small number under the fire time counts down once a second.
