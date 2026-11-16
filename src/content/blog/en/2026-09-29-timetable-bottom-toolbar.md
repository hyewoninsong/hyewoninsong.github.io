---
title: "The floating buttons under the grid moved into the system toolbar"
date: 2026-11-16T16:27:23+09:00
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

The vertical-bar relocation was confirmed on the foldable simulator on October 5, 2026 — see the next section. (Since November 13, timetable and calendar screens turn the side strip off on the foldable and use top and bottom bars; the strip stays on the home screen only.) It hasn't been seen on real hardware yet. The red trash icon reads a bit paler on glass than the old solid red circle did — worth a second look on a real device.

## 2026-10-05 — On the foldable simulator, the buttons really do move to the side

Six days after the move, we checked it on the simulator. In any pose that is wide, the top controls (list, the `…` menu) and the bottom controls (lock, undo, redo, `+`) all land in a vertical strip on the right, with the clock and Wi-Fi at the top of it. No extra code.

| Pose | Active display | Where the buttons sit |
|---|---|---|
| Closed | Outer | Vertical strip, right |
| Open, landscape | Inner | Vertical strip, right |
| Open, portrait | Inner | Horizontal toolbar, top |
| Half-folded (book), portrait | Inner | Horizontal toolbar, top |

![Closed: list, menu and lock sit in the strip on the right](/blog/timetable-iphone-duo/closed.png)

![Open, landscape: wider day columns, buttons still in the right-hand strip](/blog/timetable-iphone-duo/open-landscape.png)

![Open, rotated to portrait: the buttons return to a horizontal toolbar on top](/blog/timetable-iphone-duo/open-portrait.png)

The rule isn't "unfolded means side bar". It's whether the screen is wide. The closed outer display is wide enough to get the strip; the open display held in portrait loses it.

### Getting the simulator to run

The foldable simulator only runs under the Xcode 27.1 beta. Release 27.0 has no device type for it, and the newer 27.2 beta ships the device type but its iOS 27.2 runtime explicitly excludes the device. We found that out after downloading 8 GB of the wrong runtime.

Building with the 27.1 SDK surfaced one compile error. A `Shape` that implements `animatableData` by hand picks up MainActor isolation from the target's default, and from Swift 6.4 that no longer satisfies the `Animatable` conformance `Shape` requires. Marking the type `nonisolated` fixed it. Shapes that don't implement `animatableData` were unaffected.

### "Tested unfolded" was wrong three times

We ran 17 UI tests for creating and editing schedules in both poses. Folding is only available through buttons in the simulator's window — neither `simctl` nor XCUITest has an API for it — so we pressed them through the macOS accessibility API. The catch: a simulator that reboots comes back closed. If a reboot slips in between unfolding and running the tests, the tests quietly run on the closed display and still produce plausible results.

The tell was a number in a failure message: the block width came out as 54.7pt twice, where the open display gives 135.7pt. A test that only runs in the wide layout kept getting skipped, too. Now we unfold and run the tests in one go, and check the block width before writing down which pose a result belongs to.

| Pose | Passed | Skipped | Failed |
|---|---|---|---|
| Closed | 14 | 1 | 2 |
| Open, landscape | 15 | 0 | 2 |

The two failures are the same in both poses and fail identically on a regular iPhone and iPad. Nothing new broke on the foldable.

### What's left

Open-portrait and half-folded were only looked at, not exercised. Half-folded, the grid runs straight across the crease — nothing is clipped, but nothing avoids it either. Sheets and settings haven't been checked.

## 2026-11-16 — The iPad moved its buttons down too

The iPad had sat out this move. On a wide iPad window, lock, undo, redo, `+` and duplicate lived in the **top** toolbar and there was no bottom bar, while the unfolded foldable iPhone, the same wide layout, kept them at the bottom. Now the iPad matches the unfolded foldable in landscape.

| Where | iPad before | Now (iPad = unfolded foldable) |
|---|---|---|
| Top | `‹` · lock · undo · redo · title · `+` · duplicate · `…` | `‹` · title · `…` |
| Bottom | nothing | lock · undo · redo on the left, a red `+` on the right (duplicate and a red trash once a block is selected) |

![iPad landscape with the edit pane open — the buttons sit only at the top and bottom corners of the left pane](/blog/timetable-bottom-toolbar/ipad-landscape-split.png)

With the edit pane open on the right, the bottom buttons stay inside the left grid pane. In portrait the grid takes the whole screen and the buttons sit where they do on iPhone.

![iPad portrait — the same bottom toolbar as iPhone](/blog/timetable-bottom-toolbar/ipad-portrait.png)

### Why the iPad, and why delete the rule

One device check split them: "iPhone goes to the bottom even in the wide layout, iPad stays on top." That exception existed to push the foldable's buttons to the bottom of its side strip. Since November 13 document screens on the foldable use plain top and bottom bars, so all the exception still did was let the device name decide where the same layout's buttons go. Moving the foldable up instead would have changed two devices out of three, since iPhone and the folded foldable already use the bottom. Keeping the check and flipping the iPad value would have left the fork in place for the next one-sided edit, so the function is gone.

### Fixed along the way

The tutorial told iPad users to tap "Duplicate at the top right". That line is gone from all eighteen languages in favor of the iPhone wording, which also fixes the unfolded foldable, which had been reading "top right" with the button at the bottom. The bottom area the tutorial's finger demo avoids went from 24pt, a value from when there was no bottom bar, to the iPhone's 88pt. The wide layout's `+` and duplicate buttons now also count as obstacles for the time pills above blocks.

### Where it stands

Checked on the iPad simulator in landscape (locked and unlocked), portrait and the calendar's split view, where the lock lands under the left month pane, the same as on the foldable. A side-by-side capture with the unfolded foldable, Mac and real devices are still to do.

## History

- 2026-09-29 — Moved the bottom-left capsule and bottom-right round buttons into the system bottom toolbar, because the foldable's vertical-bar relocation only applies to system toolbar items.
- 2026-10-05 — Confirmed the vertical strip on the foldable simulator; it appears only in wide poses. Create/edit tests: 14/17 closed, 15/17 open.
- 2026-11-16 — iPad lock · undo · redo · `+` · duplicate moved to the bottom toolbar to match the unfolded foldable in landscape; the device check is gone.
