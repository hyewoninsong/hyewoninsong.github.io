---
title: "The color picker lost its back button"
date: 2026-09-24
app: "timetable"
tags: ["devlog", "swiftui", "gesture"]
summary: "When every pick applies instantly, a back button is not cancel, it is undo. Tapping outside now confirms, and long-press enters edit mode the way the home screen does."
---

SuperTimetable's color picker is a popover, and the moment you tap a swatch the edit sheet behind it repaints in that color. Four things in that popover fought against this live-preview grammar. Three of them were places a user told us they got confused. All four changed today.

## Tapping outside threw the color away

The editor for a new color had a `<` at the top left. It discarded the color and went back to the list. Tapping outside the popover did the same thing, so a header that was already yellow snapped back to blue. From the user's side: pick yellow, the screen turns yellow, lift the finger, and it never happened.

Two weeks ago the list screen lost its X for exactly this reason. The editor's `<` survived as "back, not cancel". It was the same trap.

![The new color editor. The top left is empty, only the checkmark remains. The header is already the yellow being built.](/blog/timetable-style-picker-grammar/editor-header.png)

Now the editor header has nothing on the left. Tapping outside does what the checkmark does: the color is added to the palette and stays selected. The value committed comes from the model's HSV, not the hex text field, so a half-typed `#ff` does not lose the color the header is already showing. The only way to throw a color away is the delete button at the bottom.

An "Add this color?" prompt on outside tap was considered and rejected. An alert on top of a popover is heavy, and it contradicts the grammar where picking is applying.

## Long-press enters edit mode; dragging lives inside it

Long-pressing a custom swatch used to lift it in place so you could reorder. Users expected the home-screen behavior instead: long-press enters the wiggle mode first, and moving happens inside it.

| Action | Before | After |
|---|---|---|
| Long-press a swatch | Lift and start moving | Enter edit mode (one haptic) |
| Drag a swatch in edit mode | Only after a long-press | Plain drag reorders |
| Swipe the gap between swatches | Page flip | Page flip (unchanged) |

![Edit mode. Each custom swatch gets a red minus badge; the "in use" strip and the tabs above dim and lock.](/blog/timetable-style-picker-grammar/edit-mode.png)

Swatch touches go through a UIKit recognizer layer, not SwiftUI gestures. A SwiftUI `DragGesture` on a swatch killed the pager's scroll across the whole page, which we measured on device two weeks ago. Today a `UIPanGestureRecognizer` joins that layer, enabled only in edit mode, and the pager's pan is told to wait for it via `shouldBeRequiredToFailBy`. Swipe across a swatch and it reorders. Swipe across the gap and the page flips.

The pan's translation is measured from where the finger first landed, recovered with `location - translation(in:)`. Without that the swatch jumps by the 10pt recognition threshold.

Lifting the pressed swatch while entering edit mode, so one gesture does both, was deferred. Edit mode swaps in a different pager view, and once the transition ends UIKit cancels the touch on the view that left the tree. Release and drag again.

## Titles inside the circles

The "in use" strip at the top lists the (title, color) pairs already on this timetable. Picking one changes the title too, not just the color. A caption under each circle said so, but the circles looked identical to the palette below, so the row did not read as doing something different.

![The "in use" strip. Titles inside the circles separate them from the palette swatches below.](/blog/timetable-style-picker-grammar/in-use-titles.png)

Titles now sit inside the circles, in the same text color the grid block would use. The caption stays, because a 44pt circle fits two or three characters and long titles need it. Palette swatches remain title-free.

## The header ignored the timetable's text color setting

Each timetable can pin its schedule text to light, dark, or automatic. The edit sheet header always used automatic. On a timetable pinned to dark, a blue schedule showed charcoal titles in the grid and a white title in the header, which is the one place that is supposed to preview the block.

The grid was already passing the mode down as an environment value; the sheet just never read it. It does now, and the iPad inspector, which lives outside the sheet chain, injects it directly. The titles inside the popover circles read the same value. Any new edit host must inject it too, or it silently falls back to automatic.

## Where it stands

The edit-mode pan and its failure dependency on the pager were verified with XCUITest on the simulator. Finger-speed verification on a device is still open.

## History

- 2026-09-24 — Editor back button removed, outside tap confirms, long-press enters edit mode, titles in circles, header follows text color mode.
