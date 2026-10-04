---
title: "The events were arriving. The reports couldn't break them down."
date: 2026-09-23
app: "timetable"
tags: ["devlog", "data"]
summary: "Registering analytics parameters as custom dimensions taught us that the value's type and vocabulary decide whether registration is even possible — and that fifteen of twenty logging wrappers were never called."
---

SuperTimetable sends an event when you create a schedule, pick a color, or share a timetable. To break those down by weekday or by share method in a report, each parameter has to be **registered** as a custom dimension. Pulling together the list of candidates, we found we had mostly been sending values that would register into empty or split columns.

## Registration isn't retroactive

A parameter only shows up in reports for data collected **after** you register it. Data already stored with the wrong vocabulary can't be repaired. That leaves exactly one order of operations: fix the values, then register. So the job stopped being "what should we register" and became "what is even registerable".

## Three things that block a value

**One: `Bool` isn't a string.** A Swift `Bool` placed in `[String: Any]` bridges to `NSNumber` on the way into the SDK, and Firebase files it as a *numeric* parameter. It never appears as a text-dimension candidate, and registering it as a metric gives you the average of a lock toggle. Send the word instead:

```swift
private func flag(_ value: Bool) -> String { value ? "true" : "false" }
return ["is_locked": flag(isLocked)]
```

**Two: a localized string splits the dimension.** We were reusing the on-screen weekday name. Across five locales, one Monday arrives as `월`, `Mon`, and `月`. Worse, editing a translation splits it again while past rows keep the old wording. The fix is a second property whose only job is stability:

```swift
var analyticsKey: String {   // mon, tue, … — never localized
    switch self { case .monday: return "mon"; /* … */ }
}
```

Settings go out as `rawValue`; colors as a palette slot name (`basic_0`…`pastel_9`). A user-created color's hex never leaves the device — its vocabulary is unbounded, and sending user-authored values isn't something this app does.

**Three: a default nobody overrides.** The schedule-edit event carried a parameter saying what kind of edit it was. Its default was `"general"`, and no call site ever passed anything else. Registered, it would produce a table with one column.

There were two ways out. We could pass a value at every call site — but the edit sheet saves title, color, time, alarm and notes *at once*, so the caller genuinely doesn't know the classification. So we stopped asking for the value and derived it: compare against the previous schedule and name the field that changed, or `multi` when several did.

We picked that because of what comes next. New save paths now classify themselves, which is the opposite of a default quietly hardening. Only the paths where the gesture *is* the meaning (drag, resize) still state their value, and edits reached by undo are tagged `undo` so they don't mix with edits people made.

## A defined event is not a collected event

With the vocabulary fixed, we counted call sites. **Fifteen of the twenty logging wrappers had none.** Having a case in the event enum had been mistaken for the event being collected.

Some were worse than unused — their features were already gone. The timetable overlay mode was removed in save-file v5; color favorites have a store but no UI; a "premium" color tier never existed in this app. And the widget-configuration event is impossible by construction: the widget target has no Firebase, so the only thing the app can observe is the deep link fired when someone taps the widget.

So the wrappers with a real place to fire got wired (fifteen of them — opening a timetable, entering edit mode, moving, duplicating, picking a color, changing settings), and the ones with nowhere to fire were **deleted**. Left in place, a stale case reads to the next person as a collected event. That misreading is what started this whole audit.

## Why it went unnoticed

Firebase rejects none of this. There is no type warning and no cardinality warning. And DebugView and the realtime report show raw parameters without any registration — so it all looks fine. Registration is the next step, and that's where it surfaces.

We added a contract test so it surfaces in code instead: any `Bool` among a sample event's parameters fails, `is_`/`has_` values must be exactly `"true"` or `"false"`, and weekday keys must be fixed ASCII. The test has its own trap — an event missing from the sample array isn't checked — so "add a line to the samples" is now written down as part of adding an event.

## Where it stands

The vocabulary is clean; the console registration is next. Dimensions: share method, error type, error context, edit type, move type, setting key, color name, weekday. Metrics: schedule duration, timetable count, total schedule count, session length. Only data from the registration date forward will appear, so it'll be a few days before we know this was right.
