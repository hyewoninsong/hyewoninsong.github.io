---
title: "On Android tablets, the edit panel left the right wall and moved next to the block"
date: 2026-10-15T04:50:33+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "Editing a schedule on an Android tablet used to dock a 360dp panel on the right and squeeze the grid. Now the editor pops up right beside the block you are editing, with an arrow, and the grid keeps the full width — the same move the iPad made a month earlier."
---

Editing a schedule on an Android tablet now opens the editor right next to that block. The grid keeps the whole window, and it is obvious which schedule you are changing.

## The docked panel cost width and attention

Tapping a block twice used to slide a panel in from the right. Every day column shrank by the panel's width, and the editor could sit at the far side of the screen from the block it was editing.

![The old docked panel taking width from the grid](/blog/timetable-android-tablet-edit-popover/docked-panel.png)

Now a popover appears beside the block, its arrow pointing at the block's middle.

![The edit popover to the left of a Saturday block](/blog/timetable-android-tablet-edit-popover/edit-popover.png)

It opens on the wider side, follows the block when you change its day or time, flips sides only when it runs out of room, shrinks above the keyboard, and a tap outside works like the X button.

## Why not keep the panel

The iPad dropped its inspector column for a popover on 2026-09-13. Android had kept a docked panel to avoid the anchoring math, but users paid for that simplicity with a permanently narrower grid. The popover's costs — two taps to switch blocks, part of the grid covered — are the same ones the iPad already accepted. Size matches too: 392dp wide, at most 700dp tall.

## Measuring instead of computing

iOS computes the anchor because measured SwiftUI frames landed in the wrong column. Compose places the block itself, so the grid reports the selected block's `boundsInRoot` and the shell reads it through a `CompositionLocal`. The first build showed the popover centred every time: the provider wrapped only the grid, and the popover — a sibling — never saw the anchor.

## Store screenshots

The new screen went into Play tablet screenshots in eight languages. Even on a dedicated tablet emulator, other work installed its own build onto it mid-run, so the capture script now checks the install time and the foreground app before every shot.
