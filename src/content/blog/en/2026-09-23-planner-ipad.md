---
title: "We didn't build an iPad screen"
date: 2026-09-23
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "Bringing the planner to iPad meant no iPad-specific screens at all — only window width, only values. The one real bug was two windows sharing one set of state."
---

The planner now works on iPad: portrait, landscape, half of a Split View, and two windows showing two different days. None of that took an iPad-specific screen.

## Measure first — it mostly already worked

We started by putting the app on an iPad simulator and running through it: place a block, open the edit popover, open the todo picker and the drawer, visit the todo tab and a detail page, rotate. Everything worked.

The reason is that nothing in the code ever asked what device it was on. Block width has always been "viewport width minus the hour axis and the scrollbar lane"; the week strip is seven cells in an `HStack`; the month grid and the contribution graph read their container width. Sheets became centered form sheets on their own, and the popover still attached under its block.

![The planner in landscape on iPad — blocks fill the window](/blog/planner-ipad/landscape-planner.png)

So "iPad support" turned into finding the two places that assumed one phone-sized window.

## One axis: window width

The rule: **never branch on the device.** A Split View third on iPad is 320pt wide — an iPad, but a phone width. A Pro Max in landscape is regular width. The device does not tell you the window size.

Same for size classes: swapping whole view trees on `horizontalSizeClass` changes view identity when the window resizes, and the state inside (selection, search text) resets. Only *values* change — `.frame(maxWidth: 700).frame(maxWidth: .infinity)` does nothing in a narrow window and centers the content in a wide one.

That fixed the todo tab. The 700pt cap was on the list alone, so the segmented control and title spanned the window while the list did not, and in landscape the list's grey background sat as a stripe between white margins. Now the segment and list share one column, and the container paints the background edge to edge.

The timeline was left alone: the day fills the window, like Calendar's day view. A centered column looked like paper and pushed the drawer target and undo buttons away from the blocks.

![A 375pt compact window — the tab bar drops to the bottom and the layout matches the iPhone](/blog/planner-ipad/compact-window.png)

## The real bug: two windows, one state

The build settings had `UIApplicationSupportsMultipleScenes` on, so iPad could open a second window. But the screen state — the day being viewed, the selected block, which sheet is up — lived in `@State` on the `App` struct.

`@State` on `App` is not per window. There is one, shared by every window. Two windows became mirrors: move one to tomorrow and the other followed; select a block in one and it was selected in both. Nothing in the code looks wrong; only the simulator shows it.

The fix is to move the state one level down: a scene-root view inside `WindowGroup` owns the `@State` and passes it into the environment. Each new window instantiates that view, so each gets its own state. Only what is truly app-wide — the store, settings, the undo stack, the alarm inbox — stays a singleton.

![The new window shows today while the original keeps yesterday's block](/blog/planner-ipad/new-window-today.png)

We verified it with a probe: go to yesterday in the first window and place a block, open Window ▸ New Window from the menu bar. The new window showed today, and yesterday's block existed only in the first. Tiling to the top half and dragging the window down to 375pt gave the phone layout with the tab bar at the bottom.

## What's left

Undo is app-wide, so it can undo work done in the other window — consistent, since the store is one. Pointer hover and hardware keyboard shortcuts don't exist yet and can't be probed in the simulator. UI tests that found tabs via `tabBars` now fall back to labels, because iPadOS 26's top tab bar isn't a tab bar to XCUITest.
