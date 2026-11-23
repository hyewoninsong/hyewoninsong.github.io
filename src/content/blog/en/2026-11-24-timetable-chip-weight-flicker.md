---
title: "The \"5년\" chip briefly read \"5\" — animated font weight dropped Korean glyphs"
date: 2026-11-24T01:52:20+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "While a selected chip's label turned bold, only the Korean characters vanished. The weight now changes at once; only the gray capsule fades in."
---

Switching the end-date chips of a repeating event ("1 year · 5 years · No end") no longer makes the label flicker. In Korean, the newly selected chip used to read "5" for about 0.1 seconds before becoming "5년". Every chip and cell in the app that shows selection the same way got the same fix.

## Only the Korean glyph disappeared

Cut the screen recording into 30 frames per second and tile just the chip row, and the symptom is plain: the newly selected chip shows "5" for two to four frames, and the deselected one shows "1" for a frame or two. The digit always survives. The "년" is what goes missing.

![Before — while the selection changes, "5년" reads "5" for several frames](/blog/timetable-chip-weight-flicker/chip-before.png)

Chips in this app show selection with font weight plus a gray capsule. The tap is wrapped in a short spring, and when the selection lives in `@State` or a binding, the weight change rides that spring. SwiftUI then draws in-between weights. Digits and Latin letters come from SF, a variable font, so they thicken smoothly. Korean is drawn by a fallback font with no intermediate weights, so those glyphs drop out of the interpolated frames.

## An old diagnosis hid it

Two months ago a similar "label gets clipped" bug was fixed by pinning the chip's width to its bold label. The note from that fix said chip transitions don't ride the spring. That was true only for chips whose state came from an app-wide settings object. The width fix held, the symptom looked identical, and the manual test only tapped non-animated chips, so it kept passing.

## Text changes at once, the capsule still fades

The fix is one modifier right after the label: `transaction(value: isSelected) { $0.animation = nil }`. Weight and text color change immediately, while the capsule behind them keeps its curve. It has to sit inside the background. Put it outside and the capsule stops animating too.

![After — the capsule fades in and "5년" stays whole in every frame](/blog/timetable-chip-weight-flicker/chip-after.png)

Dropping weight as a selection cue would change the whole app's selection grammar. Removing the tap animation would make the capsule pop. `contentTransition(.identity)` targets content changes, and there was no evidence it stops weight interpolation. Taking the label out of the transaction is deterministic. The modifier now sits on ten places: the shared chip, the weekday, day, and month cells, the start/end rows, the range calendar, the edit sheet's weekday chips, the home segment, and the time-unit chips.

## Where it stands

The simulator recording covers the end-date chips; the rest still need a pass on a real device and iPad. The manual test now taps chips that animate, because settled screenshots always look fine.
