---
title: "How saved data disappears quietly — eleven holes from one audit"
date: 2026-10-13T14:52:00+09:00
app: "timetable"
tags: ["devlog", "data"]
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

Each fix ran only its own tests; a full-suite run on merged main is pending. Evening classes after the last period are still pulled into the last half-slot on open, pinned by an October 9 decision and judged separately.
