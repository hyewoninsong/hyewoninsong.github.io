---
title: "Pen nodes were already being created. Nobody could see them."
date: 2026-10-28T23:00:01+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "A request to 'make pen strokes into nodes' turned out to be a visibility problem: the node existed as plain text and the 'node added' toast only fired for highlights. Handwriting is now an image node showing the ink, every creation path announces itself, the four colours are editable per project, and underline and pen have three widths."
---

In SuperPDF, handwriting now lands in the mind map **as its own ink**. Whether you highlight, write, or crop, a "node added" toast appears whenever the map is off screen. You can make and pick as many highlighter colours as you like (since 2026-10-28, see the end), and underline and pen have a weight picker.

## The request was a wrong diagnosis

"Make pen writing create nodes too." The code already did. A group of strokes becomes a highlight and a node 1.5 seconds after the last stroke. The user had simply never seen one, for two reasons.

- The handwriting node was a text node titled `p.3 handwriting`. The ink itself appeared nowhere, and if Korean handwriting recognition returned nothing, that title stayed forever.
- On iPhone the map is hidden, and the "node added" toast was wired only into the highlight callback. Handwriting closes on a timer outside the view, so the view never got a node ID; crop discarded the node it returned.

Not a missing feature, missing feedback. So instead of building it again, we made it visible.

![After drawing an X with the pen, a thick yellow stroke remains and a toast says a handwriting node was added to the map](/blog/superpdf-pen-nodes-color-weight/pen-toast.png)

Handwriting is now an **image node**, the same kind a crop makes. The ink thumbnail sits in the node with the recognised text as the title line beneath it, and the icon is a pen tip rather than a photo. Layout, preview and map export reuse the image-node machinery untouched.

![The map showing a handwriting node with the yellow X ink visible](/blog/superpdf-pen-nodes-color-weight/handwriting-node.png)

The toast is now an event raised by the view model from all three creation paths, and the view renders it with a per-kind message. The condition changed too: it used to be "compact layout", but an iPad in PDF-only mode also hides the map. The real condition is whether the map is visible.

## At first, colours were tied to four slots

The colour editor is ported from our timetable app: twenty preset swatches, a saturation-brightness square, a hue bar and a hex field, with the selection ring drawn in the swatch's own colour. It opens as a popover from the colour circle in the "colour meaning" sheet.

![The colour popover with a purple preset selected; the square and hue handles have moved to purple](/blog/superpdf-pen-nodes-color-weight/slot-color-popover.png)

At this point we did not open the palette to unlimited colours. SuperPDF had four colours because each one was a meaning, and labels, review filters, colour grouping and annotation import all keyed on those four slots. So the slots stayed and only the **actual colour in each slot** changed, per project. Turn the yellow slot purple and every highlight, underline, stroke, node and handwriting thumbnail in that slot turns purple. It is not repainting; it is redefining the slot.

![After recolouring the yellow slot: toolbar chip, underlines and pen strokes are all purple](/blog/superpdf-pen-nodes-color-weight/recolored-purple.png)

With the default palette nothing looks different. Per-highlight hex colours lost because they would touch every place that keys on the slot plus the migration (a month later we went exactly that way, see below); unifying the defaults onto system colours lost because existing documents would change for no reason the user asked for.

## Line weight is one button

Underline and pen have thin (1pt), regular (2pt) and bold (4pt). Regular is the old fixed value. Underline stores its width on the highlight; pen bakes it into the ink. The toolbar shows a single button drawn as a line at the current weight, opening a menu, and only in pen mode or underline style. Three separate buttons would have overflowed the iPhone toolbar, which already wraps to two rows.

## Opening the popover froze the app for 30 seconds

The first version measured the saturation-brightness square with `onGeometryChange` and used that height for the hue bar next to it. Inside a sheet that is fine: the parent hands down a width and the measurement settles in one pass.

A popover runs the other way. It sizes itself from its content, remeasures the content at that size, and if the content changes state it sizes itself again. The square's width bounced between two values and the negotiation never ended. No crash, just a main thread doing nothing but layout. An `idealWidth` hint did not help; it is a hint, not a fixed width.

The fix removed the measurement: popover width fixed at 320, square side derived from it as 250. With no arrow from layout back to state, the negotiation ends in one pass.

The build, 1,055 unit tests and previews all passed with the bug in place. A simulator capture test that actually opened the popover caught it, reporting the main thread busy for 30 seconds. Now any measurement inside a popover gets checked for whether its value feeds another view's frame in the same popover.

## 2026-10-28 — Colours no longer mean anything. They are just colours.

Two requests: let me add my own colours and pick from them, like the timetable app; and since colours then stop meaning "quote" or "question", just give me one place that collects every colour. The second request removed the premise the four slots stood on.

So a highlight now stores its colour as a value, `#rrggbb`. The toolbar keeps the four colours you used most recently in this book, plus a rainbow circle that opens a popover: colours used in this book, twenty basics, and your colours with a `+`. The `+` turns the same popover into an editor (saturation-brightness square, hue bar, hex). A new colour is selected immediately and joins the front of the chip row.

![The popover with a newly made purple selected under My colours; the first toolbar chip is the same purple](/blog/superpdf-pen-nodes-color-weight/free-color-popover.png)

The meanings are gone. The settings section is removed, review filter chips show every colour used in the book as plain circles, map colour groups are headed by a dot and a count, and Markdown export drops the label.

![Review screen: next to All, every colour used in the book appears as a plain circle chip](/blog/superpdf-pen-nodes-color-weight/review-color-chips.png)

What lost: growing the slots to N (deleting a slot strands its highlights, and "recolour the slot, recolour everything" only made sense when slots had meanings); a single colour circle in the toolbar (switching colours mid-read would take two taps instead of one); converting old highlights to hex on open (old yellow is pure yellow on paper but system yellow in chips, so no single hex preserves both); per-book colour lists (people reuse the same colours across books, so it is one app-wide list of up to 40).

One near miss: map nodes stored colour as a five-case enum, and the undo record copied that enum. Undo then redo a purple highlight and its node came back yellow, because an unknown value falls back to the default. The record now keeps the raw stored string, and a test pins the colour through create, undo and redo.

## What is left

Annotated PDF export writes picked colours as they are, but re-importing maps them to the nearest of the old four. Import exists for other apps' annotations, so that rule stays.

## History

- 2026-09-25 — handwriting image nodes, toast from all three paths, editable colour slots, three line weights, popover size-loop freeze
- 2026-10-28 — pick any colour from a popover, colour meanings removed, filters list every colour used
