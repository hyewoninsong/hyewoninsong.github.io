---
title: "Bringing Timetable’s controls and motion to Planner on Android"
date: 2026-10-15T03:56:46+09:00
app: "daily-planner"
tags: ["devlog", "android", "design"]
summary: "Planner adopts Timetable Android’s capsule controls, grouped rows, and spring selection feedback while keeping its existing editing and Android dismissal behavior."
---

Switching between Planner’s timeline and list now moves a shared selection thumb between the two icons. Completing or removing an item also keeps the surrounding list visually connected. These changes bring the controls refined in Timetable Android into Planner’s Compose interface.

The two apps organize different things. Timetable’s screen structure would be a poor template for a planner built around one day, time blocks, and completion. What transfers is the visual grammar: quiet surfaces, capsule controls, clear grouping, and motion that connects an action to its result.

## App controls and task colors have separate jobs

System blue identifies interface actions. Task and profile colors keep the meaning chosen by the user. Light and dark appearances use neutral backgrounds with distinct grouped surfaces; fields and sheet actions share the same rounded treatment.

This is a rendering change. Saved task colors, completion rules, and the persisted data format remain intact.

## A moving thumb and connected rows show what changed

The view selector uses one raised thumb over a capsule track, following Timetable’s segmented control. Its spring corresponds to a 0.25-second response and 0.85 damping ratio: a short connection between positions rather than a large bounce.

List rows now join into groups, with rounded outer corners and inset dividers. Completion buttons respond to a press, icons and title colors transition together, and remaining rows move into place when an item leaves the list.

The underlying actions stay familiar. A timed row opens its block on the timeline. An all-day item can be completed directly in the list. Timeline locking keeps its existing meaning.

## Motion stays close to the action

A full-screen transition would be more conspicuous, but the timeline holds scroll position, selection, and drag state. Recreating it for a visual transition risks losing the place the user was working. Motion therefore stays around calendar expansion, selection, button presses, and row placement.

Changing only Material’s accent color would leave the repeated cards, field outlines, and selection behavior unchanged. Shared surfaces and small controls provide a more consistent result. Rebuilding the entire iOS sheet gesture system would carry a different cost: Android back navigation, dismissal, touch targets, and accessibility already have a working Compose implementation. Those behaviors remain in place, and draft edits still require an explicit save.

## Disabled animation must still reach the right state

With Android’s animator scale set to zero, finite Compose animations settle immediately. The final selection must match the visible view, and a dismissed sheet must leave no layer blocking interaction.

The manual checks now cover light and dark appearances, rapid view switching, completion followed by removal, and disabled animation. Automated regression checks and emulator inspection accompany the visual changes; large text and repeated interactions remain useful checks as this shared style grows.
