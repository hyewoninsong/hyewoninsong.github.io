---
title: "A tutorial you do, not one you read"
date: 2026-09-21
app: "daily-planner"
tags: ["devlog", "swiftui", "gesture"]
summary: "The first-run tutorial is six follow-along steps: a finger demonstrates the gesture on the real timeline, and the step only advances when you actually perform it. No dimming, no spotlight, no Next button."
---

Open the day planner for the first time and a small card slides in under the date bar. Tap Start and the card says "press and hold an empty spot, then drag down", while on the timeline below a finger presses an empty slot and drags a dashed block open, over and over. Place a block for real and the card moves on. The app has no visible button for placing a todo: the only way is a long-press drag on empty space, and block actions live in a menu you get by tapping a selected block again. New users got stuck on "how do I add one".

![The welcome card floats under the date bar; the timeline stays live](/blog/planner-tutorial/welcome-card.png)

## Six steps, each unlocked by the real action

| Step | What the card asks | What advances it |
|---|---|---|
| 1 Place | Press and hold empty space, drag down, pick a todo | A block gets placed from the picker |
| 2 Move | Press and hold a block, drag it up or down | Its start time changes |
| 3 Resize | Drag the bottom edge of the selected block | Its length changes |
| 4 Complete | Tap the circle on the left | The block becomes complete |
| 5 Block menu | Tap the selected block once more | The context menu opens |
| 6 Undo | The undo button at the bottom left | Undo runs |

There is no Next button. Each place in the app where the real action completes tells the tutorial "this happened", and the tutorial advances only if that is the event it was waiting for. Tapping the checkbox during the move step does nothing. A drag dropped back where it started does not count either.

![The place step: below the card, a finger holds the noon slot and drags a dashed block open](/blog/planner-tutorial/place-demo.png)

The finger demo is drawn inside the scrolling timeline content, not in a screen-space overlay, so it follows scrolling for free. Where it plays is computed from live data each time: the place demo looks for a free 30-minute slot near the upper third of the visible range and drags an hour from there, so the downward motion stays on screen; the move demo picks the nearest free hour before or after the selected block; the resize demo grows the block if there is room below and shrinks it otherwise. If the target is off screen, it scrolls there once per step.

![The complete step: a pulsing outline on the checkbox band, and the finger tapping it](/blog/planner-tutorial/complete-demo.png)

## Why not a carousel, and why no dimming

A few onboarding slides would have been cheapest. But the two gestures that matter here, "hold for 0.2 seconds and drag" and "tap the selected block again for the menu", do not stick from reading. They have to be done once.

A dimmed screen with a spotlight cutout makes "here" obvious, but asking for a real gesture through the hole means handling touches inside and outside it separately, and this screen is a horizontal pager inside a vertical scroll view, so the dimming layer fights both. So there is no overlay at all. "Here" is a pulsing outline the demo draws on the real target, and the timeline stays fully interactive throughout.

Unrelated controls are locked during the action steps instead: day navigation, the tidy-up menu, settings, profiles, the drawer, redo, and undo until the last step, because an undo during step one would delete the block step two points at. Timeline gestures are never locked, so if you delete the block from its menu you can place another and carry on.

## What changed in the port

This came over from the timetable app, which has nine steps. Duplicate, delete and grid lock do not exist here, so they went; the checkbox and the re-tap menu, which only this app has, came in. The card sits under the date bar rather than at the very top, so the locked date bar stays visible instead of being covered.

One thing tripped on the way. The timetable app re-plans the demo inside its repeat loop, but a SwiftUI `task` closure captures the values it started with, so reading fresh data inside the loop returns stale data. The fix was to key the task on the blocks, the selection and, for the place step, the scroll position, so any change restarts the loop with current values.

The tutorial can be replayed from Settings. New gestures will not join it on their own: each new step needs an event, a demo scene and strings in five languages.
