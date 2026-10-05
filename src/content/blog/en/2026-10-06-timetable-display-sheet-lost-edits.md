---
title: "Changing the period count did nothing — the live preview was rewinding itself"
date: 2026-10-06T02:45:00+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "Two bugs where the screen changed but nothing was saved: a reload trigger derived from the preview, and a sheet whose onDisappear fired before it was ever dismissed."
---

On a period-based timetable with the lunch row shown, lowering the period count from 7 to 5 left the grid at 7. The lunch switch turned itself back on. Fixing it uncovered a second bug in the same sheet. Both looked the same from outside: the screen changed, the save did not.

## Moving the preview rang the "saved data changed" bell

The display sheet has no cancel. Wheels drive the grid behind it live, and the sheet saves once when it closes. The grid therefore holds three layers of the same values:

| Layer | What it is |
|---|---|
| Saved | the timetable on disk |
| Preview state | what the sheet is currently dialing (`@State`) |
| Display value | computed from both; what the grid draws |

When saved data changes (undo, import) the grid reloads its preview state from it. The trigger was the problem:

```swift
.onChange(of: timetable?.endHour) { _, _ in loadTimetableSettings() }
```

`timetable` here is the display value, not the saved one. Once the preview diverged from the saved axis, it was computed through a different branch that dropped the lunch row: 8 slots became 7. That change was read as "the saved timetable changed", and the preview was reloaded from disk.

```
endHour 8 -> 7                  ← wheel 7 → 6
reload preview=6 stored=7       ← preview rewound
save previewCount=7             ← the checkmark saved the old value
```

With the lunch row off, both branches agree, which is why it went unnoticed. The fix: the reload trigger reads only saved fields.

## The regression test was green before the fix too

I wrote a UI test — create a timetable, turn lunch on in the sheet that opens automatically, reopen, lower the count — and it passed. It also passed on the unfixed code.

Logs showed the premise never held. The lunch row turned on in that first sheet was never saved, so the first bug's condition never existed. "Never saved" was the second bug.

## A sheet's onDisappear does not mean it was dismissed

Every way out of this sheet commits, so its content also commits in `onDisappear` to catch swipe-dismiss, guarded by a once-only flag. Right after creating a timetable, the sheet is presented while the list sheet is still going away:

```
35.899  onAppear
35.905  onDisappear        ← 6 ms later; the once-only commit is spent here
36.188  onAppear           ← reattached 0.28 s later, @State intact
50.538  onDisappear        ← the user's checkmark: "already committed", nothing saved
```

SwiftUI detached and reattached the content, keeping its state. The sheet the user saw was already committed. The grid followed every change; relaunching the app brought the old values back.

Now a commit made in `onDisappear` is marked as possibly spurious and reopened if the content appears again. An explicit checkmark commit is not reopened. Delaying the presentation further was not an option — there was already a 0.6 s delay, and the overlap depends on device and motion settings.

## What I keep from this

- A trigger that reloads from saved data reads only saved data.
- A once-only action in `onDisappear` needs a way to reopen in the matching `onAppear`.
- Don't verify a save by reopening the same screen; relaunch the app.
- Run a new regression test against the unfixed code once. This time, that run found the second bug.
- For toggles, test turning off something that was saved on, not just turning on from the default.
