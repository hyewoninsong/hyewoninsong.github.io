---
title: "On Android, a class block teleported between day columns because its spring was 0.08 s"
date: 2026-10-14T01:50:00+09:00
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

## 2026-10-14 — Blocked blocks now squash where you can see it

A second report the same day, same root: pushing a block into another class or the edge of the timetable should squash it, and nothing seemed to happen. The resistance was computed, applied and unit-tested.

Holding the finger down and capturing the screen showed the value was being drawn. A one-hour block pushed 20 minutes past its neighbour was 15 px shorter, and that was all. It read as "slightly shorter", not "pressed".

![Before: the blocked block is a little shorter at the top and otherwise unchanged](/blog/timetable-android-drag-follow-spring/squash-before.png)

Next to the iPhone version, three things were missing.

- **The swell was on the wrong edge.** Android pushed the edge touching the wall outward by 3 dp, where the neighbour and the selection ring hide it. A pressed object gets wider, not longer: on iOS the sides swell near the wall and the contact corners flatten.
- **There was no impact.** Depth came only from the distance past the wall, under 2 dp at five minutes. iOS presses deeper for about 0.07 s in proportion to the finger's speed, then bounces.
- **Resize had nothing instead.** A resize must not move the end you are not holding, so it is not squeezed. iOS presses the handle under the finger flat and wide.

Same mistake as the spring above: the numbers (8 %, 6 %) were ported, the shape and the moment were not.

![After, move: the sides swell near the neighbour below and the bottom corners are flat](/blog/timetable-android-drag-follow-spring/squash-move.png)

![After, resize: the top edge stays at 11:00, the sides swell and the bottom handle is pressed flat](/blog/timetable-android-drag-follow-spring/squash-resize.png)

A move now squashes around the wall end (8 % of the height, capped at 6 dp) while the sides spread between finger and wall; the title is not squeezed. A resize keeps its length and answers with the side swell and the handle. Letting go bounces back once on a 0.32 / 0.55 spring.

Squeezing a resize too, as the report literally asked, lost: the far end would drift toward the wall, which is jitter we removed on purpose. Simply deepening the squeeze lost as well; it still reads as "shorter".

The manual test already said "resistance is visible" and was passing. An expectation without a shape passes when nothing shows, so it now says which side changes and how. For an effect that exists only while the finger is down, a frame captured mid-gesture is the only evidence.

## History

- 2026-10-14 — Drag-follow spring set to 0.35 / 0.75.
- 2026-10-14 — Wall squash matches iOS: side swell, impact and rebound, pressed resize handle.
