---
title: "An underline made on an earlier page was landing at the end of the map"
date: 2026-09-24T23:30:00+09:00
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
