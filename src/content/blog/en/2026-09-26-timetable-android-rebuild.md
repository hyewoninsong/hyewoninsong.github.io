---
title: "Rebuilding the Android timetable from scratch instead of patching it"
date: 2026-10-13T05:43:16+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "The March port had drifted half a year behind iOS. Rather than layer features onto it, the Android app is being rebuilt: Material 3 on the outside, the iOS grid physics on the inside. The first piece, the grid itself, is in."
---

SuperTimetable for Android is being rebuilt. A port from March existed, but since then the iOS app dropped its theme system, rewrote alarms, and added a tutorial and printing. The two had become different apps with the same name. The first piece landed today: the grid and the way it feels under a finger. The editing sheet, list, alarms and widgets follow in three more steps.

## What changed

![Locked timetable — Material 3 app bar and bottom bar, lock at bottom left](/blog/timetable-android-rebuild/grid-locked.png)

On the outside it is an Android app: top app bar, bottom bar, a `+` button when unlocked. Colors do not follow the wallpaper. Material You dynamic color is off and the accent is the same blue as iOS, because schedule colors are picked by the user from a palette and a wallpaper-tinted chrome fights them.

On the inside the numbers are iOS numbers. Time axis 48dp, day header 36dp, 1.2dp per minute. Unlocking stretches a minute to 1.8dp while the point you were looking at stays put; the scroll offset is re-anchored every frame during the zoom. Overlapping schedules are hatched only across the minutes that actually overlap, and the last one you touched draws on top.

![Selected schedule — double ring, bottom handle, duplicate and delete buttons](/blog/timetable-android-rebuild/block-selected.png)

| Unlocked, you… | and it… |
|---|---|
| press an empty slot for 0.2s and drag | creates a schedule, snapped to 30 minutes |
| press a schedule and drag | moves it; the first 10dp decides horizontal or vertical |
| drag the top or bottom edge | resizes in 5-minute steps, snapping to neighbours within 15 minutes |
| tap the selected schedule again | shows duplicate and delete |
| push past the visible range | squashes the block 8% and bulges the blocked side 6% |

The animations are the iOS spring table, converted: SwiftUI's `response` and `dampingFraction` become Compose `spring(dampingRatio, stiffness)` with `stiffness = (2π / response)²`. Nothing inside the grid uses an ease curve.

## Why rebuild

Adding features to the March code lost on the data model. It stored colors as four RGBA floats, alarms as a bit flag, and a theme index per timetable. iOS had meanwhile moved to a single hex color, two alarm slots, and no themes at all — switching a theme remapped every schedule to another palette and overwrote colors people had chosen. There was even an uncommitted eleven-theme branch on the Android side. Going further that way meant never converging.

Porting everything in one go lost on reviewability. Four steps instead; the first is grid, gestures, undo, and a migration that reads the old save file so existing timetables survive the update. New schedules are created as "New Schedule" for now — the editing sheet comes next.

Copying the iOS screens pixel for pixel lost on Android expectations. App bar, bottom bar and floating button are Android's; the resistance and settle of a dragged block are iOS's. That line is the rule for the whole port.

## Two things that bit

The day header vanished. Eighty-six tests passed, then an emulator screenshot had no Mon, Tue, Wed. A `uiautomator dump` showed the labels existed at y = 16. Material 3's `Scaffold` draws the app bar over the content and only hands it `PaddingValues`; the grid consumed the bottom padding and ignored the top, so its first row sat behind the status bar. The screen test had asserted that the nodes exist. Existing is not the same as visible; new screens now assert the first row's bounds are below the app bar.

The newest Compose BOM compiled but did not build. `compileDebugKotlin` passed, `checkDebugAarMetadata` failed: Compose 1.12 declares a minimum compileSdk of 37 and this machine only has 36. Compilation looks at the classpath; the metadata check is a separate task. The BOM is pinned to 2026.06.01, Compose 1.11.

## Where it stands

Create, move, resize, duplicate, delete, undo — all on the grid. Seven languages, copied from the iOS strings. The editing sheet through alarms, widgets and the tutorial followed; the 2026-10-11 section picks up from there.

## 2026-10-11 — Catching up with 146 iOS commits

This time we ported iOS #830–#974 by **final behaviour**, not commit by commit. Features that arrived and were removed again inside the range (location, biweekly, import from another timetable) were skipped; following the history would have built and deleted them on Android.

The biggest piece is the period axis. The lunch row is now **half a period** tall (30 minutes) and its position is stored as a `lunchFollows` mark on the periods rather than a field on the timetable. The default rule has no lunch; turning it on starts at 60 minutes after period 4. On a period timetable a schedule is now **stored at the time the grid shows**, which fixes a class drawn at 13:50 ringing at 12:25. The edit sheet picks a half-period start and a duration (whole periods only once the timetable has a break; see 2026-10-13).

![Editing a period-timetable schedule: start 3.5, duration one hour](/blog/timetable-android-rebuild/period-edit-panel.png)

Also visible: the display sheet became "Timetable Settings", app lock is gone (including `androidx.biometric`), the list searches names, schedule titles and memos, the review request is a thank-you letter card, and the tutorial has 11 steps.

### What lost

- **Keep the one-hour lunch row**: easier arithmetic, but files shared from iOS would draw lunch differently in calendar, widget and print.
- **Store lunch as its own timetable field**: iOS marks the periods; a file would lose its lunch in one direction.
- **Bump the save version for `lunchFollows`**: an absent key already reads as unknown, and a bump makes iOS say "newer app version".

Three product calls differ from iOS. The lock-screen sheet **keeps Save to Gallery** (share sheets do not reliably offer saving, and wallpapers are picked from the gallery); duplicate **keeps its length**; the first-run intro is deferred because its assets are iOS simulator recordings.

![Lock-screen wallpaper sheet with save and share icons in the header](/blog/timetable-android-rebuild/lock-screen-header.png)

### What went wrong

**The lock-screen sheet crashed on open** with a `StackOverflowError`. A local `fun Float.toDp()` shadowed the `Density` extension: inside `with(density) { px.toDp() }` the nearer local declaration wins and calls itself. The compiler does not warn, and all 1085 unit tests were green because none composes the sheet. Only opening it on an emulator showed it. A source-contract test now bans local `toDp`/`toPx`/`toSp`, and every new sheet gets opened once.

**The edit sheet reopened with the previous draft.** A `viewModel(key = id)` lives in the Activity's store, so reopening restored the old draft, and saving after a move could undo the move. Each open now has its own store, cleared on close; re-reviewing that fix found view models piling up per open, fixed the same way.

Also: an unreadable `timetables.json` is moved aside before the first save instead of overwritten, calendar export inserts the new series before deleting the old one, and parallel agents sharing one worktree and one Gradle overwrote each other's builds.

### Not verified

On the emulator (Pixel Fold, Korean, compact and regular layouts), 7 of 10 flows passed; 3 failed, were fixed and re-run. The last fix round has unit tests only. Not checked on a device: haptics, the real Play review sheet, TalkBack, 12-hour format, light theme, locales other than Korean, drags with the lunch row hidden, calendar export after revoking permission. `lintDebug` reports 36 errors, with the same kinds in files this work did not touch.

## 2026-10-13 — No half periods once there is a break

The half period added two days earlier became conditional. On a timetable with a break between periods, or with lunch, schedules snap to **period lines only**. A class starting at period 3.5 can now exist only on a timetable with no breaks at all. This is iOS #975–#1000, again ported by final behaviour.

The reason is what a half period points at. With 50-minute classes and 10-minute breaks, half a period past 3.5 lands in the middle of a break, and neither the grid nor the edit sheet could explain a block ending there. So an axis with gaps moves in whole periods, the edit wheels list whole periods, and the lunch gap counts as a break. Schedules already stored on a half period are moved onto a line when the file is read.

The default rule for a new period timetable changed with it: 60-minute periods, no break, no lunch. A fresh period timetable has the same scale as a clock timetable and keeps half periods until a break is added.

![Timetable Settings: Type on top, default period rule of one hour and no break](/blog/timetable-android-rebuild/period-rules-default.png)

Timetable Settings is reordered too: Type first, then Hours or Periods, then Days. The "Horizontal Axis" and "Vertical Axis" titles are gone. The confirmation shown when a rule change deletes or moves schedules is now one sentence that counts the two separately, and schedules clipped by lunch count as moved. The ripple on a locked grid lost its colour; iOS uses a glass material, Android draws a light ring with a faint edge.

### What lost

- **Half periods on every period timetable**: with breaks, the end of a half period falls inside a break, not inside a class.
- **No half periods anywhere**: without breaks a half period is exactly 30 minutes and useful, and that is the default rule.
- **Keep 50 + 10 as the default rule**: right for schools, but a new timetable would lose half periods immediately.

### The events counted taps, not completions

Share and print events fired on the button tap, so opening the share sheet and closing it counted as a share. Android has no single "completed" callback for either.

Sharing passes an `IntentSender` to `Intent.createChooser`; a non-exported receiver hears the moment a target is chosen. Whether the target app actually sent anything is unknowable, so the event means "a share target was chosen".

Printing took two tries. The first version counted a print in `PrintDocumentAdapter.onFinish` unless the job was cancelled or failed. Review caught it: when the user closes the preview, the `PrintJob` is not yet cancelled at the time `onFinish` runs, so every cancel counted. The rule was inverted: count only once the job reaches an **accepted** state (queued, started, blocked, completed), re-checking every 250 ms for about 5 seconds. That fix introduced a crash when the system started no job at all, caught in the next review round.

### Not verified

On the emulator (Pixel Fold, Korean) we saw the app launch, the new settings order and the default period rule. Everything else rests on 1409 unit tests and reading the code: the feel of period-line snapping, the whole-period wheels, where settled schedules land, the alert in eight languages, the chooser callback with a real target, and whether "Save as PDF" counts as a print.

## History

- 2026-09-26 — grid, gestures and save-file migration, first piece
- 2026-10-11 — catching up with 146 iOS commits: period axis, stored times, timetable settings, list search
- 2026-10-13 — whole periods when there is a break, 60-minute default rule, settings order, share and print events counted on completion
