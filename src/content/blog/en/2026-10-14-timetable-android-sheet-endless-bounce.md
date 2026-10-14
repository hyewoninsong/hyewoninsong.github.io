---
title: "Swiping the Android settings sheet up made it bounce forever"
date: 2026-10-14T11:40:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "An upward swipe on an expanded sheet started a bounce that never settled, because the sheet's height depended on the sheet's own position. Every sheet now stops under the status bar and settles after a single overshoot."
---

Open Settings, swipe the sheet up, and it started bouncing and did not stop. It now overshoots once and is back at rest in 0.4 seconds. The fix also moved where a full-height sheet stops: directly under the status bar instead of beneath it.

## A full sheet stops under the status bar

A sheet as tall as the window used to run behind the clock and pad its content by the status bar height.

![Before: the sheet's rounded top touches the top of the screen with the clock floating over it](/blog/2026-10-14-timetable-android-sheet-endless-bounce/beneath-status-bar.png)

Now the space a sheet can move in begins below the status bar. The rounded top sits under the clock and the dimmed timetable shows behind it, which is where an iOS large sheet stops. Every sheet in the app opens through the same wrapper, so they all changed.

![Now: the sheet stops just under the status bar with the dimmed background behind the clock](/blog/2026-10-14-timetable-android-sheet-endless-bounce/under-status-bar.png)

## The sheet's height followed the sheet's position

Three behaviours of Material 3's `ModalBottomSheet` (1.4.0), each sensible alone:

1. The content gets top padding equal to the part of the status bar the sheet does not cover **right now**. Height is content plus that padding, so it depends on position.
2. The expanded stop is derived from the measured height.
3. Flinging an expanded sheet upward starts a spring from its stop back to the same stop at the finger's velocity. If the stop moves while it runs, the spring restarts, reusing the **original fling velocity**.

Chained, they loop. Coming back, the spring passes its stop by a pixel or two. The padding shrinks, the sheet gets shorter, the stop moves, and the fling starts over. The offset per frame:

`-5, -109, -54, -16, -0.3, +1.9, -70, -148, -48, -2.6, +1.6, -90, -178, …`

Sixty-eight moves in six seconds, still going when the log was cut.

## It never happened at the usual screen size

The loop only runs when the content height is within one status bar of the window height. Much shorter and the sheet never gets near the status bar; much taller and the height is capped. On the emulator size we normally check, Settings rested 195 px down and was fine. Sweeping the window height a few pixels at a time found it: stable at 2340, 2180 and 2000, looping at 2222. The band is 74 px wide, and which sheet falls into it depends on the device and the font size.

## Take the inset once, outside the sheet

The wrapper now consumes the top inset on the modifier it hands to Material, so there is nothing left to pad inside and the height is the same wherever the sheet is. Dropping the top inset from the content instead would put the header under the clock; a fixed padding would add an empty band to every short sheet; damping the spring is not possible in 1.4.0 and would not stop the restarts anyway.

A source test keeps the inset from being reintroduced inside a sheet. The single overshoot on a fast upward flick is Material's own and stays. And a screenshot of a sheet "at rest" cannot catch this, so motion is judged from the positions logged for a few seconds after the finger lifts.
