---
title: "A tutorial you do, not one you read"
date: 2026-10-05T15:20:00+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "gesture"]
summary: "The first-run tutorial is follow-along: a finger demonstrates on the real timeline, and a step only advances when you actually do it. It started with six steps and was rebuilt as eight that follow a first real day, plus a timeline lock."
---

Open the day planner for the first time and a small card slides in under the date bar. Tap Start and the card says "press and hold an empty spot, then drag down", while on the timeline below a finger presses an empty slot and drags a dashed block open, over and over. Place a block for real and the card moves on. The app has no visible button for placing a todo: the only way is a long-press drag on empty space, and block actions live in a menu you get by tapping a selected block again. New users got stuck on "how do I add one".

![The welcome card floats under the date bar; the timeline stays live](/blog/planner-tutorial/welcome-card.png)

## Each step unlocked by the real action

These were the original six steps. There are eight now (see the September 27 section below).

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

Unrelated controls are locked during the action steps instead: day navigation, settings, profiles, the drawer, undo and redo, because an undo during step one would delete the block step two points at. (Undo used to unlock for a final undo step; that step is gone, so it stays locked.) Timeline gestures are never locked, so if you delete the block from its menu you can place another and carry on.

## What changed in the port

This came over from the timetable app, which has nine steps. Duplicate, delete and grid lock do not exist here, so they went; the checkbox and the re-tap menu, which only this app has, came in. The card sits under the date bar rather than at the very top, so the locked date bar stays visible instead of being covered.

One thing tripped on the way. The timetable app re-plans the demo inside its repeat loop, but a SwiftUI `task` closure captures the values it started with, so reading fresh data inside the loop returns stale data. The fix was to key the task on the blocks, the selection and, for the place step, the scroll position, so any change restarts the loop with current values.

The tutorial can be replayed from Settings. New gestures will not join it on their own: each new step needs an event, a demo scene and strings in eight languages.

## 2026-09-27 — From handling one block to a first real day

Walking through the six steps again, they only taught how to handle **one** block. Linking blocks and moving them together, the thing that sets this planner apart, was missing; step one said "pick a todo" when a first-time user has none; and the todo list never came up. The tutorial now follows a first real day:

| Step | What advances it |
|---|---|
| 1 Unlock | Tap the lock at the bottom left |
| 2 Create and place | Drag empty space, create a new todo in the sheet |
| 3 Place one more | Do it again |
| 4 Link | Select a block, tap the link button on the other |
| 5 Move together | Drag the group so it actually moves |
| 6 Add a note | Save a non-empty note (opening the editor is not enough) |
| 7 View history | Open a todo from the list |
| 8 Archive | Archive it |

Resize and complete are gone: the handle and the circle explain themselves. The link demo taps a block to select it, then taps the nearest unlinked block's link button; the move demo slides ghost copies of both blocks the same distance. Steps 7 and 8 happen inside the todo list sheet, so the same coach card also appears at the bottom of the sheet.

## A lock, so a day you are only reading does not move

Selected and linked blocks drag without a long press, which meant a block could follow your finger while you were just scrolling and ticking things off. A lock now sits next to undo and redo. Locked, only scrolling and the completion checkbox work (selection was blocked too at first; that changed on October 5, see below); touching a block shakes the lock with a warning haptic so it does not read as broken.

![The unlock step: the card points at the lock, and a finger demonstrates tapping it](/blog/planner-tutorial/unlock-step.png)

It lost to a settings toggle (too far for a switch you flip while reading), to "locked but still selectable" (buttons that appear but do nothing — a real concern, later solved by not drawing the buttons), to silence (reads as a bug), and to syncing via iCloud (locking the iPad would block editing on the iPhone). The lock stays per device.

## A per-device value leaks into the next run

The tutorial starts locked and gives the lock back if you skip before unlocking. At first it remembered "I locked it" only in memory. The group-drag UI tests then all failed with "picker never opened": the unit-test host app, launched without test arguments, had run the first-run tutorial, locked the timeline, and left it in `UserDefaults`, which the UI tests' reset argument does not touch. The same root caused a real bug: kill the app while locked and the next tutorial treats the lock as yours and never releases it. The flag now lives on disk, test and capture launches start unlocked, and a UI test walks all eight steps on the simulator.

## 2026-10-05 — Locked means read-only, not dead

A locked day is a day you are reading, and reading was blocked. A block only shows as many note lines as its height allows; the full note lives in the composer, which opens by selecting a block and tapping it again. Locked, you could not select, so a note on a 30-minute block was unreadable without unlocking.

Locked now means read-only.

| While locked | What happens |
|---|---|
| Tap a block | It is selected: outline and start/end times only, no group chips, link buttons or resize handles |
| While selected | An info card at the bottom: todo name, time, length, the whole note |
| Tap the checkbox | Completes, as before |
| Tap empty space | Deselects |
| Long press, tap the selected block again, tap the card | Refused: a ripple spreads from the lock |

![A block selected while locked: outline and time pills only, an info card at the bottom, and the lock as the only button on the left](/blog/planner-tutorial/locked-info-card.png)

The September objection to "locked but selectable" was that selecting shows buttons that do nothing. The objection stands; the answer changed. Instead of blocking selection, the editing controls are simply not drawn. For the same reason undo, redo and the drawer button are hidden while locked, and their keyboard shortcuts go quiet with them. Dimming them lost: four greyed buttons keep saying "not now" on a screen meant for reading.

The card is the note composer's panel without the field, the save button or the link to edit, and with a small lock where the chevron was. A long note scrolls inside the card rather than being cut. The card floats above the bottom buttons instead of joining their inset, so selecting does not resize the timeline; the timeline only scrolls when the selected block would sit under the card.

### A refusal has to be visible where you are looking

The old refusal was a 14-degree nudge of the lock in the bottom corner while your eyes are mid-timeline. The timetable app already answers the same situation with a ripple from the lock plus a side-to-side shake, so the planner now does the same: a glow, three rings 0.2 seconds apart, and a warning haptic.

![The selected block tapped again while locked: rings spreading from the lock in the bottom-left corner](/blog/planner-tutorial/locked-denied-ripple.png)

Tapping the selected block again could have meant deselect. Unlocked, that tap opens the note; if the lock changed it to deselect, someone trying to write a note would just see the selection vanish. It is a refusal instead. Ripple, shake and haptic all come from one function, so a new path cannot forget one of them. With Reduce Motion the ripple becomes one still ring and the shake a single blink.

The cost: no undo button if you tick the wrong checkbox while locked (tap it again, or unlock and undo), and on a packed day there is little empty space to tap for deselect.

## History

- 2026-09-21 — six-step follow-along tutorial
- 2026-09-27 — rebuilt as eight first-day steps, timeline lock
- 2026-10-05 — lock became read-only: select while locked with an info card, undo and drawer hidden, refusal shown as a lock ripple and shake (reverses 09-27's blocked selection)
