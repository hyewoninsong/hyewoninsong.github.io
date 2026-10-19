---
title: "Dark phone, light app: the splash now blends between the two"
date: 2026-10-14T10:32:39+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "On Android, the timetable's launch screen starts in the phone's appearance and blends to the app's over half a second. The code was already there. It had never run."
---

Some people keep the phone in dark mode and the timetable in light. Launching the app now starts dark, brightens over half a second, and then the schedule blocks grow in. Before, the dark screen stayed until the end and flipped to white in one frame.

## The splash starts where the system left off

The first thing Android draws for an app is drawn by the system, before any app code runs, in the phone's appearance. That part cannot change. So the app's own splash paints its first frame in the same colour and moves background and title to the app's appearance from there, on the same spring the iOS version uses (0.5 s, damping 0.8). With the app set to Auto, start and end are equal and nothing moves.

![The first 0.4 s of a light app launching on a dark phone: the background goes from dark grey through mid grey to white while the title goes from white to black](/blog/timetable-android-splash-blend/dark-to-light-frames.png)

Background and text invert together, so the title loses contrast for two or three frames in the middle. We accepted that as the flip itself.

## Why not make the system screen follow the app

- **Tell the system the app's night mode** (possible from Android 12). The right appearance from the first pixel, nothing to blend. It needs the setting stored in two places and behaves differently on older versions. We wanted the iOS experience, so this stays in reserve.
- **Hold the system screen until the setting is read.** Still a cut, only later.
- **Read the setting synchronously at launch.** Fixes one of two causes and blocks the main thread on disk.

## The blend code had never run

Two things were wrong at once.

The target was chosen too early. The appearance setting is read from disk asynchronously, and its placeholder value is 0, which means Auto. The splash read that value once, on first composition, and kept it. Everyone's target was "same as the phone".

The animation started before it was visible. A `LaunchedEffect` runs when the splash is composed, and at that moment the system launch screen still covers it. On an emulator about 0.9 s of the 1.4 s animation played underneath, which is also why the block animation always seemed to start halfway.

Fixing only the first cause still recorded as a cut: background luma 42 to 235 in a single frame. The colour was changing, but under the cover. With both fixed it reads 42, 45, 78, 111, 183, 194, 223, 235.

The target is now decided only after the setting has really been read, and the animation starts from `setOnExitAnimationListener`, when the system screen is actually gone. Some launches never get that callback, so a 0.7 s timer after the data loads starts it anyway; without it a touch-blocking overlay would stay forever. The system screen's dark background was pure black and now matches the app's ground colour.

None of this shows when phone and app agree, which is why the check kept passing. The check now asks for mid-grey frames in a cold-start recording with the two appearances crossed.

## Where it stands

Measured on an emulator only. The fallback timer path has not been exercised directly yet.
