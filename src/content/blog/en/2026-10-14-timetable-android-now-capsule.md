---
title: "At 4 a.m. the timetable looked like the current-time setting was off"
date: 2026-10-14T04:10:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "On Android, the current-time capsule disappeared together with the line whenever the clock was outside the timetable's hours. The line belongs inside the range; the capsule belongs on the axis always. Porting had merged two conditions into one."
---

In SuperTimetable for Android, when the current time falls outside the timetable's hours, a blue capsule now stays at the end of the time axis showing the time and "Outside". Before, the grid showed nothing — which is exactly what it shows when the setting is off.

## The capsule stays when the line cannot

A 9-to-18 timetable opened at 4 a.m. has nowhere to draw a line. Hiding the capsule too made a working feature look broken.

![A 9–18 timetable at 4 a.m. — a two-line capsule at the top of the time axis, no line](/blog/timetable-android-now-capsule/out-of-range.png)

![3:05 p.m. — a one-line capsule sitting on a line that crosses every day](/blog/timetable-android-now-capsule/in-range.png)

| Current time | Line | Capsule |
|---|---|---|
| Before the range | none | top of the axis, two lines |
| Inside | at that time | on the line, one line |
| After the range | none | bottom of the axis, two lines |

An hour label gives way when the capsule covers it. The overlap is measured with the capsule's real height — 18 for one line, 30 for two.

## Pinned to the content, not the screen

Floating the capsule at the edge of the visible screen would keep it always in view, but it would drift over hour labels while scrolling. Pinned to the end of the content, its position means something: top is "not started yet", bottom is "already over". The iPhone app does the latter, and the wording is the one the widget already used.

## One flag turned off three things

On iPhone the current time is drawn in three layers: a line across empty cells, a segment over each block, and the axis capsule. The line and segment show "inside the range"; the capsule shows "when the setting is on". The Android port fed all three from a single `visible` flag.

It went unnoticed because development happens in the daytime, and daytime is always inside the range. To check it afterwards, the emulator's clock could not be set, but its time zone could: 4 a.m. in Seoul is 3 p.m. in New York.

## Where it stands

Before-range and in-range were checked on screen; after-range is covered by a test of the edge math. When one feature is drawn as several layers, each layer's condition gets read on its own.
