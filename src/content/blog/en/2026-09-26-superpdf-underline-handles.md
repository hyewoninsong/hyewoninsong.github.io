---
title: "The underline you saw while drawing wasn't the one you got"
date: 2026-09-26T23:59:00+09:00
app: "superpdf"
tags: ["devlog", "gesture", "uikit"]
summary: "On scanned books, underlines broke between words while drawing and then covered whole lines when you lifted the pencil. Preview and commit were computing the range separately. Now they share one calculation, and you can drag handles to adjust an underline afterwards."
---

In SuperPDF an underline now covers exactly what you dragged over, and afterwards you can drag its start and end handles to change it. The report came from reading a scanned book on iPad: stop mid-sentence, lift the pencil, and the underline ran to the end of the line anyway.

## Draw what you drag, fix it with handles

![An underline starting mid-line and ending mid-line on the next line, with a handle at each end](/blog/superpdf-underline-handles/partial-underline.png)

The first line starts at the glyph you touched, the last line ends at the glyph you lifted on, and the line is continuous in between. A fresh or tapped underline gets iOS-style handles.

| Action | Result |
|---|---|
| Drag the end handle | Start stays, end moves |
| Drag the start handle | End stays, start moves |
| Tap empty space, draw again, or switch to pen | Handles go away |
| Undo once | Range, quote and map node title revert together |

![The end handle dragged two lines down; the underline grew and the start stayed put](/blog/superpdf-underline-handles/handle-extended.png)

## Why it broke

The live preview and the final commit computed the range separately. On scanned pages PDFKit's Live Text attaches a runtime text layer; commit already ignored it and used our own OCR, but preview didn't. Live Text's `selectionsByLine()` returns a line as fragments per font and baseline, and the spaces between them belong to no rectangle, so the preview underline had gaps. Commit, meanwhile, snapped to OCR lines that carried no glyph positions, so it always picked whole lines.

## The fix

- One range function, called by preview, commit and handle adjustment alike.
- Fragments on the same row merge into one rectangle (unless the gap is wider than 1.5 line heights, which protects two-column layouts).
- Page OCR now stores the horizontal edges of every glyph from Vision, so a line can be cut at the dragged glyph. Pages OCR'd before this estimate positions from character width ratios.

Handles live in the page overlay, so they follow scroll and zoom, and a touch that starts on a handle wins over drawing and tapping.

## What's left

The estimate on older OCR caches can be off by a glyph or two. Pencil input and real scanned-page OCR need a device, so the next TestFlight build gets checked with the same book.
