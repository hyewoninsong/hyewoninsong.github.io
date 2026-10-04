---
title: "The animation code was right there — the alarm banner still snapped in and out"
date: 2026-10-04T18:10:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "alarmkit"]
summary: "A `.transition` modifier was already on the view. It still never animated — because `.animation(value:)` and `withAnimation` promise different things, and the banner only had the one that doesn't cover insertion/removal."
---

SuperTimetable shows a banner inside the app while an alarm is ringing — a safety net for the case where tapping the lock-screen card brings the app forward without actually stopping the alarm. The banner had a `.transition` modifier from the start, meant to slide down on arrival and back up on dismissal. In practice it never moved like that. It just snapped.

## The animation code was already there

The conditional looked like this:

```swift
if !showSplash && !store.alertingAlarms.isEmpty {
    AlarmRingingBanner(alarm: alarm) { store.stopAlertingAlarm(id: alarm.id) }
        .transition(.move(edge: .top).combined(with: .opacity))
}
```

and elsewhere on the same view:

```swift
.animation(.spring(response: 0.4, dampingFraction: 0.85), value: store.alertingAlarms)
```

Both lines are animation-related. It's easy to read "there's a `.transition` and an `.animation`, so this is handled" and move on — which is exactly what happened the first time around.

## `.animation(value:)` doesn't drive insertion or removal

`.transition` plays when a view is **inserted or removed** from the tree. For that to animate, the state change that causes the insertion/removal has to happen inside an animation transaction — a `withAnimation { … }` block.

`.animation(_:value:)` promises something different: "when this value changes, apply this curve to animatable changes inside this subtree" — color, position, size. When the value that decides whether a conditional view exists at all changes through a plain assignment, `.animation(value:)` sitting on an ancestor doesn't make that appearance or disappearance animate.

The store was doing plain assignment:

```swift
private func updateAlertingAlarms(_ ids: [UUID]) {
    alertingAlarms = Self.alertingAlarms(ids, in: timetables)   // plain assignment
}

func stopAlertingAlarm(id: UUID) {
    ...
    alertingAlarms.removeAll { $0.id == id }   // also plain
}
```

Both are ordinary mutations, no transaction. The `.animation(value:)` on the view was watching, but the change it was watching decided whether the banner's conditional branch existed at all — and that's the one case it doesn't cover.

The same file had the opposite example sitting right below. The thank-you card shown to loyal users dismisses like this:

```swift
ReviewThanksCard {
    withAnimation(.easeOut(duration: 0.25)) { reviewPrompt.dismissThanks() }
}
```

Here the state change is wrapped in `withAnimation` right where it happens, in the button action. That dismissal fades out correctly, and always had. Both the working pattern and the broken one were in the same file.

## The fix is moving where the animation lives

Remove the view-side `.animation(value:)` and wrap the assignment itself:

```swift
private static let alertingAlarmsAnimation: Animation = .spring(response: 0.35, dampingFraction: 0.85)

private func updateAlertingAlarms(_ ids: [UUID]) {
    withAnimation(Self.alertingAlarmsAnimation) {
        alertingAlarms = Self.alertingAlarms(ids, in: timetables)
    }
}

func stopAlertingAlarm(id: UUID) {
    ...
    withAnimation(Self.alertingAlarmsAnimation) {
        alertingAlarms.removeAll { $0.id == id }
    }
}
```

This couples the store to `Animation`, a SwiftUI type — but the store already imports SwiftUI for `@Published` and color types, so that boundary was never clean. And the assignment happens from more than one call site (a Combine subscription callback, a button action); defining the curve once, where the state actually changes, beats hoping every caller remembers to wrap it.

One more thing needed fixing: when one alarm is dismissed and another takes its place in the banner, the view is still "the same" conditional branch — without an identity hint, SwiftUI just swaps the title in place. Adding `.id(alarm.id)` to `AlarmRingingBanner` makes each alarm a distinct view identity, so switching alarms reads as a remove-then-insert, and `.transition(.opacity)` on it now crossfades the title instead of cutting.

## What didn't get a screenshot

This one shipped without one. The banner only appears while a real alarm is ringing, which the simulator and XCUITest can't trigger on demand. Instead, a source-contract test pins the mechanism directly — it asserts the assignment is wrapped in `withAnimation` — so if someone edits this method later and drops the wrapper, the test catches it before the banner goes back to snapping.
