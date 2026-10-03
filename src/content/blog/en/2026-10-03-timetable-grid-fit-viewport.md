---
title: "A seven-period timetable always left a blank strip at the bottom"
date: 2026-10-03T17:00:36+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Period timetables fit on screen with room to spare, and that room showed up as empty grid rows. Short timetables now scale up to fill the viewport, and whatever is left is plain ground, not more grid."
---

Open a period-based timetable and all seven periods fit on an iPhone screen. Below them there was always a strip of empty grid: day columns ruled off, nothing in them. Now a short timetable scales its rows up to fill the screen, and anything still left over looks like the floor, not like more rows.

## Empty rows read as "more periods, just blank"

Row height is fixed per minute: one period is 72pt, seven are 504pt. After the day header and the bottom toolbar, the grid has about 630pt on an iPhone. That left 130pt, plus the scroll margin that lets the last row clear the floating controls — a fifth of the screen.

The shape of the gap was the problem more than the gap itself. Behind the grid there is a layer of day separators drawn for rubber-band bounces. When the content is short, those lines just continue below the last period, so it looks like the periods stop but the slots go on.

![Period timetable before — a strip of empty ruled grid below period 7](/blog/timetable-grid-fit-viewport/before-empty-rows.png)

Time-based timetables with a short range (9 to 17) have the same gap; the period type just made it obvious.

## Scale rows to fill, then end the grid

Two changes together.

First, if the content is shorter than the viewport, rows scale up by the ratio, capped at 1.5×. A three-period timetable should not get 200pt rows just to touch the bottom. The ratio is measured against the locked scale; the edit zoom that comes with unlocking multiplies on top of it, so locking and unlocking never changes it.

Second, when the cap leaves space anyway, the bounce layer is clipped to the content height. Below the last period there is only the ground colour. Pulling down from the top still reveals ruled columns because that area is inside the content; pulling up from the bottom reveals plain floor. It reads as "this is the end".

![After — period 7 ends just above the lock button, with plain ground below](/blog/timetable-grid-fit-viewport/after-fit.png)

## What lost

- **Centre or bottom-align the grid** — the initial scroll to the current time, the clamp that keeps time pills on screen, and the zoom anchor all measure from the content origin. Moving the origin breaks all three.
- **An "add period" row in the gap** — it puts an edit entry point on a locked timetable; tapping the time axis already opens the period editor.
- **One global scale variable** — iPad can show two windows of different heights; the last writer wins.

## No default value, on purpose

Five layout functions compute heights inside the grid, with close to ninety call sites: block positions, grid lines, the current-time line, the minute under a dragging finger, where the iPad editing panel attaches. The new scale argument has no default. With a default of 1, one forgotten site draws at the old scale — blocks grow but grid lines don't — and a single screenshot will not catch it. Without a default, the compiler points at all ninety.

The value is measured once by the grid's root view and passed down the environment. Share images, print, widgets and list previews live outside that environment and keep scale 1, so exported pictures still don't follow the screen size.

## Where it stands

Changing the number of periods, or switching to a timetable with a different count, changes row height within the 1.5× cap; within one timetable it is constant. The first frame before the viewport is measured draws at 1× and then grows; it didn't show in captures, and drawing can be deferred until the first measurement if it ever does.
