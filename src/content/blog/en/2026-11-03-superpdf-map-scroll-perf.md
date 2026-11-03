---
title: "The mind map stuttered as it grew — every finger move rebuilt the whole map"
date: 2026-11-03T09:42:06+09:00
app: "superpdf"
tags: ["devlog", "swiftui"]
summary: "A 1,000-node map panned at 3fps. Splitting the node layer out and drawing only what is near the screen fixed it, and recorded frames caught the two new problems that caused."
---

The more you underline a book, the more you scroll its map, and that was exactly when scrolling stuttered. A map with 1,000 nodes now follows your finger.

## Every frame rebuilt the entire map

We seeded 1,000 nodes, 100 of them images, and panned at a fixed speed. This is a debug build on the simulator, so the difference matters more than the absolute values.

| | Before | After |
|---|---|---|
| Average frame | 304ms | 17.5ms |
| Frames in 8 seconds | 27 | 459 |
| Node `body` runs per frame | 1,047 | 2.2 |

The canvas moves through a `@State offset`, and the same view built the node tree. Each offset change re-ran it, and fresh closures on every node stopped SwiftUI from skipping any of them. Each node then decoded its thumbnail again. Off-screen nodes were live views too.

## Two changes

The node layer became its own view that never sees the offset and takes only plain values, so SwiftUI skips it while panning. A single closure property would undo that.

We then draw one screen above and below what is visible. The range snaps to half-screen steps, because a value that changes every frame would defeat the skipping.

The alternatives lost quickly. Splitting without culling keeps every view alive. `UIScrollView` would mean rewriting drag and pinch coordinates. `.drawingGroup()` hits texture limits on very tall maps.

## Culling brought two new problems

**Blank flings.** Inside `withAnimation`, `offset` is already the destination, so the drawn range jumped ahead of the screen. We now draw the whole path from start to end during the animation. Our first check proved nothing: XCUITest swipes stayed inside the margin, and even the control passed. Throwing 4,000pt by code showed the gap, with 17 fully blank frames without the fix and none with it.

**Faded content.** Widening the range inside `withAnimation` made new nodes fade in with `.transition(.opacity)`, so the map looked grey for the whole fling. Our blank-frame check passed it, because text was still present. Only looking at the frames showed it. Widening the range before the animation starts fixed it.

Gestures and focus live on views, so the dragged, edited and selected nodes always stay. VoiceOver and image export still get every node.

## Where it stands

This has not been measured on a real device yet. Long edge-scroll drags and VoiceOver have not been run for real either; the drag rule is covered by unit tests only.
