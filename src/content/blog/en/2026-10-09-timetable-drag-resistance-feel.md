---
title: "A blocked event now squishes 6pt at most, and bounces only on release"
date: 2026-10-09T18:07:09+09:00
app: "timetable"
tags: ["devlog", "swiftui", "gesture"]
summary: "When a dragged event hits a wall, the block squishes and bulges. Frame-by-frame measurements showed long blocks shrinking 33pt, an edge that jumped on release, and a spring that never played."
---

In SuperTimetable, dragging an event into another event or the edge of the day makes the block squish toward the wall and bulge sideways. It says "this far" with shape instead of a warning color. A month after shipping it, we recorded the screen and measured the block's edges in every frame. The problems were bigger than they looked.

## Long blocks squished five times deeper

Vertical squish was 8% of the block's height: 3pt for a 30-minute event, 33pt for a four-hour one. The sideways bulge depends on column width and stays near 3.5pt, so the two never matched.

![Before on the left, after on the right. A four-hour event is pushed above 08:00. On the left its bottom edge has risen to about 11:40; on the right it sits just above 12:00.](/blog/timetable-drag-resistance-feel/hold-before-after.png)

Squish is now `min(8%, 6pt ÷ height)`. Measured on the same gesture: 32.7pt before, 5.7pt after. A flat 6pt lost because it would squish a 30-minute block by 17%.

## On release, the edge touching the wall dipped 9pt

The squish is a `scaleEffect` anchored at the wall. The anchor was chosen as "top if the overflow is negative, otherwise bottom". Let go at the top wall and the overflow becomes zero, so the anchor jumps to the bottom while the scale is still springing back. The top edge moved 464 → 490 → 464px in the recording. The block now remembers which wall it touched last, and the edge stays put.

## Following and releasing need different curves

One spring handled both. It lagged a little behind the finger and settled with no overshoot.

| State | Before | After |
|---|---|---|
| Pressed, following the finger | response 0.25, damping 0.8 | response 0.14, damping 1.0 |
| Leaving the wall, letting go | same | response 0.32, damping 0.55 |

The first try at damping 0.62 overshot by 0.3pt, which is invisible. At 0.55 it is 0.7pt.

## A carefully chosen spring never played

A hard hit was meant to press deeper and ease out with `withAnimation(.spring(response: 0.45, dampingFraction: 0.7))`. The block already had `.animation(_:value:)` on the same scale value, and that modifier replaces the animation for its subtree whenever its value changes. The inner one wins. Both springs take about 0.3 seconds, and the test only checked that the line existed in the source. The curve is now chosen in one place, inside the block.

## Drawing a new event had no resistance

Long-pressing an empty slot and dragging to draw an event stopped at walls with no feedback. Moving and resizing had it; drawing did not.

![A new event dragged up into the event above. Before: a plain rectangle. After: the sides bulge near the wall and the top corners flatten.](/blog/timetable-drag-resistance-feel/create-before-after.png)

## Not yet checked by hand

The measurements come from scripted drags in the simulator, which are slow and even. Whether the tighter curve feels less laggy, and how a hard hit looks, still need a finger on a real device.
