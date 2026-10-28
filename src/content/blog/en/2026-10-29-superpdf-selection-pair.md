---
title: "Select a highlight in the PDF and its node lights up in the map — and the map now uses the full width at any zoom"
date: 2026-10-29T02:05:31+09:00
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
