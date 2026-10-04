---
title: "Scrubbing the scrollbar now ticks once an hour"
date: 2026-09-22T13:10:00+09:00
app: "daily-planner"
tags: ["devlog", "design", "swiftui"]
summary: "A scrollbar that squeezes 24 hours into one screen moves far on a small gesture, so it now ticks once an hour under your finger. It was also drawing time that does not exist after midnight."
---

Drag the vertical scrollbar in the day planner and you now feel a small tick every time you pass an hour. You can count how far you have gone without looking. The bottom tab bar also fires a selection haptic when you switch between Planner and Todos — but only when your finger did it.

## The scrollbar lost you the moment you looked away

The planner's scrollbar is not the system indicator; it is a minimap. All 24 hours — and, as of 2026-09-22, only those 24 hours — are compressed into the screen height, with the day's blocks standing on it in their real colors. Scrub it and the lane widens so each bar shows its title.

The problem is the scale. Twenty-four hours in about 600pt means an hour is 25pt. A small movement of the finger jumps the view by hours — and the only thing your hand got was a single light impact when you grabbed it. To know where you were, you had to stop and read. The whole reason to use the scrollbar is speed, and speed was exactly when you lost your place.

## One tick per hour, softer than the grab

While scrubbing, a tick fires whenever the top of the viewport crosses an hour. Its intensity is 0.45 — noticeably weaker than the impacts at grab and release. The ticks have to sit in the background to read as "passing through"; at full strength each one sounds like something was committed.

| Moment | Signal |
|---|---|
| Grab | light impact |
| Crossing an hour while scrubbing | soft tick (0.45) |
| Release | light impact |

The first hour boundary right after the grab is recorded but skipped, so it does not double up with the grab impact.

Choosing the hour as the unit is the whole decision. Three other units lost:

- **Every N points.** Distance, not structure. Fast scrubs buzz, slow ones go quiet — the same gesture feels different depending on speed.
- **Every 30 minutes.** It matches the grid used when placing a block, but at minimap scale 30 minutes is 12pt. One sweep would fire dozens of times.
- **On every block edge.** The most "meaningful" candidate, until you notice its density depends on the day. Busy days buzz, empty days are silent. A signal that changes shape daily is noise.

Hours are also already drawn: the track carries tick marks at 6, 12 and 18. What the hand feels and what the eye sees are the same grid.

The existing rule was that a continuous drag gets haptics only on touch and release, and mid-drag ticks belong to wheels and reorder lists — things with detents. This change classifies the minimap as one of those. Drags without detents — moving or resizing a block — keep the old rule, where following your finger exactly is the feedback.

## The tab haptic only fires on a tap

The tab bar was silent while every other discrete choice in the app — color swatches, chips — fires a selection haptic.

The real decision was *where* to attach it. Watching the selected tab change is one line, but then programmatic switches fire too: jumping to the planner from a todo's detail view, returning to the planner after taking a block out of the drawer. Those are moments the app moved the screen on its own, and a haptic there reads as "you picked something". Worse, taking a block out of the drawer already fires a haptic on arrival, so one action would buzz twice.

So the haptic lives inside a wrapper around the `TabView` selection binding. Programmatic switches set the router's state directly and never pass through that setter, so they stay quiet — no condition needed to tell the two apart.

## Where it stands

Haptics don't fire in the simulator, so both changes are only verifiable on a device. And iPad has no Taptic Engine at all — both are silent there. Neither change removed a visual signal to make room for touch, so the screen still reads the same without them.

## 2026-09-22 — the scrollbar was drawing time that does not exist

The line above says all 24 hours are compressed into the screen height. That was not true.

The report: a block ends exactly at 24:00, yet on the scrollbar the track continues a little past that block's bar. The day is full, and the scrollbar says there is still room after midnight.

![A block ending at 24:00, but the minimap bar stops short of the track's bottom](/blog/planner-scrub-haptics/minimap-gap-before.png)

### The scale had something in it that is not time

The timeline scrolls further than the day lasts. Twenty-four hours is 1920pt, and there is another 76pt below it so the floating drawer and undo buttons do not cover the 23:00 hour. **That margin is button clearance, not time.**

The minimap was mapping its track onto the full scroll length, 1996pt. That puts 24:00 at 96.2% of the track instead of 100%. The leftover 3.8% is 21pt on an iPhone — small enough to ignore, large enough to decide whether a bar reached the end.

It went unnoticed because **the thumb was correct**. The thumb draws scroll position, so 1996pt is the right scale for it. The track and the colored bars draw *time*, so it is not. Binding both axes to one scale was the bug, and no number anywhere looked wrong.

### The track spans the day, nothing else

The margin is out of the scale for the track, the bars, the hour ticks and the now line. The bottom of the track is now exactly 24:00, and a block that reaches the end of the day reaches the end of the track.

![After: the bar meets the bottom of the track](/blog/planner-scrub-haptics/minimap-gap-after.png)

The thumb now covers only the part of the viewport that overlaps the day. Scroll into the margin and its bottom edge sticks at 24:00 while its top edge keeps moving — the strict proportion between thumb length and scroll length breaks in the last 4%, and in exchange "you are at the end" becomes visible. Better than a thumb that runs off the track.

Three alternatives lost. A tick mark at 24:00 leaves the empty track below it, annotating the misreading instead of removing it. Shading the margin a different tone does not read at 10pt wide and competes with the block colors. Dropping the margin entirely puts the floating buttons back over the 23:00 hour — the margin is needed, it just is not time.

One more thing shipped with it: a hairline `separator` border around the track. The track fill is faint enough that on a white background you could not see where it ended, and reading the start and end of the day needs an edge.

### So it gets caught next time

The scale math moved out of the view into a pure function with four tests: the track spans the day, the thumb stops at 24:00, it starts at 00:00, and it never leaves the track at any scroll offset. The first one asserts directly that the scale is *not* the one derived from the full scroll length — which is exactly the shape this bug had.

The rule, in one sentence: **a scale that draws time takes no lengths that are not time.** Scroll margins, safe areas and insets all live outside it.

## History

- 2026-09-21 — hourly ticks while scrubbing, tab bar haptic
- 2026-09-22 — the minimap track dropped the scroll margin from its scale (24:00 is the bottom), track border added
