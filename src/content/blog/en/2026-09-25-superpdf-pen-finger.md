---
title: "Letting the pen draw with a finger revealed it never drew at all"
date: 2026-09-25T08:00:00+09:00
app: "superpdf"
tags: ["devlog", "gesture", "uikit"]
summary: "SuperPDF's pen mode now draws with one finger and scrolls with two. Making that change showed the canvas had never received a single touch: PDFKit page views ignore touches by default. Same day, the underline-only view started showing cropped regions."
---

SuperPDF's pen mode no longer needs an Apple Pencil. One finger draws, two fingers scroll. On iPhone, where nobody has a Pencil, the pen mode used to do nothing at all.

## One finger draws, two fingers scroll

| Input | Read / highlight / crop | Pen |
|---|---|---|
| One-finger drag | Scroll | Draw |
| Two-finger drag | Scroll | Scroll |
| Pinch | Zoom | Zoom |

The PencilKit canvas switched from `.pencilOnly` to `.anyInput`, and in pen mode the PDF scroll pan's `minimumNumberOfTouches` goes up to 2. This works the same way as drawing with a finger in Notes. Strokes that start at the left edge are also kept from turning into a back swipe.

We dropped the other options. A "draw with finger" switch would be one more thing to remember. Long-press-then-draw is too slow for short handwriting strokes. A separate scroll button takes up screen space for a gesture everyone already knows.

## The canvas never got a touch

After the change, a finger drag in the simulator left nothing: no stroke, no scroll, and undo stayed disabled. A dump of the view hierarchy showed that PDFKit's internal `PDFPageView` has `isUserInteractionEnabled == false`. Our overlay canvas sits under it, so hit-testing never reached it. `PDFView.isInMarkupMode` is the switch that turns page-view touches on. We now set it together with pen mode, and strokes arrive.

A Pencil touch goes through the same hit-test, so pen mode had most likely been broken from day one. The simulator hid the bug: its touches are finger touches, and a Pencil-only canvas ignoring them looked like expected behavior.

## Crops show in the underline-only view

The eye toggle and review mode used to cover cropped regions, on the theory that they are figures and not text. But a crop is something you meant to come back to. The mask now reveals crops too.

## What's left

Real Pencil input and two-finger scrolling still need a device check, because XCUITest has no two-finger drag. In pen mode, a finger tap on an existing highlight may select it and also leave a dot.

## History

- 2026-09-25 — finger drawing in pen mode, page-view touch bug, crops in the underline-only view
