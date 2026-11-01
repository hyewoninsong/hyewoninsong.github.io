---
title: "Switching to Arabic put our timetable under the wrong weekdays"
date: 2026-11-01T12:10:00+09:00
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

This removes the mismatch; it doesn't add right-to-left languages. There are no strings yet, and shared images, printing and widgets have the right days but draw left to right. We tested with an app language, so a device whose system language is Arabic still needs its own look.
