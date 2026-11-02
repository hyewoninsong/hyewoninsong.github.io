---
title: "Fast scrolling flashed white pages, so we slid a picture behind PDFKit's paper"
date: 2026-11-03T01:15:28+09:00
app: "superpdf"
tags: ["devlog", "uikit", "swiftui"]
summary: "Scrolling quickly through a scanned book showed white pages that filled in late. PDFKit places a page before drawing it, so we now pre-render pages and put them inside its white paper layer."
---

You can now fling through a scanned book in SuperPDF without white pages cutting in. Before, each new page arrived blank and filled in a moment later, so the screen kept flickering.

## The white page was PDFKit's paper

A page in `PDFView` is layered: an opaque white layer at the back, with `PDFPageLayerTile` pieces added in front later. PDFKit places the page first and draws tiles asynchronously to keep scrolling smooth. Until they land, you see the paper. Scanned books show it most because every page holds a large image.

## The obvious suspect was innocent

We had just shipped page tones, which override how a `PDFPage` draws. The first measurement agreed with that suspicion: 7 flashes with the feature on, 0 with it off.

That measurement was wrong. XCUITest swipes pace themselves unevenly, so the two recordings weren't comparable. Driving the scroll offset with `CADisplayLink` at a fixed 5000 pt/s gave 12 flashes on and 11 off.

## Why inside the paper layer

We pre-render pages off the main thread, five ahead and two behind, as the page-turn board already does. Where to put the picture was the real choice:

- **On top, in the page overlay:** it hides text selection, and a soft image would cover sharp tiles when zoomed.
- **A new scroll board:** underlines, pen, crop and selection all live on `PDFView`, so the rewrite was too large.
- **Inside the white paper layer:** it stays behind the tiles, so selection and zoom work as before. We chose this.

That layer isn't public API. If we can't find it, we do nothing and you get the old white page rather than a break, and a test watches for the structure changing. The paper also takes the page tone's color, so night mode doesn't flash white if a picture runs late.

## The result

Measured on a 40-page scan at 5000 pt/s:

| | Before | After |
| --- | --- | --- |
| Visible pages with neither tiles nor picture | 34.0% | 0% |
| White flashes in the recording | 12 | 0 |

The after numbers were the same in original and night tones.

## What's left

These numbers come from the simulator, which runs on a Mac and renders faster than a phone. On a device, a page may briefly show plain paper color if rendering falls behind, and that still needs checking on hardware.
