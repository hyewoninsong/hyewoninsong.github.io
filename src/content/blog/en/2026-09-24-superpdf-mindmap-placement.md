---
title: "An underline made on an earlier page was landing at the end of the map"
date: 2026-09-25T09:00:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "gesture"]
summary: "New underline nodes now slot into their siblings in book order instead of at the end, without touching anything you reordered by hand. Keyboard commands, a + handle on the selected node and edge auto-scroll came with it, plus a fix for sort orders assigned from count."
---

Every underline in SuperPDF becomes a mind-map node. Until now that node went after the last underline node under the same parent. Reading front to back, that is book order. Go back from page 20 to page 10 for one more line, and the node lands after page 20. For someone who re-reads only their underlines, a map that disagrees with the book is a map they stop opening.

## New nodes slot in by book order

Nodes that point into the PDF (underlines, handwriting, cropped regions, "add to map" from the list) now find their place among their siblings by file, page and position on the page.

| Among the siblings | The new node goes |
|---|---|
| Some underline nodes are at or before my position | Right after the last of them |
| All of them are after me | Before the first underline node |
| There are no underline nodes | At the end, as before |

Which parent it goes under has not changed: next to the selected node, or under the page's chapter when nothing is selected. Only the position among siblings moved.

## Controls

| Action | Result |
|---|---|
| Tap | Select; jump to the PDF if the node is an underline (unchanged) |
| + button on the selected node's edge | Add a child, editing inline right away |
| Drag a node to the canvas edge | The canvas keeps scrolling that way |
| Tab / Return | Add child / add sibling after |
| Arrows | Move selection to sibling, parent, first child; → expands a collapsed node |
| ⌘↑ ⌘↓ | Reorder among siblings |
| Space / Esc / ⌫ | Jump to PDF / cancel / delete |

Every new node opens empty, and leaving it empty removes it. The "Add node" alert for root nodes is gone. Auto-created nodes are scrolled into view and flashed, but a collapsed parent stays collapsed; its hidden-count badge just ticks up.

## Why a local insert and not a re-sort

Re-sorting all siblings by book order is less code. It lost because anything you moved by hand would snap back on the next underline. This map is for arranging while reading, not a generated list. A local insert only wedges the new node between existing ones, so hand placement survives. A per-parent "manually ordered" flag was the other option; it adds state the user cannot see.

## `count` is not the next number

Child nodes were numbered with `children.count`. Delete the middle of three, add one, and the new node gets 2, the same as the surviving third. Ties have no stable sort order, so the two swapped on every re-layout. A data bug that looked like flicker. Top-level nodes had always used `max + 1`; the fix routes children through the same rule and renumbers from 0 on sibling inserts, which also repairs duplicates already saved. The guarding test is create three, delete the middle, add one, assert all numbers differ. Fixtures that only create never hit it.

A second one surfaced in regression: undoing an underline removes its node without passing through the view model, and `selectedNodeId` kept the dead id. The dragging id was already reconciled at that point; the selection was not. Now every id-typed state is checked against the rebuilt index.

## Where it stands

964 unit tests pass on the iPad Pro 11-inch simulator. The keyboard has not been pressed by hand yet: ⌫ with the search field focused and Space while the PDF has focus still need checking.

## 2026-09-24 — Children go below, and any node drags

Four reports came in the same evening after reading a real book on the iPad: pen-made nodes were hard to drag, children attached to the right forced sideways scrolling, Korean word spacing was still broken, and graphs and tables should become nodes too.

### An outline instead of a sideways tree

![Children sit on the row below the parent, indented, sharing one vertical spine](/blog/superpdf-mindmap-placement/outline-map.png)

Children now stack **on the row below their parent, indented 28pt**, joined by elbow connectors that share one spine per parent. Depth adds an indent, not a column, so the map reads top to bottom like the underlines it came from. Keeping the horizontal tree with auto-collapse lost because expanding brings the width back; a horizontal/vertical toggle lost because it doubles every drop rule, handle and scroll path. A map taller than the pane now opens top-aligned instead of centred.

![Split view with the PDF above and the map starting from its first node below](/blog/superpdf-mindmap-placement/outline-split.png)

### Drag without selecting first

The "pen nodes won't drag" report was every node's problem, visible only when you underline and immediately move the new node. The drag gesture accepted **only the selected node**. The node view attaches its double-tap (edit) before its single tap (select), and SwiftUI then delivers the single tap only after the double-tap window, about 0.3 s. Tap and drag right away and the first `onChanged` sees no selection; the node drag never starts and the canvas pan, which shares the touch, wins. Wait a moment and it works.

The fix removes the condition: any node drags, and starting a drag selects it without jumping to the PDF. Long-press-to-lift lost because long press is already the context menu; handling the single tap immediately lost because every double tap would jump to the PDF first. Why it was missed: every drag test called `startDragging` directly, and simulator checks did tap, pause, drag. The rule kept: never gate a gesture's start on a value another gesture produces asynchronously.

For the same reason, tapping the image of a cropped-region node now selects the node first; a second tap opens the full-size preview. Dropping in empty space resolves against the nearest node on that row.

### The canvas keeps the map in view

Panning is bounded: you cannot pull past the top-most or left-most node, nor past the right or bottom. Past the edge it resists with the `UIScrollView` curve `(1 - 1/(x·0.55/d + 1))·d` and springs back on release. Pinch end, rotation and scroll-to-node clamp to the same range.

### Cropped graphs and tables

Cropping a region into an image node already existed in the toolbar's crop mode, but the stacked PR never reached main, so no test build had it. It ships with this merge. The image box is 160pt wide and 48–120pt tall by the image's aspect, so a flat table no longer floats in a 120pt slot.

### Where the spacing broke

An experiment first: Myungjo and Gothic justified paragraphs, blurred, JPEG-compressed, downscaled and skewed, through Vision. On the 149 lines it read correctly, word boundaries were all right; the errors were glyph misreads at low resolution. So broken spacing in typeset books was on our side: the whole-page pre-read path skipped the glyph-geometry reflow the region path already had. Both paths now share it, and book-font scan images run through the app's own render path in tests.

### Where it stands

994 unit tests pass. On device: underline then drag the new node immediately, pull past the edges to feel the resistance, crop a table from a scanned book.

## 2026-09-25 — The map scrolls vertically

Yesterday's pan bounds stopped you losing the map, but the canvas still drifted wherever the finger went. An outline reads top to bottom; a vertical drag that slides a little sideways makes the rows look misaligned. The canvas is now a vertical scroller.

### One axis at a time, horizontal only when it overflows

| Drag | Result |
|---|---|
| Vertical | Scrolls, even when the map is shorter than the pane; rubber-bands at the end |
| Horizontal | Scrolls only when the map is wider than the pane; otherwise nothing |
| Diagonal | Locks to the larger axis within the first 6pt and stays there until release |
| Release | Slides with the throw and stops at the bounds |

It is the grammar of a `UIScrollView` list with `isDirectionalLockEnabled` and `alwaysBounceVertical`. An axis that fits the pane is pinned to its centre, so a zoom change, a rotation or a restored position all snap the map back to the middle with one clamp.

![The node area is a rounded region one shade darker than the pane; the fit-to-screen button sits in the bottom toolbar](/blog/superpdf-mindmap-placement/map-region.png)

The node area now has a floor: the pane is white, the area one shade darker, so "this is the map" is visible in light and dark. It lives in content coordinates and moves with the nodes; it is left out of image export.

### Fit to screen

There was no way back after zooming and scrolling around. Double-tap the empty background, tap the toolbar button, or press ⌘0 and the whole map fits the pane. The scale is the smaller of "fits" and 1: a two-node map is not enlarged three times, and it never drops below 0.3 where text is unreadable.

### Colour menu in node colours

![The colour submenu shows a filled circle in each node colour, with a checkmark on the current one](/blog/superpdf-mindmap-placement/color-menu.png)

The colour menu used emoji circles, which do not match the node colours. Tinting `Image(systemName: "circle.fill")` does not work here: the context menu is a `UIMenu`, and `UIMenu` tints every symbol image the same colour. Colour survives only as an `.alwaysOriginal` bitmap, so the swatches are rendered from the node colours, and the items are `Toggle`s so the current colour gets a checkmark.

Replacing the canvas with a `UIScrollView` lost because node drag, the root drop zone and pinch anchoring all live in the current coordinate system; the lock and the inertia were a few pure functions. Horizontal rubber-banding when nothing overflows lost because it contradicts "only when it overflows". A bounce after the slide lost because the rubber band already says "end".

## History

- 2026-09-24 — book-order insert, keyboard, + handle, edge auto-scroll, sortOrder fix
- 2026-09-24 (evening) — outline layout, drag without selection, rubber-band pan bounds, crop nodes shipped, page-OCR spacing
- 2026-09-25 — axis lock, horizontal only on overflow, inertia, fit to screen, node-area floor, colour swatches
