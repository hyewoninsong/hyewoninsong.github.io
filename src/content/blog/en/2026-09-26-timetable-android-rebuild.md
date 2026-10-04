---
title: "Rebuilding the Android timetable from scratch instead of patching it"
date: 2026-09-26T23:40:00+09:00
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

Create, move, resize, duplicate, delete, undo — all on the grid. Seven languages, copied from the iOS strings. Next: the editing sheet and color picker; then timetable list, settings, sharing, printing; finally alarms, widgets, the splash animation and the tutorial.
