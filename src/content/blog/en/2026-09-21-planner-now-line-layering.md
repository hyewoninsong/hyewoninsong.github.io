---
title: "The thing hiding the current time was the thing you were doing"
date: 2026-09-23T11:30:00+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "The now line sat behind whatever block was running. It moved above the blocks, and past blocks are now dimmed at a level that reads differently from done."
---

Today's page in the daily planner draws a thin line across the current time, with a time pill on the axis. If something was scheduled across right now — exactly when you want that line — the block covered both.

## It lived in the bottom layer

The now line was part of the view that draws the grid: hour lines, half-hour lines, axis labels, the faint past-time overlay. That bundle is the bottom layer of the day's content. Blocks stack on top of it, and the gesture layer on top of them. Sharing a layer with the background, the line could never win against a block.

So it was visible on a day whose only block was at 9am, and invisible on a day with a block running from 10:30 until now. Whether you saw it depended on when you opened the app, which is why it only ever registered as "sometimes it's not there."

![The line stops at the block's left edge, and the time pill is clipped by the block mid-digit](/blog/planner-now-line-layering/line-behind-block.png)

The fix was to move it: the line and the pill now stack above the blocks and the create ghost, still below the gesture layer — it takes no touches, so hit testing is unchanged. The grid view carries a comment saying the now line is deliberately not there, so nobody files it back into the background.

![The 10:57 line and its pill cross the 10:30–11:55 block that is running now. The 9am block above it has already passed, and is dimmed one step](/blog/planner-now-line-layering/now-line-over-blocks.png)

## "Past" and "done" are different statements

With the line on top, it became obvious that both sides of it looked identical. The grid dims past hours very faintly, but blocks sit above that overlay, so a block you never got to looked exactly as solid as one still ahead of you.

Blocks that have entirely passed now render at 0.78 alpha on today's page. The number is chosen against the completed style: a completed block is 0.55 alpha with a strikethrough title. If past used the same value, "time has passed" and "this is done" would collapse into one appearance — and the thing you skipped is precisely what should stay visible. So past is darker than done, and a block that is both uses the dimmer completed value.

A block spanning the current time is not dimmed. The test is per block: if it ends before now, it's past. The alternative was splitting each block at the line and dimming only the half above it, but then the thing you are doing right now renders in two shades, with overlap hatching and the sticky title crossing that seam. One appointment should read as one object.

Time moves, so the test moves with it, on a one-minute timer. The line itself ticks every ten seconds, but a block changing shade is a per-minute event.

## This one had to be looked at

Neither part can be verified by reading code. The layers stacked in the order they were declared, and the alpha was the value that was typed. You have to put a block across the current time and look.

A throwaway UI test on the simulator did that: place one block two hours back, one from 30 minutes ago to an hour ahead, take a shot. The same shot was taken on the unchanged build for comparison — whether the line really was covered, and whether the dimming really differs, only shows with the two side by side. The test is deleted afterwards; a test that leans on "now" breaks around midnight.

## Where it stands

The past-hours overlay on the grid and the block alpha are two independent devices. If "past" ever needs to be defined in one place, they'll merge then; for now the grid dims itself and blocks dim themselves.

## 2026-09-21 — The pill didn't reach the line, and the date bar's circle teleported

With the line on top, two more things on the same screen stood out: something that should touch was floating, and something that should move was cutting.

### The 12-hour format was hiding an 8pt gap

The time pill starts 2pt from the left edge and is only as wide as its text; the line starts at the axis boundary, 48pt. Nothing ever said the two should meet — **the text length decided it**. In the default 12-hour format, "7:23 PM" is long enough that the pill's right edge passes 48pt, so it looked joined. Switch the setting to 24-hour and "19:23" ends around 40pt, leaving an 8pt gap.

The fix is to stop letting the text set the width and tie it to the boundary instead: the pill now has a minimum width of `axis width − left inset`. Short text stretches the pill to exactly where the line begins; long text widens it past that on its own. Either way there is no gap.

![Before, the pill's right edge floats away from the line; after, it lands exactly where the line starts](/blog/planner-now-line-layering/now-pill-gap.png)

This is the kind of mismatch only a non-default setting shows. If every verification screenshot uses the defaults, it never appears — when a piece whose width follows its content has to meet a fixed boundary, shoot it once with the shortest possible value.

### The selection circle was being redrawn, not moved

The day you're looking at is marked by a black circle behind its cell in the date bar. Swipe the planner left or right and the circle does follow, but it vanishes here and appears there.

The code said exactly that: per cell, "if selected, draw a circle." Changing the day deletes one circle and creates another. SwiftUI has a way to say those two are the same thing — `matchedGeometryEffect`. Give the disappearing and appearing views the same id and it interpolates the frames between them.

![Three frames of the circle crossing from the 21st to the 22nd; in the first it sits between the two dates](/blog/planner-now-line-layering/datebar-selection-slide.png)

The circle lives in a cell the week strip and the month grid share, so the namespace is passed in by whoever wants the move: pass one and it slides, pass none and it appears and disappears as before — the month grid collapses the bar on tap anyway, so it kept the old behavior. What's left is where the namespace lives. The week strip is a horizontal pager where **one week is one page**. A single namespace for the whole strip means that crossing a week boundary sends the circle flying to coordinates on a page that is offscreen, or not even rendered yet. So one week is its own view with its own namespace: within a week the circle slides, and across weeks it is quietly replaced while the page turns. Not stacking two animations on top of each other reads better.

## 2026-09-23 — A column of circles was stacking in no particular order

The planner lets you link blocks and move them as a bundle. Pick one block and a link circle
appears on the right edge of every other block that day; the picked one gets a direction chip
on its top and bottom edge. The chip **straddles** the edge, so half of it sits inside the
neighbouring block.

With two 30-minute blocks back to back, that is exactly where the chip and the neighbour's link
button overlap — and the neighbour's button was winning. The circle that tells you which block
you picked was hidden behind a circle that appears on every block.

![Two adjacent blocks: the upper block's link button covers the chip of the lower, selected one](/blog/planner-now-line-layering/link-chip-before.png)

Overlapping buttons had no order either. The buttons were drawn by the thread that connects
them, and there is one thread per direction — two views. The lower bundle lands on top of the
upper one as a whole, and inside one direction the drawing order was "nearest to the anchor
first," which puts the lower circle above the upper one. The chip, meanwhile, was an overlay on
the block, so it lived a layer below the buttons.

Taps went the other way: the gesture layer tests the chip first, then link buttons, then the
resize band, then the body. What you pressed and what you saw followed different orders.

So the rule is now one line: **controls in a vertical column stack by position — whatever is
higher is drawn higher.** The buttons moved out of the thread into a single layer (circles in
separate views cannot interleave by z), with z as the inverse of y. The selected block sits
above that layer so nothing covers its chip, and the hit rectangles are ordered the same way —
when they overlap, the one higher on screen takes the tap.

![The same spot: the selected block's chip now sits whole on top of the neighbour's link button](/blog/planner-now-line-layering/link-chip-after.png)

Lifting the chip out of the block and drawing it above the buttons was the alternative. But the
chip belongs with the block's fill state and selection ring, and it has to dim with the block
when that block is done or in the past — the level this post settled on above. Splitting a view
for something one layer solves is not worth it. Dropping the whole button layer below the
blocks is worse: on a packed day there is no gap between blocks, so the thread disappears.

The stacking order is now written down in one place: grid → blocks → threads → link buttons →
selected block → create ghost → now line → tutorial demo → edit anchor → gestures. The move this
post opens with — the now line going above the blocks — is now a line you read instead of a
declaration order you count.

One consequence: with overlapping blocks the selected one can cover a neighbour's link button.
That button is clipped to its own block anyway, so only the overlap is hidden, and picking a
different anchor brings it back.

## History

- 2026-09-21 — Moved the now line and pill above the blocks, and dimmed past blocks at a level that reads differently from done
- 2026-09-21 — Closed the pill-to-line gap that only showed in 24-hour format, and made the date bar's selection circle slide between days
- 2026-09-23 — Collected the link buttons into one layer so the higher one draws on top, and lifted the selected block's chip above them
