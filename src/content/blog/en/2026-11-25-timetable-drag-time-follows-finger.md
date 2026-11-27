---
title: "Dragging a daily repeat left blocks 15 minutes behind the finger — no springs on finger-driven values"
date: 2026-11-27T12:44:33+09:00
app: "timetable"
tags: ["devlog", "swiftui", "gesture"]
summary: "While dragging, block time now follows the finger with no animation curve. Springs stay for the day slide and the settle after release."
---

Drag a daily-repeat event up or down quickly and the seven blocks trailed the finger. The time pill said 7:20 while the blocks sat at 7:02. After flipping to the next week, the Tue and Wed blocks hung lower than Thu through Sat, so the row looked like a staircase. Everything snapped into place on release, which made it easy to miss.

## A spring was sitting between the finger and the block

Measuring the screen recording frame by frame showed the cause. Each block's vertical `.offset` was animated by a spring (response 0.35, damping 0.75) keyed on `startTime`. During a drag the time changes in 5-minute steps and the spring retargets every step. At a steady finger speed v the spring trails by about v × 2ζ/ω, roughly v × 0.084 s. At 300 pt/s that is about 25 pt, more than 15 minutes on this grid. The pill reads the target time directly, so the label and the block disagreed.

A single-block drag had the same lag, but the pill sat right next to the block and it felt smooth. It only shows with seven blocks in a row.

## Same input, different curves

The staircase after a week flip is a different mechanism. SwiftUI springs inherit the current velocity when retargeted. A block that just reappeared starts at zero velocity; blocks that were already moving keep theirs. Same value, same update, different curves. In the recording Thu–Sat jumped 26 px in one frame while Tue–Wed moved 3 px, which produced the ~25 px step.

## The fix

While dragging, vertical time follows with no curve. An environment value, `blockTimeFollowsDrag`, sets the vertical offset animation to `nil`, and derived layers (knots, outlines, thread ends) follow the same flag.

Two alternatives lost:

- **Disable animation entirely**: this also kills the sideways day slide, which should stay springy.
- **Stiffer spring**: the lag shrinks but never reaches zero, and velocity inheritance remains.

A single combined `offset(x:y:)` can't have one axis set to `nil`, so the offset is split per axis. The day slide and the post-drop settle keep the spring.

Re-recording the same drag on the simulator showed all seven columns with identical block tops in every frame, and the pill time matched the block top.

## Why it was missed

Earlier fixes aligned derived layers to the block's spring, and nobody asked whether the spring itself was right during a drag. Checks were still screenshots, and a still frame always shows blocks at their target. Only a recording with per-frame measurement exposed it.

## Where it stands

Values the finger sets every frame (drag, resize, pinch) get no implicit spring; springs are for settling after release and for programmatic moves. 120 Hz on a real device is still unchecked.

## 2026-11-27 — The row keeps sliding after a week flip

Two days later a sideways report came in. Within the current week, dragging a daily event slid all seven blocks as one row. But after holding at the edge to flip to the next week and continuing to drag, the row stopped moving together: only the start date seemed to change, and blocks popped in and out column by column.

Before the flip, neighbor-week occurrences were laid out in virtual columns off screen, and the whole row was offset by the dragged block's column shift and clipped at the grid edge. After the flip that layer was dropped and each occurrence was placed directly at its final position. Those blocks have date-keyed ids, so every column change swapped which blocks existed instead of moving any of them. Columns whose source sat in the previous week were left empty, which opened a gap between the dragged block and the row.

The fix keeps the same layer after the flip. Each occurrence is anchored at its source date's virtual column relative to the week now on screen, and the shift is the dragged block's current column minus its original date's virtual column. A flip lowers every virtual column by one week and raises the shift by one week, so on-screen positions don't move and the row doesn't jump. A unit test pins that.

Two alternatives lost:

- **Springs or insert transitions on the final-position blocks**: with date-keyed ids, different blocks come and go instead of moving.
- **Restart the layer at shift 0 on flip**: the row jumps by a week.

We missed it because XCUITest's `press(…thenDragTo:…thenHoldForDuration:)` is a single segment, so the finger lifts after the hold and only the still frame after the flip got checked. This time the probe built one continuous touch with `XCPointerEventPath` and `XCSynthesizedEventRecord`, called by name at runtime because there are no headers. The touch went press, edge, hold, four columns left, two right, release. The 8 fps recording showed the row staying attached to the dragged block, with edge blocks clipped as they slid in and out. Real devices and the "this and following" scope are still unchecked.

## History

- 2026-11-25 — detached block time from the spring while dragging
- 2026-11-27 — row keeps sliding after a week flip; verified with a synthesized multi-segment drag
