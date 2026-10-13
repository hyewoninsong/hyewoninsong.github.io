---
title: "How saved data disappears quietly — eleven holes from one audit"
date: 2026-10-13T19:51:49+09:00
app: "timetable"
tags: ["devlog", "data", "android"]
summary: "A day spent reading the save-file path and the time/period switch in the timetable app turned up eleven ways user data could change or vanish. None crashed. Every one ended as a success."
---

I spent a day reading how the timetable app loads and saves its file, and what happens when a timetable switches between the time axis and the period axis. Eleven paths let user data change or disappear without a word. None of them crashed. Each ended in what the code called success, which is why no report and no alert ever fired.

## Three things a user now sees

**A failed save shows an alert.** The save function returned a Bool and every caller dropped it. Edit on a full disk, quit, and the session was gone while the screen had shown every edit as done. Now the first failure in a streak raises one alert and the next successful save dismisses it. Alerting on every failure would block editing on a full disk; a banner is too quiet for something you must stop and check.

**An unreadable file is not a first launch.** When the file exists but cannot be read, the app first re-reads the widget's app-group copy, which every save had been writing with the same bytes. One copy was the other's backup, and nobody had ever read it back. If that also fails, the app says once that it started a new timetable and kept the old file aside. Refusing to save anything would repeat the notice on every launch.

**Switch then ✓ is one undo.** Pick "period-based" in the settings sheet, press ✓, and the alert promised undo would restore everything. It took two presses, and the state after one was a period timetable with deleted classes piled onto the last period. Now the sheet registers one snapshot before the first switch and its remaining saves bypass the undo manager. An explicit `beginUndoGrouping` held open across run loops would mix in another window's registrations and throw on `undo()`.

## Failures that looked like success

- **A fallback is a loss.** A broken period list opened as a time-based timetable and only logged a report. No copy was kept; the next save erased the periods for good. A report measures frequency, a copy restores. Every decoder fallback now counts as a loss and quarantines the original.
- **An entrance without the counter.** File import called the same lenient decoder without the loss counter. The hook is optional, so leaving it off passes silently. A file with `"schedules": "x"` imported as an empty timetable, successfully. Import has no copy to fall back on, so a partially broken file is rejected whole.
- **Empty means first launch.** The empty load from an unreadable file created a default timetable and saved it; the save triggered alarm sync against an empty list, cancelling every alarm.
- **One value blocks the whole file.** A minute value above 1440 made the encoder throw. `Codable` propagates one nested throw to the root, so one schedule blocked every save until relaunch. The value is now clamped and reported.
- **One backup slot.** `.backup` and `.corrupt` were a single file each. A new-old-new version round trip overwrote the only pre-loss copy with the trimmed file. Names now carry stamp and time, five copies kept.
- **A stored value as a loop count.** Midnight wrapping for the alarm offset was `while total < 0 { total += 1440 }`. A stored `1000000000000` froze launch for minutes, `Int.max` forever. A hang, not a trap, so Crashlytics saw nothing. Capped at one week, computed with one division.
- **Reports in one bucket.** Fifteen report sites were missing from the Crashlytics code table and collapsed into code 0. A source-reading contract test now fails on any unregistered site.

## When an axis uses two predicates, the alert cannot count

A 9-to-16 period timetable with an imported 19:00 class. Change break minutes from 0 to 10, press ✓: the alert says 0 deleted, 0 adjusted, and the stored time moves to 15:30 with its alarm. The function that settles schedules onto the axis skipped anything overlapping no slot; the function that remaps schedules on a rule change had no such guard and saved the drawing clamp's position. The alert counts what settling changes after remapping, so a move made by remapping was outside its definition. One overlap predicate now feeds all three.

A 13:00–14:00 lunch-slot schedule opened in the edit sheet stretched into the fifth period at once, and ✓ saved 14:00–14:30 even if only the alarm changed. The half-slot index read the start as period 5's first half (8) and the end as period 4's second half (7); `max` folded the inverted pair into 8...8, a slot that does not exist. An inverted reading is a "no place for this" signal, not something to fold.

## Save on tap, save the rest on ✓

The kind switch saves on the radio tap, because the grid derives from the stored kind. Classes that fit no period are counted and confirmed only on ✓. If the app died in between, the next launch saw "period kind plus real-time schedules" and settled them silently; the pending state lived only in view `@State`. It is now a stored marker, and a relaunch with the marker set reverts the switch. Re-showing the alert on launch would mean rebuilding its count outside the sheet; deferring the switch to ✓ was ruled out by the same derivation argument.

## Why it was missed

Each change passed its own tests. Quarantine tests covered persistence and never asked what the store did with an empty load. Switch tests called switch and settle in one test, never recreating the store between them. The manual "open and ✓ is lossless" cases all used in-period classes. Underneath, three assumptions: empty means first launch, the save version only bumps when fields change, and a hostile-file check expects "does not trap" rather than "returns in bounded time".

## What remains

There is still no way to pull the quarantined and backup copies out through the Files app; the alert only says they are kept in the app's documents folder. Turning on file sharing and letting import accept a whole save file is next.

## 2026-10-13, evening — the full suite found two more, and off-axis times are gone

With all eleven merged, the full suite of 2,204 tests ran on main. Two failed: one change renamed the quarantine copy to keep several, and another change's test still read the fixed `.corrupt` name. Parallel fixes collide first on append-only lists (test-case IDs, report-code tables) and then in the gap left by "I ran my own tests". Everything passes now.

The deferred evening-class case is decided too. On a seven-period timetable (9:00–16:00), an imported 19:00 class lived in three places at once.

| Where | Time |
|---|---|
| The block on the grid | 15:30 (drawn in the last half-slot) |
| Stored value and alarm | 19:00 |
| Open the edit sheet and tap ✓ | stored value becomes 15:30 |

The rule we chose: **a period timetable has no time outside its periods**. The function that settles stored values now pulls off-axis classes to where they were drawn and counts them, and importing a file shows "Events Moved to Fit Periods" once with the count.

Two alternatives lost. Guarding only the edit sheet is small but leaves a block at 15:30 with an alarm at 19:00. Drawing off-axis classes in a separate band loses nothing, but keeps clock-time data inside a period model, and the grid, export canvas and widget would all need to learn the new row.

The cost is that it cannot be undone; after settling, 19:00 survives only in the backup copy and the original file. So one more path changed with it: tapping "Period" to preview and then "Time" again, without ✓, no longer snaps anything. Only ✓ settles.

## 2026-10-13, final pass — a sheet that saves on close also closes without the user

One more walk over the same three paths, this time with invariants instead of cases. A fixed-seed generator builds random timetables and period rules and checks that what is saved is what loads, that switching kind and back keeps every event and id, and that the events removed by a period-rule change are exactly the ones the alert counted. 40 files, 1,500 switches, 400 rule changes. Storage and counting held; a build with the counter deliberately broken failed in 162 places.

The hole was in the sheet. The timetable settings sheet has no cancel: closing it saves. Only when a narrower range would delete events does it ask first, and it did that by blocking the swipe-to-dismiss gesture. That blocks the user's way out, nothing else.

| How the sheet goes away | Confirmation |
|---|---|
| ✓ | shown |
| Swipe down | blocked, alert shown |
| A widget or file opens another timetable | **none** |
| The iPad window resizes and the layout shell changes | **none** |

In the last two, the screen that presented the sheet is rebuilt, and the content's `onDisappear` runs "closed, so save". Narrow the range to 9–18, tap another timetable's widget, and the 7:00 and 22:00 classes are gone without a prompt.

The fix is one guard: the commit function refuses to save from `onDisappear` when the change needs confirmation. It does not cancel either, because sheet content can detach and reattach; doing nothing is the only choice safe in both cases. The gate belonged in the function, not on the gesture. This path was found by reading code and has not been reproduced on a device; the test covers the commit function and a manual case is filed.

Two more went in with it. Undoing a period change restores a whole-timetable snapshot, and the snapshot carried the list order, so a reorder made in between snapped back and collided with another timetable. And an event added through Shortcuts was not on the undo stack, so undoing an earlier period change removed it.

## 2026-10-13, night — the Android port keeps the rules and changes three mechanisms

The Android app now closes the same holes. An unreadable save file is kept aside and announced once, a failed save raises one alert, a partly broken timetable file is rejected whole, and a period timetable holds no time outside its periods. Three things were not copied as they are.

| Where | iOS | Android |
|---|---|---|
| Recovery after a failed read | restores from a last-good mirror | no mirror; the original is moved aside and that copy is the record |
| Remembering "announce once" | decided at launch | a marker file in the save folder |
| Type switch + ✓ as one undo | an undo group | the tap pushes nothing; ✓ pushes the pre-switch timetable once |

The mirror lost on cost: a second write on every save brings its own corruption cases, and the Android app has not launched, so there is no installed base to protect. It comes back if read failures show up in reports.

The marker file exists because of the widget. Android widgets read the save file directly. If the widget reads the broken file first and moves it aside, the next app launch looks exactly like a first run. With only an in-memory flag, the app would save a default timetable and cancel every alarm.

Alarms are left alone in that state. The screen shows an empty timetable, but registered alarms stay until the user changes something and that save succeeds. Selecting a timetable does not count as a change, because a widget tap or a link selects one too. One limit remains: a reboot in this state loses the alarms, since the system clears them and there is nothing readable to re-register from.

Undo was not ported as a group. A grouping API has to be closed on every way out of the sheet (✓, X, back, swipe, alert, process death), and one missed path merges everything after it. The type tap now writes without touching the undo stack, and ✓ applies the rules, deletions and settling in one write, pushing the timetable the sheet opened with. Quit before ✓ and the next launch shows the timetable from before the switch.

The port finished with every group's tests green. The first unfiltered run of all 1,723 found two red: an older test expecting the previous error type, and a new test comparing file bytes that contain a save timestamp. Group runs execute only their own files, so a test in a file no group owned had never run. The procedure is being changed so the last stage runs everything once.

On a device I have seen only that a fresh install launches and relaunches after a force stop. The read-failure alert, alarms after relaunch and reboot, and the save-failed alert rest on tests and code reading; manual cases are filed.

## History

- 2026-10-13 — save/load and kind-switch audit, eleven holes
- 2026-10-13, evening — two more from the full suite; off-axis times removed
- 2026-10-13, final pass — invariant fuzz tests; save-on-disappear bypassing the confirmation
- 2026-10-13, night — Android port: kept copy instead of a mirror, marker file, one undo without grouping
