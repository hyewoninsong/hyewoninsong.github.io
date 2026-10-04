---
title: "A drag-only planner now works with VoiceOver — custom actions, not menus"
date: 2026-10-04T21:22:58+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "gesture"]
summary: "Every block gesture in the planner is a finger gesture. Assistive tech now gets a set of custom actions instead of a revived menu, and Reduce Motion turns movement into a quick fade."
---

With VoiceOver on, you can now read your schedule, nudge blocks by 15 minutes, change their length, send them to the drawer, and delete them. We added this without building a second grammar next to the finger one.

## Each block carries its actions

Before, one gesture layer covered the timeline and read as a single "timeline" element, so VoiceOver had no times and no actions. Now every block is its own element: title and time range, completion state, read in time order.

| Finger | Accessibility action |
|---|---|
| Tap the check band | Mark done / not done |
| Tap the body | Select / deselect |
| Memo button | Write memo |
| Drag the body | Move 15 min earlier / later |
| Drag an edge | Lengthen / shorten by 15 min |
| Drop on the drawer | Put in drawer |
| Delete button | Delete |

An "empty time" element opens the same picker as dragging on empty space. The minimap is an adjustable "day scrollbar" that moves an hour per swipe, and date cells are buttons that announce selection. Every action calls the same store method the finger path calls, so undo, alarms, and telemetry behave identically.

## Why not a menu

The app deliberately has no context menu and no edit sheet. Reviving either would give us two grammars for the same edit, which drift apart. Labels only would be readable but useless. Accessibility actions add no visible UI, so they don't contradict the earlier decision. Type size is capped (1.3x on the time axis and date cells, 1.15x inside blocks) because the one-minute-equals-4/3pt scale is the timeline's identity.

## Reduce Motion moves less, not nothing

Flying, sliding, spring and shake animations become instant changes or a 0.15 second crossfade. Color and opacity changes and haptics stay, since they carry state and don't cause dizziness; fingers dragging already had no animation. Turning everything off was rejected for exactly that reason.

## What is left

A real-device VoiceOver pass for reading order, and actions for the group chips and link buttons.
