---
title: "On Android, a class block teleported between day columns because its spring was 0.08 s"
date: 2026-10-14T04:10:18+09:00
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

While dragging, the block stays just behind the finger and overshoots slightly when the finger stops. (When this was first written it arrived about 0.3 s late; that was the way the spring was run, not its value, and the third section below fixes it.) The saved position is the snapped cell, so dropping mid-glide lands where the guides pointed. Android still leaves a translucent copy at the original place, which iOS does not; that is unchanged.

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

## 2026-10-14 — Same numbers as iOS, still slower: the spring was restarted on every change

With the spring at 0.35 / 0.75 the opposite report came in: the block follows the finger too slowly. Side by side with the iOS code, the snapping maths and the spring values matched. The difference was how the spring was run.

Android called `Animatable.animateTo` again whenever the snapped target changed, and `animateTo` spends its first frame at play time 0, where the value is still the start value. A 5-minute snap step is a few dp, so under a moving finger the target changes on almost every frame, and every frame is a first frame.

Measured with a real `Animatable` on a frame clock, 60 Hz, 15 px per frame for 24 frames (360 px):

| Target changes | Distance covered after 24 frames |
|---|---|
| every frame | 0 px |
| every 2nd frame | 62 px |
| every 3rd frame | 127 px |
| one uninterrupted spring | about 285 px (75 px behind the finger) |

The block stood still while the finger moved and set off once it stopped. The old 0.08 s spring had hidden this by covering the distance in whatever frames it got. SwiftUI's `.animation(.spring, value:)` merges a new value into the running spring, so iOS never had the problem.

One frame loop now drives the spring from drag start until the block settles after the drop, stepping from the current position and velocity toward the current target every frame. The numbers are unchanged.

![Three frames mid-drag: the block's top edge sits at the time shown above it each time (12:25, 12:45, 13:00)](/blog/timetable-android-drag-follow-spring/follow-mid-drag.png)

What lost: tightening the spring again (hides the stall, brings back the teleport), changing the target less often (adds delay to fix delay), and following the raw finger (guides and block disagree).

The fix had its own trap. The loop outlives recomposition, and I handed it the coordinate maths as a reference to a local function. The compiler creates that reference once; when the grid zoom changed (1.5x after unlocking), the loop kept the old zoom and drew the dragged block 300 px above the finger. Every unit test passed and the first recording "moved". It showed up while picking frames for this post: the block was not on the row its time label named. Logging target against drawn position per frame showed the two drifting apart by a fixed ratio. The loop now receives values, and the image above was captured after that.

For motion that exists only mid-drag, "it moves" is not a check. Compare target and drawn position as numbers, on a screen that is not in its default state.

## 2026-10-14 — A tick for every step, so the hand feels the snap too

With the motion matched, what was left was feel: moving or resizing a class did not seem to click into the cells. iOS plays a light impact each time the dragged block's start or end time changes. Android only vibrated on pick-up, on the first wall contact and on the first overlap.

Now creating, moving and resizing all tick once per snap line crossed, by the same rule as iOS.

| During a drag | Tick |
|---|---|
| Start or end time moves to the next step | once |
| Finger moves inside one step | none |
| Same time, another day | none |
| Held by a wall, time no longer changing | none (only the firm hit on contact) |
| Just picked up | none |

The comparison is on the previewed times, not the finger, so the tick lands exactly when the block on screen moves a step.

What lost: the softer tick Android offers for dense sliders (the complaint was the lack of a click), throttling ticks (it drops exactly the steps of a fast drag), and ticking on a day change (already visible; iOS compares times only).

One catch: Android's "segment tick" constant exists from version 14, and older versions silently do nothing when handed a constant they do not know. Below 14 the app sends an older constant that plays the same effect. An emulator cannot vibrate, so tests pin when the tick fires; its strength still needs a real phone.

## History

- 2026-10-14 — Drag-follow spring set to 0.35 / 0.75.
- 2026-10-14 — Wall squash matches iOS: side swell, impact and rebound, pressed resize handle.
- 2026-10-14 — Drag-follow spring runs as one uninterrupted frame loop, so the block follows a moving finger.
- 2026-10-14 — A haptic tick for every step the times take during a drag.
