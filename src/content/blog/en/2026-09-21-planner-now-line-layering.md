---
title: "The thing hiding the current time was the thing you were doing"
date: 2026-09-21T11:14:15+09:00
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
