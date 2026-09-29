---
title: "The floating buttons under the grid moved into the system toolbar"
date: 2026-09-29T23:30:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "SuperTimetable's hand-drawn glass capsule (lock, undo, redo) and round buttons (add, duplicate, delete) at the bottom of the grid moved into the system bottom toolbar — because of a foldable iPhone that hasn't shipped yet."
---

SuperTimetable used to float a hand-drawn glass capsule under the grid: lock, undo, redo on the left, a red `+` for a new schedule on the right, swapped for duplicate and delete once you picked a block. All of that moved into the system bottom toolbar (`ToolbarItemGroup(placement: .bottomBar)`). Locked, only the lock button remains — the rest are removed from the toolbar outright, not just faded to zero opacity like before.

## What changed

The buttons still do the same things. What changed is the layer they live in.

| State | Before (custom overlay) | Now (system toolbar) |
|---|---|---|
| Locked | Lock shown, rest hidden at opacity 0 | Only lock shown, rest removed from the toolbar |
| Unlocked | Bottom-left capsule (lock/undo/redo) + bottom-right red `+` | Left group + `ToolbarSpacer(.flexible)` + red `+` (`.glassProminent`, red tint) |
| Block selected | Bottom-right circle becomes duplicate/delete | Right group becomes duplicate/delete |

![Locked: only the lock button remains at the bottom](/blog/timetable-bottom-toolbar/locked-only.png)

![Unlocked: lock, undo, redo on the left, red + on the right](/blog/timetable-bottom-toolbar/unlocked-full.png)

Picking a block swaps the right side for duplicate and delete. The system now draws the glass; all we draw is the glyph and its tint.

## Why now: a foldable iPhone

This isn't a cosmetic change. It's driven by a foldable iPhone (iPhone Duo) shipping October 23, 2026. Under the iOS 27.1 SDK, unfolding this device into its wide pose relocates top and bottom bar controls into a vertical strip on the side — but only for items registered as **system toolbar items** through `NavigationStack` + `.toolbar`. Custom overlays aren't touched, and there's no layout guide for placing a custom floating control into that vertical strip ourselves. Left as overlays, the top controls (list, the `…` menu) would have moved to the side while the bottom controls stayed put — two chrome grammars on one screen.

Two alternatives lost:

- **Keep the overlays and move them into a side rail ourselves**, reading window size or the new toolbar environment values. Keeps the hand-drawn look, but can't share the system's vertical strip — two chromes instead of one — and we'd have to chase every future device's rules by hand.
- **`toolbarVerticalBehavior(.disabled)`** to opt out of vertical placement entirely. Throws away the extra vertical space the wide layout offers.

The new SDK APIs — `.axisBehavior(.verticalPreferred/.horizontalOnly)`, `@Environment(\.toolbarVerticalEdge)` (nil when there's no vertical bar), `toolbarVerticalBehavior(.disabled)` — all assume system toolbar items. Moving the custom overlays into the toolbar was the only path that closes this for good instead of chasing each new device.

## What broke on the way

Things drawn outside a button's own bounds got clipped once that button lived inside a toolbar — the tutorial's finger-demo ring, the ripple that plays when you tap the lock while it's locked. Both need to draw past the button's edges, and a toolbar clips its own bar. We reused plumbing already built for iPad: inside a toolbar item, `onGeometryChange` measures that button's global frame; the actual decoration is drawn by a layer sitting outside `NavigationStack`, at the shell root, reading those measured coordinates. iPhone now shares the same structure iPad already had.

The time pills on schedule blocks read the same measurements to steer clear of the bottom buttons — but they only measure the SF Symbol inside the button, not the ~44pt glass chip around it, so the measured frame gets inflated by 11pt to compensate. And when a button leaves the toolbar entirely (undo/redo, while locked), its last measured frame used to just sit there stale — `onGeometryChange` doesn't fire with a new value on removal. Every button that can disappear now clears its own recorded frame in `onDisappear`.

## Where it stands

The vertical-bar relocation itself is still unverified — it needs the Xcode 27.1 beta (macOS 26.6+); so far we've only confirmed the horizontal layout on an iPhone 17 simulator (iOS 26.2). The red trash icon reads a bit paler on glass than the old solid red circle did — worth a second look on a real device.
