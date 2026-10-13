---
title: "On Android, a class block teleported between day columns because its spring was 0.08 s"
date: 2026-10-14T00:20:00+09:00
app: "timetable"
tags: ["devlog", "android", "gesture"]
summary: "Dragging a block to another day looked too fast and smeared. The block follows the snapped cell, not the finger, and the spring that should draw the gap finished in three frames. It now uses the same 0.35 / 0.75 spring as iOS."
---

In SuperTimetable for Android, dragging a class to another day made the block jump to the next column. It was fast, and it still smeared into two or three copies. On iPhone the same drag glides and you can see the block cross. Android now does the same.

## The block follows a cell, not the finger

While you drag, the block is not placed at the finger. It is placed in the **snapped cell** the finger points at: one day column, or one five-minute step, at a time. When the finger crosses a column boundary, the target jumps a whole column at once.

One spring draws that jump. If it is long enough, you see the crossing. If it is short, you do not.

## 0.08 s is three frames

The Android spring had a response of 0.08 s, critically damped, with a comment saying the block must stay under the finger. That premise was wrong. The block was never under the finger, so a tighter spring added no accuracy and removed every frame of the crossing.

At 60 Hz, a 0.08 s spring is done in about three frames. A column is 60-100 dp wide. Two or three widely spaced copies do not read as motion; they read as "too fast" and as an afterimage. Both complaints had one cause.

iOS puts `.spring(response: 0.35, dampingFraction: 0.75)` on the block's day, start and end. The port did not carry that value over and invented a faster one.

## Same value on both platforms

The drag spring is now 0.35 / 0.75 on both axes. What lost:

- **A middle value, 0.15-0.20 s.** Fewer skipped frames, but a number that matches neither platform, and a column is still only five or six frames.
- **Slow on days, fast on time.** A diagonal drag would arrive on each axis at a different moment.
- **Follow the raw finger, snap on drop.** Snap guides and wall resistance show where the block will land; the drawn block would disagree with them.

Resizing is unchanged. It draws without a spring so the fixed edge never moves.

## Finding the in-between frame

We recorded a single drag from Monday to Thursday on the emulator and read the block's left edge per frame. Start 130 px, target 1024 px.

| Frame | Left edge |
|---|---|
| Before | 130 |
| Crossing | 588 |
| Past the target | 1048 |
| Coming back | 1032 |
| Settled | 1024 |

There is a frame mid-crossing and a 24 px overshoot, as a 0.75-damped spring should give. A headless emulator records too few frames to judge smoothness, so that part still needs a real device. A test now pins the two numbers.

## Where it stands

On a fast drag the block arrives about 0.3 s after the finger and overshoots slightly. The saved position is the snapped cell, so dropping mid-glide lands where the guides pointed. Android still leaves a translucent copy at the original place, which iOS does not; that is unchanged.
