---
title: "The splash fills a day from the top down"
date: 2026-09-21
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "On launch the whole screen becomes the day's time axis; todo blocks grow in from the top one by one and one of them gets checked. The launch-screen dissolve and the display timing are each guarded, by a recording and by a test."
---

Opening the day planner no longer shows a white screen with a title and nothing else. The whole screen becomes the same vertical time axis as the day view, four to six colored blocks grow in from the top one after another, and one of them gets a completion check. About two seconds later the real day view fades in. The first thing you see after tapping the icon is the thing the app does.

## Borrowed from the timetable app, except the order

The timetable app already has a splash with this structure: a launch storyboard with the title and studio name, and a SwiftUI view on top where blocks expand into a grid in shuffled order. This app uses the same two layers.

One thing is different. The timetable fills its weekly grid in random order; the planner only fills **top to bottom**. This app is about filling a day from morning to night, so the order is the meaning. Randomness goes into block height (two to five half-hour units), the gaps between blocks, the colors, and which block gets checked.

![Blocks growing in from the top. The first two are done and the third is emerging behind the title](/blog/planner-splash/growing.png)

The check lands after the last block has settled, and it looks exactly like a completed block inside the app: the circle on the left becomes a check with a small bounce and the whole block drops to 0.55 alpha. There is no text in the blocks. A capsule in the title color stands in for a title, so the splash reads as "blocks with titles" in every language.

![All five blocks placed, the third one checked](/blog/planner-splash/checked.png)

## Full screen, not a strip above the title

The first version drew a narrow axis, 40% of the width, above the title. It was the safe choice for keeping the title clear, and it made the splash look like decoration instead of a miniature of the app. The request came back: use the whole screen, behind the title. That was right.

It now uses the day view's own geometry: a 48pt axis column on the left, the minimap inset on the right, and the full height from the status bar to the studio name. The title floats over the blocks. A saturated blue or red block can end up behind it, so the title sits on a blurred glow in the background color. On an empty background that glow is background on background and invisible; it only shows when a block is behind the title.

![Dark mode. The glow behind the title dims the purple and red blocks around it so the title stays readable](/blog/planner-splash/dark.png)

## Nothing the storyboard draws may fade in

iOS cross-dissolves the launch storyboard snapshot into the app's first frame for about half a second. If the storyboard has a title and the SwiftUI view fades its title in, the title disappears and comes back during that dissolve. The timetable app hit this once, so here the title and studio name are opaque from the first frame and only the version string fades in. The positions mirror the storyboard constraints: title center at 45% of the height, and the studio label centered 47pt from the bottom, since the storyboard pins its bottom edge at 40pt and the label is 14pt tall.

XCUITest cannot see any of this; by the time a test attaches, the dissolve is over. So a cold launch on the simulator was recorded and the title region's contrast was measured per frame. In light and dark mode it never dropped below 229 from the first app frame until the splash was dismissed. The screenshots above are frames from that recording.

## The display time is guarded by a test

Since the block count is random, the moment the check lands varies. The dismissal time is a single constant, and a test asserts that the check for the largest possible plan lands inside it. The first numbers, 2.1 seconds of display with 0.18 seconds between blocks, failed that test immediately: with five blocks the check finishes at 2.17 seconds, so the splash would vanish mid-bounce. The stagger went to 0.16 and the display to 2.2. When the full-screen change raised the cap to six blocks, the same test held again.

The plan itself is a pure value that takes an injected random generator, so 500 seeds are run to check that blocks never overlap, never leave the axis, and never repeat a palette color.

## What is left

If the app ever gets its own light/dark setting, the storyboard (system appearance) and the app can disagree. The timetable app solved that by interpolating two resolved palettes; that comes over when the setting does. For now both layers follow the system, so there is nothing to disagree.

## History

- 2026-09-21 — First splash. Two-layer structure from the timetable app, top-to-bottom order, full-screen axis, title glow, display-time test.
