---
title: "A seven-period timetable always left a blank strip at the bottom"
date: 2026-10-06T00:58:00+09:00
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

First, if the content is shorter than the viewport, rows scale up by the ratio, capped at 1.5×. A three-period timetable should not get 200pt rows just to touch the bottom. The ratio is measured against the locked scale, so locking and unlocking never changes it. The edit zoom that comes with unlocking is not multiplied on top — the larger of the two wins. The first version multiplied them, and a seven-period timetable in edit mode showed barely three periods at 2.9×; the 2× edit scale was already chosen as "big enough to drag", so there was no reason to grow it further.

Second, when the cap leaves space anyway, the bounce layer is clipped to the content height. Below the last period there is only the ground colour. Pulling down from the top still reveals ruled columns because that area is inside the content; pulling up from the bottom reveals plain floor. It reads as "this is the end".

![After — period 7 ends just above the lock button, with plain ground below](/blog/timetable-grid-fit-viewport/after-fit.png)

## What lost

- **Centre or bottom-align the grid** — the initial scroll to the current time, the clamp that keeps time pills on screen, and the zoom anchor all measure from the content origin. Moving the origin breaks all three.
- **An "add period" row in the gap** — it puts an edit entry point on a locked timetable; tapping the time axis already opens the period editor.
- **One global scale variable** — iPad can show two windows of different heights; the last writer wins.

## No default value, on purpose

Five layout functions compute heights inside the grid, with close to ninety call sites: block positions, grid lines, the current-time line, the minute under a dragging finger, where the iPad editing panel attaches. The new scale argument has no default. With a default of 1, one forgotten site draws at the old scale — blocks grow but grid lines don't — and a single screenshot will not catch it. Without a default, the compiler points at all ninety.

The value is measured once by the grid's root view and passed down the environment. Share images, print and widgets live outside that environment and keep scale 1, so exported pictures still don't follow the screen size. List previews were on that list too, until three days later — see the 2026-10-06 section below.

## Where it stands

Changing the number of periods, or switching to a timetable with a different count, changes row height within the 1.5× cap; within one timetable it is constant. The first frame before the viewport is measured draws at 1× and then grows; it didn't show in captures, and drawing can be deferred until the first measurement if it ever does.

## 2026-10-06 — List cards fill the same way

The same gap was still sitting in the timetable list. Each timetable is a fixed-height card, and its preview is drawn on the share-image canvas at one point per minute, so a five-period timetable ended halfway down the card.

That reverses the "list previews stay at 1×" line above. Share images and prints are handed to other people and should not depend on the screen that made them. A list card is where you pick your own timetable, and the grid it opens already scales its rows; a 1× preview showed different proportions from the screen behind it.

So the card reuses the grid's rule instead of inventing one: scale rows only when the picture is shorter than the card, cap at 1.5×, leave long timetables at 1× and scrolling inside the card. A three-period timetable hits the cap and still leaves some space.

Two alternatives lost:

- **Stretching the whole image** — one line of code, but the 11pt labels and day header grow with it, and every card ends up with a different text size. The canvas already took a per-minute height for the lock-screen wallpaper, so scaling rows alone needed no new plumbing.
- **Shrinking the card to its content** — the duplicate button and the page dots would move every time you swipe.

The one catch was when to redraw. The preview is rendered once and only re-rendered on a light/dark switch, but the scale comes from the card height, which is a placeholder until the first layout pass measures it. The scale is now part of the redraw condition, floored to two decimals so sub-point jitter does not trigger renders and rounding never makes the picture a hair taller than the card.

## History

- 2026-10-03 — Grid: short timetables scale rows to fill the screen; leftover space is plain ground.
- 2026-10-06 — List card previews get the same vertical fit, reversing "list previews stay at 1×".
