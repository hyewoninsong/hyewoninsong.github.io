---
title: "Folded and open in one video — and why the same second showed different scenes"
date: 2026-10-26T12:20:00+09:00
app: "timetable"
tags: ["devlog", "appstore", "xcuitest"]
summary: "The iPhone Duo preview video records the open and the folded display separately and composites them side by side. Cut at the same marks, the folded half ran ten seconds ahead. The culprit was B-frame dts."
---

The iPhone Duo page on the App Store now has a preview video: the open inner display large, the folded outer display small, both doing the same thing at the same moment. The iPad page gets a landscape video of the same story. Yesterday the screenshot cards gained the folded display; the video had to follow the same grammar.

## Three recordings, one story

The iPhone 6.9" video already existed: six scenes, 29 seconds, eight languages. The two new videos inherit its scenes, captions and music and change only the canvas and the recording device. A new story per device would make three videos look like three apps.

| Video | Canvas | Recording |
|---|---|---|
| iPad | 1600×1200 landscape | iPad Pro 13" in landscape, a fresh simulator per language |
| iPhone Duo | 1920×886 landscape | open inner display + folded outer display, **recorded twice** |

![duo-video-create](/blog/timetable-duo-promo-video/duo-video-create.png)

The simulator's `recordVideo` captures one display. So the Duo video is two recordings. The folded one can reboot per language — the Duo boots folded. The open one cannot: the only way to change posture is the Open button in DeviceHub, and a reboot folds it again, so a human opens it once and eight languages run without rebooting, language passed as launch arguments.

Both recordings run the same XCUITest with the same gestures and print the same named marks (the instant before each action). The compositor cuts each scene from each recording as "mark + offset" and places them side by side. That was the plan.

![ipad-video-batch](/blog/timetable-duo-promo-video/ipad-video-batch.png)

## Why this way

- **The folded half is not a still.** A single frame would be far cheaper, but the request was to record both, and a moving folded display says "this works folded too".
- **No per-device scenario.** The iPhone story uses Saturday 08:00–14:00; at the unlocked zoom that is 648 pt, which fits neither the folded display (560 pt) nor the open one (550 pt) nor a landscape iPad. A shorter folded story would break the side-by-side. A capture-only launch argument lowers the unlocked zoom instead (Duo 1.0, iPad 0.8).
- **No scrolling.** The iPad can scroll by drag; the open Duo cannot — no XCUITest drag scrolls its grid. Three devices on one path keep one test.
- **One test.** The iPhone test's constant coordinates went away. Column width comes from the midpoint spacing of identical Monday–Friday blocks, the hour scale from two axis labels, the origin from the window. Saving taps ✓ while the style popover is open — the regular-width popover header ignores synthetic taps, but the window-level forwarder that handles a swallowed ✓ tap exists on every shell.

## The same second, a different scene

The first composite had the folded half running ahead. In the undo scene the open side returns to red school blocks while the folded side shows a duplicated block — a scene about ten seconds later.

![same-second-different-scene](/blog/timetable-duo-promo-video/same-second-different-scene.png)

Left: the frame from `ffmpeg -ss 118.139`. Middle and right: the first frame from a filter-graph `trim=118.139:119.439`. Same file, same second. The verification sheet used `-ss` and all 27 marks matched; the compositor used `trim`.

The folded recording uses h264 B-frames (`has_b_frames=2`). The recorder only writes frames when the screen changes, and the screen sat still for 10.8 seconds while the app installed. From that gap on, dts trails pts by 10.8 seconds (the first packet's dts is −10.8). Input seeking with `-ss` locates by dts; the `trim` filter cuts by pts. One number, two clocks.

The iPhone video never showed it: no long gap, so the clocks agreed, and with one display there was nothing to compare against. Two recordings in one frame expose it instantly. Cutting at the same marks is not enough; **the time base of the cut has to match too**. The compositor now seeks with `-ss` per range.

## Smaller things that bit

- **The vertical bar re-lays out after undo.** The Duo toolbar shows duplicate/delete with a selection and `+` without. Undo clears the selection, the buttons shift one slot, and the pre-measured "redo" frame now pointed at undo. Measure a button after the state change that precedes it.
- **A fresh device's first boot ruins the take.** The load gate (1-minute load under 20) ran before creating the device; iOS 27.1's first boot runs poster and shortcut daemons that push the load past 200 for a minute or two, and the recorder's clock lagged until the app-exit frame fell off the end. A second gate after boot.
- **The drift judge discarded a good take.** It looked for the app→home transition with a scene score; a slow 60 fps exit animation never crosses the threshold. It now diffs against the frame 0.3 s before the end mark.
- **Selection state differed.** The user spotted it in the video: the regular shell keeps the block selected through undo, the compact shell drops it. One tap on an empty cell before undo (with a selection, tap means deselect) and both halves start the scene the same way.
- **iOS 27.1's simulator runtime has no iPad.** Every iPad type is "Incompatible device"; the iPad was recorded on the 27.0 runtime.

## Where it stands

The preview set types are `IPHONE_DUO` and `IPAD_PRO_3GEN_129`. The Duo value is in neither the public docs nor spaceship; a bogus value returns a 409 whose "Expected one of" list names it — the same trick that found `APP_IPHONE_DUO` for screenshots. It accepts the iPhone size, 1920×886.

Two recordings per video means twice the places to be wrong. Whether both are cut on the same time base, and whether both start each scene in the same state, are now on the checklist.
