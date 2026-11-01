---
title: "Switching to Arabic put our timetable under the wrong weekdays"
date: 2026-11-01T12:56:48+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "Compose mirrors only part of a right-to-left screen. The day header flipped, the schedules didn't, and reversing one list fixed it."
---

In right-to-left languages, Super Timetable on Android now keeps every schedule under its own weekday. We don't ship those languages, so we assumed the case couldn't come up. With the app set to Arabic, the timetable was already wrong.

## Direction flips even without a translation

With `android:supportsRtl="true"`, Compose mirrors layouts on its own, whether or not the app has Arabic strings. Set the app language to Arabic and the text falls back to English while the direction reverses.

The first capture looked right: Monday on the right, the time axis on the right. But Math is a Saturday class, and it was sitting under Monday.

![Before: the Saturday class Math sits under the Monday header](/blog/timetable-rtl-grid/before.png)

Drag it to the Tuesday column and it looks like Tuesday, but the saved value is Friday.

## One screen mixed two behaviors

| Mirrored for you | Not mirrored |
|---|---|
| `Row`, `Column`, `padding`, `Modifier.offset` | `Layout.place`, `Canvas`, pointer positions |

The header is a `Row`, so it flipped. Blocks use `place` and touches use raw x, so they stayed. Time pills use `offset`, so they flew to the far edge of the grid.

## We reversed the list, not the coordinates

All of the grid's column math is column number times width. So the grid's inside stays left to right, and only the list of days reverses. Blocks, touches, drags, pills and the header read that one list, so they agree.

![After: Math sits under Saturday at the far left, Monday is at the far right](/blog/timetable-rtl-grid/after.png)

- **Pinning the whole grid left to right** is one line, but the week runs backwards for those readers.
- **Branching on direction per coordinate** means one missed branch brings the bug back.
- **Turning `supportsRtl` off** hides the mismatch until those languages ship.

## A screenshot couldn't show it

Our first conclusion was that the grid and touch were fine. Tapping selected the block under your finger, and dragging followed it. The only thing wrong was how the header related to the data. Noticing that Math's stored day was Saturday is what gave it away, so the check now compares a known schedule with its header and reads the saved file after a drag.

## Where it stands

This removes the mismatch; it doesn't add right-to-left languages. There are no strings yet, so the text stays English. Shared images, printing, widgets and a device whose system language is Arabic came later the same day, below.

## 2026-11-01 — The exported pictures mirror too, and widget taps had been broken all along

A mirrored grid alone means an Arabic user sends friends a week running the opposite way. Shared images, printing, list previews, widgets and the tutorial now match the grid: the time axis on the right, Monday beside it, Saturday leftmost.

Share, print and the list preview draw through one renderer, so moving the axis and reversing the same day list there fixed all three. Flipping the finished bitmap would have been one line, and it would have mirrored every letter.

This time we changed the system language, not the app language. The launcher sets the direction of a widget's views, so an app language can't show what such a phone does.

### Tapping a widget block only opened the app

The widget looked right, but tapping Saturday's block just opened the app, and tapping an empty corner selected a different schedule. It wasn't an Arabic bug: the same code ran in every language.

A `uiautomator dump` showed why. Every block's tap target sat at the same coordinates. Glance has no free positioning, so we moved each box with `padding(start = x, top = y)`, but Glance padding is inside the view. The boxes never left the corner.

The geometry tests passed because the drawing coordinates were right. A manual test for tap position existed but missed it: tapping anywhere opens the app, so an open app proves nothing. We now pad a full-size parent and put the box inside it, pinned from both sides because the launcher decides direction. Sixty blocks still render, and the manual test now compares view bounds with the picture.

### Direction hid outside the coordinates too

- The tutorial's L-shaped outline assumed the axis was on the left. It now turns with the axis.
- Lines like "Duplicate at the bottom right" are wrong on a mirrored screen, so they get right-to-left English variants. A translation will take priority.
- In 12-hour time, `12:00 PM – 2:00 PM` broke into `PM – 2:00 PM 12:00`. Digits and dashes are weak in a right-to-left paragraph, and 24-hour time hides it. Each time is now held together as one run.

We followed all 11 tutorial steps with real gestures, then checked the grid, widgets and taps again in Korean. Strings are what's left: English punctuation still lands at the wrong end until a translation arrives.

## History

- 2026-11-01: Fixed the grid's weekday mismatch.
- 2026-11-01: Mirrored shared images, printing, widgets and the tutorial, and fixed widget taps in every language.
