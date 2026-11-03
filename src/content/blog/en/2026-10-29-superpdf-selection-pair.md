---
title: "Select a highlight in the PDF and its node lights up in the map — and the map now uses the full width at any zoom"
date: 2026-11-03T09:28:33+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "Tap an underline and the map selects its node; tap a node and the PDF selects its underline. The map column no longer shrinks to a narrow strip when you zoom out."
---

With the PDF and the map side by side, a selection on one side now shows on the other. Tap an underline and the map scrolls to its node; pick a node and its underline gets handles while the others dim.

## Select on one side, see it on the other

![Selecting a node in the map puts handles on the same underline in the PDF above; the zoomed-out map below still spans the full width](/blog/superpdf-selection-pair/map-pdf-selected.png)

| You do | PDF | Map |
|---|---|---|
| Tap an underline | Handles and edit bar | Its node is selected and scrolled into view |
| Tap a node | Handles on its underline, turning to that page if needed | Node selected |
| Tap empty space on either side | Cleared | Cleared |

Two exceptions. When the map is hidden, selecting in the PDF leaves the map alone — the map selection decides where the next underline's node goes, so changing it out of sight would misfile the next one. And on a one-pane phone layout, picking a node while editing the map does not jump you to the PDF.

## Why two selections, kept in sync

A single selection would have been simpler, but it cannot hold an underline with no node, or a chapter node with no place in the text. Two selections that mirror each other handle those by clearing the other side.

The catch was paging: the PDF used to drop the selection on every page change, so jumping to a node's page immediately cleared it — and the map's selection with it. Now the selection is only dropped once the underline is more than a page away.

## The zoomed-out map left half the screen empty

The map laid its column out at the pane's width, then scaled the whole drawing. At 0.5x the column took half the screen and sat centered. The column width is now divided by the zoom, so it always fills the pane; zoom changes only text size. The re-layout happens once when the pinch ends, not on every frame.

## Where it stands

Verified on the simulator with a forced two-page spread; not yet on a real unfolded phone.

## 2026-11-03 — Now the scroll moves together too

The two panes used to share only a selection. Now they behave like a markdown source and its preview: scroll the map and the book follows, turn a page and the map follows.

![The map is scrolled to page 8's notes, and the book beside it has turned to page 8](/blog/superpdf-selection-pair/map-book-together.png)

Each underline node links a height in the map to a place in the book, and everything between is a straight line. Matching heights by percentage was simpler, but pages dense with underlines drifted away from the node at the top. Syncing by whole pages made the map jump on the scroll board.

The price is map order. Top to bottom has to mean book order, so dragging nodes, ⌘↑↓ and detach are gone. Older hand-arranged maps are not silently re-sorted; out-of-order nodes are just left out of the calculation.

To stop the panes pushing each other, the book only counts as moved by a person while a finger is on it or it is coasting, and whichever side is driving holds the lead for 0.6 seconds. Tapping a node moves only the book. Sync stays off when only one pane is visible and while editing the map.

Verified on an iPad simulator; not yet on a real device or an unfolded phone.

