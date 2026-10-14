---
title: "The Android week widget squashed when shrunk — it was stretching a picture drawn for another size"
date: 2026-10-14T12:55:35+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "Resizing SuperTimetable's Android Full timetable widget squeezed its text and blocks. The widget drew its grid for one of a few preset sizes and stretched the result. It now draws at its real size, has a minimum size, and matches the iOS widget as captured on a real home screen."
---

The Full timetable widget on Android now keeps its proportions at any size, will not shrink below about 4 × 3 cells, and looks like its iOS counterpart.

## A widget that squashed on resize

The grid is painted into a single bitmap, with invisible tap areas laid over each block. Glance tells the widget what size to draw — but under `SizeMode.Responsive` that is **one of the preset sizes**, not the widget's own. A bitmap drawn at 250 × 150 dp was stretched onto a 330 × 260 dp widget with `ContentScale.FillBounds`, and the tap areas were off by the same amount. At sizes that happened to match a preset it looked fine, which made it easy to dismiss.

## The fix

- **Draw at the real size**: `SizeMode.Exact`, one render per size the launcher reports. On a Pixel launcher the reported size was the placed widget's own 368 × 568 dp.
- **Fit, never stretch**: `ContentScale.Fit`.
- **A floor**: iOS ships this widget only as Large. Android now stops at 290 × 300 dp (four columns, about three rows); below that on a launcher that ignores it, the grid is laid out at the floor and scaled down uniformly.

## The reference is the real iOS widget

The store screenshot turned out to be an in-app mockup with its own margins and background, so the reference was recaptured from a real iOS simulator home screen.

![The iOS Full timetable widget on a real home screen: light grey ground, a margin around the name, day header and period axis](/blog/timetable-android-week-widget/ios-reference.png)

Measured from it: a 19 pt margin, a grey widget ground (not white), a 36 pt time column, 9 pt semibold trailing axis labels, and the now line under the blocks instead of over their titles. Android also snaps hairlines to whole pixels and uses a true 600 weight where Hangul bold looked too heavy.

![The Android widget on a Pixel launcher home screen, with the same ground, margin and axis](/blog/timetable-android-week-widget/android-home.png)

Along the way: the overlap hatching was offset because a pixel value was multiplied by the screen density twice.

## What is left

The Today widget has the same preset-and-stretch setup and gets its own change.

## History

- 2026-10-14 — real-size rendering, a minimum size, and the iOS home-screen look
