---
title: "Timetable settings went two-column on tablets, and rotating closed the open wheel"
date: 2026-11-17T17:18:27+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "On wide sheets, time and weekdays sit side by side. The first frame, drawn before the width is measured, consumed the restored rememberSaveable value, so the open wheel closed after a rotation. It took both a fixed key and movableContentOf."
---

On Super Timetable for Android, the timetable settings sheet now splits into two columns when it is wide. On a tablet, rows that used to spread name-left, value-right across the whole sheet now sit within reach of each other. The layout came from iOS; rotating the finished result exposed a trap that only exists in Compose.

## Two columns from 540dp up

![Timetable settings on a tablet: type row on top, time on the left, weekdays and schedule on the right](/blog/timetable-android-settings-two-columns/two-columns.png)

The type row spans the top. Below, time (or period rules) is on the left and weekdays plus schedule on the right. The switch is the width the sheet's block receives, not the device class, so a rotated tablet and an unfolded foldable behave the same.

When a row's name and value do not both fit on one line, the value drops under the name, right-aligned. Nothing shrinks and no name is truncated. iOS shrinks text to 0.8x on one row; on Android that would fight the user's font setting, so we did not port that.

We measure width with a zero-height strip and `onSizeChanged`, because `BoxWithConstraints` broke the sheet's intrinsic measurement. The price is that the first frame is always one column.

## Rotating closed the open wheel

![Start-time wheel open in the two-column sheet](/blog/timetable-android-settings-two-columns/wheel-open.png)

Open the start-time wheel, rotate to portrait (one column): the wheel stays. Rotate back to landscape (two columns): it is closed.

Two layers caused it. Rotation recreates the activity, so only `rememberSaveable` survives, and its default key is the composition position, which differs between layouts. A fixed key fixed that. It was not enough: the first frame, drawn as one column, consumed the restored value for that key, and the two-column instance created afterwards got nothing and started closed.

The fix needs both parts. A fixed `rememberSaveable` key covers activity recreation, and `movableContentOf` moves one instance of the time group between the two layouts so state is not rebuilt on a layout flip. Either alone failed. iOS's `AnyLayout` gives this for free. We verified by rotating landscape, portrait, landscape; checking one direction misses it.

## Font 2.0

At font scale 2.0 the digits in the period strip's 20dp bars were clipped, because they scaled with the font while the bars did not. The digits are now pinned in dp (decorative, hidden from accessibility); the summary line below still scales. German and Arabic checked out without truncation.

## Still open

The sheet snaps back to half height after a rotation, which we left. We have not tried folding and unfolding a real foldable.

## History

- 2026-11-17 — two-column sheet, open wheel survives rotation, font 2.0 digits
