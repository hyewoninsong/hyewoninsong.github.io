---
title: "Scrubbing the scrollbar now ticks once an hour"
date: 2026-09-21T22:10:00+09:00
app: "daily-planner"
tags: ["devlog", "design", "swiftui"]
summary: "A scrollbar that squeezes 24 hours into one screen moves far on a small gesture. Instead of one impact when you grab it, there is now a soft tick each time you cross an hour. The tab bar got a haptic too — but only when you actually tap it."
---

Drag the vertical scrollbar in the day planner and you now feel a small tick every time you pass an hour. You can count how far you have gone without looking. The bottom tab bar also fires a selection haptic when you switch between Planner and Todos — but only when your finger did it.

## The scrollbar lost you the moment you looked away

The planner's scrollbar is not the system indicator; it is a minimap. All 24 hours are compressed into the screen height, with the day's blocks standing on it in their real colors. Scrub it and the lane widens so each bar shows its title.

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
