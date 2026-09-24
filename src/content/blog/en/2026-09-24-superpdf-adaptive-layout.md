---
title: "Folding a three-column workspace into two, then one, by window size"
date: 2026-09-24T21:30:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "The PDF list, the PDF and the mind map sat in three fixed columns. Now iPad portrait stacks PDF over map, iPhone shows one pane at a time, and the list is an overlay instead of a column. Rotating used to push map nodes off screen; that is fixed too."
---

SuperPDF's workspace used to be three columns side by side: the PDF list, the PDF, the mind map. On a 13-inch iPad in landscape that was fine. On an 11-inch iPad in portrait the PDF column shrank to about 300pt for a 595pt A4 page, and on iPhone each column was 80pt wide. The layout now picks one of three shapes from the window size.

## The list no longer owns a column

The PDF list is a switch you flip occasionally, not something you stare at while reading, so it stopped reserving 220pt. It slides in from the leading edge from a toolbar button and closes itself when you pick a file. No layout ever makes the PDF narrower because of it.

## The window shape decides

The remaining two panes are arranged from the window's size and size classes, not from the device. An iPad running the app in a one-third Split View or a small Stage Manager window has an iPhone's width and gets the iPhone layout.

| Mode | When | Shape |
|---|---|---|
| wide | regular width, wider than tall | PDF left, map right, draggable divider |
| tall | regular width, taller than wide | PDF on top, map below, 60/40 by default |
| compact | compact width or compact height | one pane, `PDF | Map` segmented control |

![iPad landscape. PDF on the left half, mind map on the right half.](/blog/superpdf-adaptive-layout/ipad-landscape.png)

Portrait iPad has only 834pt of width but 1194pt of height, so the split flips vertical. The PDF gets the full width and reads larger than the original; the map is a pan-and-zoom canvas and does not mind being short.

![iPad portrait. PDF takes the top 60 percent, the map the bottom 40, with three nodes centered.](/blog/superpdf-adaptive-layout/ipad-portrait.png)

On iPhone no split works, so it is one pane at a time. The app's core feedback is "highlight, and a node appears beside you", and there is no beside. So highlighting now shows a three-second toast, "Node added to map · View", which jumps to the map pane and scrolls to the node. Tapping a node in the map returns to the PDF pane at the source location.

![iPhone map pane. The segmented control reads Map and three nodes sit in the middle of the screen.](/blog/superpdf-adaptive-layout/iphone-map.png)

## Why a vertical split and not tabs or a drawer

Tabs on iPad would give up the side-by-side moment the app exists for. A bottom drawer with detents is the most native "secondary content" idiom on iOS, but `.sheet` ignores detents at regular width and presents a centered modal on iPad, and on iPhone the highlight popover adapts to a sheet, which cannot be presented on top of an already-presented sheet. The vertical split avoids both and keeps concurrency. The drawer stays on the list for iPhone.

The panes live inside an `AnyLayout` that swaps between HStack, VStack and ZStack, so only the container changes and the children keep their identity. PDF scroll position and map zoom survive rotation. In compact mode both panes stay in a ZStack and the hidden one is transparent and untouchable.

## Rotating pushed the nodes off screen

Found in the screenshot pass: launch on iPhone in landscape, rotate to portrait, open the map, and the nodes sat half cut off at the right edge. On iPad portrait they huddled in the bottom-left corner.

The canvas draws `canvas = content × scale + offset` with a top-left anchored offset, centered once in `onAppear` for whatever size the canvas had then. A point centered in an 852pt-wide canvas is off the right edge of a 393pt one. It never showed before because the map's size only changed by a few points when you dragged the divider; now it doubles on rotation.

The fix is one `onChange(of: geometry.size)`: add half the size delta to the offset so the centered point stays centered, and re-center from scratch when the old size was zero, which is what a collapsed map looks like when it reopens. The capture that catches this has to launch in one orientation and rotate to the other; launching directly in the target orientation makes `onAppear` line up and hides the bug.

## What is left

The old "collapse map" button set the split ratio to 1.0 and produced a negative frame width warning; collapse is its own state now. Divider dragging also compounded the cumulative translation on every event and moved faster than the finger; fixed. An iPhone drawer and a pinned list column for very wide windows are on the list to try.
