---
title: "Pen nodes were already being created. Nobody could see them."
date: 2026-11-03T19:19:16+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "A request to 'make pen strokes into nodes' turned out to be a visibility problem: the node existed as plain text and the 'node added' toast only fired for highlights. Handwriting is now an image node showing the ink, every creation path announces itself, colours went from four slots to free values to a ten-slot palette with palettes of your own, and underline and pen have three widths."
---

In SuperPDF, handwriting now lands in the mind map **as its own ink**. Whether you highlight, write, or crop, a "node added" toast appears whenever the map is off screen. Highlighter colours come from a ten-slot palette; change a slot or swap the whole palette and every underline in that slot follows, and you can make your own palettes beside the built-in ones (since 2026-11-03, see the end). Underline and pen have a weight picker.

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

With the default palette nothing looks different. Per-highlight hex colours lost because they would touch every place that keys on the slot plus the migration (a month later we went that way, and six days after that we came back, see below); unifying the defaults onto system colours lost because existing documents would change for no reason the user asked for.

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

## 2026-11-03 — The popover got clipped, so it became two sections of two rows

Opened from the tooltip beside an underline, the colour popover had about 300pt of room but wanted up to 520pt. Swatches were cut off at the top and bottom.

Now colours used in this book sit on top, and basics plus your own colours sit below. Each section is two rows and pages sideways past that, opening on the page that holds the current colour.

![Four used colours on top and two rows of pale basics below, nothing clipped, with page dots beside the section title](/blog/superpdf-pen-nodes-color-weight/color-popover-two-rows.png)

![Paging to the end of the lower section changes its title to My colours, with the add button](/blog/superpdf-pen-nodes-color-weight/color-popover-my-colors.png)

Keeping a vertical scroll was easiest, but it pushed custom colours far down and could leave the current colour off screen. Tabs would have added a control for something a swipe already does.

There were two causes. `.frame(height:)` pinned the list, so when the system shrank the popover, the inner `ScrollView` stayed tall and clipped instead of scrolling. `.frame(idealHeight:maxHeight:)` fixed that. Then the simulator showed the popover squashed into a thin strip when the tooltip sat near the bottom of the screen: `arrowEdge: .top` forced it below the button even with the space above empty. Removing the arrow edge lets the system pick the side with room.

## 2026-11-03 — Colours are slots again: ten of them, and the palette swaps as a whole

Free colours lasted six days. What the user actually wanted was not unlimited colours but one colour system to set up and keep, and when that system changes, the underlines already drawn should change with it. A stored hex value can never do that.

So a highlight now stores a **palette slot index**, not a colour. The palette has ten slots and there is one for the whole app. The popover shows the ten slots in two rows; long-press a slot to change its colour (an Edit button arrived the same day, see below), and a menu beside the title swaps in a preset (basic, pastel, marker) all at once. The three-section paged popover from 10-28 is gone; ten slots fit on one screen.

![The colour popover: a five-dot strip and "basic" menu beside the title, ten colour circles in two rows, the second selected](/blog/superpdf-pen-nodes-color-weight/palette-ten-slots.png)

Change a slot or pick a preset and everything using that slot follows: highlights, underlines and circles on the page, map nodes, handwriting thumbnails, toolbar chips, even the annotated PDF export. It is the property we built on 09-25, back when there were four slots per book; now it is ten slots per app, for the same reason custom colours were app-wide on 10-28: people use the same colour system across books.

![The page after switching to the pastel preset: the selected circle is pale grey and every highlight, box and wave underline has gone pale too](/blog/superpdf-pen-nodes-color-weight/palette-pastel-page.png)

The presets share slot order (yellow, green, sky, pink, orange, purple, teal, blue, red, grey), so switching from basic to pastel keeps "the yellow ones" distinct from "the green ones". The first four slots of the basic palette are the old four colours, so the toolbar looks unchanged.

What lost this time: leaving old hex highlights alone (then a palette swap would skip some underlines, which breaks the point; the six days of hex underlines are moved to the nearest slot when the book opens, and only text-box ink stays a fixed colour); snapping hex to a slot at draw time (two truths, and the slot could change with every palette swap); a palette per book (home cards and export draw colours outside any book); re-rendering handwriting thumbnails on palette change (closed books could never be re-rendered, so the thumbnail's alpha is tinted with the current slot colour instead, via `renderingMode(.template)`).

## 2026-11-03 — Built-in palettes stay put; you make your own

The next request came the same day: let me set the colours myself, not just pick from the three built-in palettes. Ten slots, a colour in each.

Slot editing already existed, but its result had nowhere to live. Editing a slot of the basic palette renamed it "Custom" and overwrote the basic one in place. Try pastel for a moment, come back, and your colours were gone.

Now there are two kinds. **Built-in** palettes (basic, pastel, marker) are read-only. **My palettes** are yours: named, as many as you like. Edit a slot while on a built-in palette and the app copies it into "My Palette 1" and saves the change there, and the editor says so.

![The slot editor with a note under the hue bar: the built-in palette stays as it is and the change is saved to a copy](/blog/superpdf-pen-nodes-color-weight/custom-palette-editor.png)

The popover's title row holds the palette menu and an **Edit** button. With Edit on, each slot shows a pencil and a tap opens its editor; saving returns to the grid so you can fill all ten in a row. The long-press stays, but a hidden gesture alone never made "put a colour in each slot" discoverable.

![The palette menu: three built-ins, a My Palettes section with a checkmark, then new, rename and delete](/blog/superpdf-pen-nodes-color-weight/custom-palette-menu.png)

A new palette starts as a copy of the current one, not empty, because an empty slot would hide every underline drawn with it. Deleting a palette falls back to basic; underlines keep their slot numbers and simply show basic's colours.

What lost: a single custom palette (switching presets would still lose it), editable built-ins (pastel would stop meaning pastel, and we would need a reset), and a per-palette slot count (shrinking it leaves underlines with nowhere to go). Saved settings migrate on first launch: a palette matching a preset selects that preset, an edited "Custom" one becomes My Palette 1 with the same colours.

## What is left

Annotated PDF export writes the current palette's slot colours. Re-importing maps them to the nearest of the old four, since import exists for other apps' annotations; pastel green can come back as the sky slot.

## History

- 2026-09-25 — handwriting image nodes, toast from all three paths, editable colour slots, three line weights, popover size-loop freeze
- 2026-10-28 — pick any colour from a popover, colour meanings removed, filters list every colour used
- 2026-11-03 — popover reworked into two paged sections of two rows, pinned height and forced arrow removed
- 2026-11-03 — back to slots: ten-slot app-wide palette, slot index stored, presets and slot edits recolour everything, old hex moved on open
- 2026-11-03 — my palettes: built-ins stay read-only and edits go to a copy, palette menu and Edit button, deleting falls back to basic
