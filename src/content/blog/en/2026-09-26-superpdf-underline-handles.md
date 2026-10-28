---
title: "The underline you saw while drawing wasn't the one you got"
date: 2026-10-28T22:40:11+09:00
app: "superpdf"
tags: ["devlog", "gesture", "uikit"]
summary: "On scanned books, underlines broke between words while drawing and then covered whole lines when you lifted the pencil. Preview and commit were computing the range separately. Now they share one calculation, and you can drag handles to adjust an underline afterwards."
---

In SuperPDF an underline now covers exactly what you dragged over, and afterwards you can drag its start and end handles to change it. The report came from reading a scanned book on iPad: stop mid-sentence, lift the pencil, and the underline ran to the end of the line anyway.

## Draw what you drag, fix it with handles

![An underline starting mid-line and ending mid-line on the next line, with a handle at each end](/blog/superpdf-underline-handles/partial-underline.png)

The first line starts at the glyph you touched, the last line ends at the glyph you lifted on, and the line is continuous in between. A fresh or tapped underline gets iOS-style handles (both knobs now sit below the line — see the latest entry).

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

## 2026-10-28 — Handles on the page-turning view, and handles you can see

Earlier that day the underline tool stopped switching the book to vertical scrolling. You now underline right on the page-curl view. But that view only knew long-press-to-draw. The handles lived in the scrolling view, so they were gone. The report came in that evening: start points often land one character off, and there was no way to fix them.

Now underlines on the page-curl view get handles too, and tapping any existing underline brings them back. A touch that starts on a handle is taken by the handle immediately. Anywhere else it fails at once, so page turns and long presses aren't delayed. With handles showing, a tap on blank paper only clears the handles. The next tap hides the buttons.

The handles also got a glass look: a white rim, a soft shadow and a sheen across the top. A yellow knob used to disappear on white paper.

![Old handles: the yellow knobs barely show on white paper](/blog/superpdf-underline-handles/handles-flat.png)

![New handles with a white rim, shadow and sheen, after dragging the start handle left](/blog/superpdf-underline-handles/handles-glass.png)

Ideas we dropped: letting the pencil draw on first touch made underlining and turning the page hard to tell apart. A magnifier helps with the end point, but the start point is fixed the moment you press. Snapping to word boundaries gets in the way when you want to start mid-word.

The lesson: when one tool is implemented by two views, moving it to the other view quietly drops whatever only the old view did. The hit test and drawing are now shared, so the two can't drift apart again.

## 2026-10-28, later — a loupe, both knobs below the line, glass that reads the paper

Three more reports the same night: while drawing, your finger hides the glyph you're about to stop on; the start knob sat above the line, so dragging it covered the very text you were adjusting; and even the glass knobs were hard to spot.

Now the system text loupe (`UITextLoupeSession`) floats above your finger while you draw and while you drag a handle — the same loupe as iOS text selection.

![Drawing an underline: a round loupe above the finger magnifies the glyphs under it](/blog/superpdf-underline-handles/loupe-drawing.png)

When dragging a handle, the loupe follows the end being moved, not the finger, since the finger sits below the line holding the knob.

![Dragging the start handle: the loupe shows the start bar from above, and both knobs sit below the line](/blog/superpdf-underline-handles/loupe-handle-drag.png)

Both knobs now hang below the line. Copying iOS's top start knob was exactly what put the finger over the text.

Knobs are dark glass on light paper and light glass on dark paper, with just a small dot in the underline colour. We judge "light" from the paper under the knob, not the app's light/dark mode: pages stay white in dark mode, so following the mode would put light glass on white paper. Each page keeps a tiny thumbnail and the knob checks the average brightness under it.

This also settles the magnifier we set aside earlier: handles fix the start point, and the loupe shows up while you drag them.

## 2026-10-28, late — tap an underline, get a two-row toolbar instead of a popover

Tapping an underline used to open a popover right next to the line, covering the sentence you were fixing. Worse, the popover was modal: the first tap elsewhere only closed it, and the handles needed a second tap.

Now a two-row glass toolbar floats at the top of the page, split the way Goodnotes splits its pen tools.

![A tapped underline with a two-row glass toolbar at the top: pen types and actions on the first row, three line weights and the current colour on the second](/blog/superpdf-underline-handles/edit-toolbar.png)

- **Row one** — pen type (highlighter or underline), note, edit text, copy, show in map, delete.
- **Row two** — what depends on the pen type: three weights for underlines, then the current colour, which opens the four colour slots in a popover.

Highlighter fills have no weight, so row two shows only colour; crops have neither, so the row disappears. You can now change an existing underline's weight, undoable in one step. Because the toolbar is not modal, one blank tap clears both the handles and the toolbar, and on the page-turning view that tap no longer falls through to hiding the buttons. If the underline sits under the toolbar, the toolbar moves to the bottom.

Colour stays in a popover because four swatches next to the weights make row two too long, and a colour pick is a one-shot choice. Keeping the old popover and letting outside taps through wasn't possible: SwiftUI popovers consume that tap.

## 2026-10-28, near midnight — handles while drawing, and any tap only deselects

Two more came in after the toolbar. While drawing, only the loupe showed and the handles popped in on lift, so drawing and adjusting felt like different tools. And with an underline selected, tapping the screen edge sometimes turned the page instead of clearing the selection.

The live preview now carries both handles while you draw; on lift the real handles land in the same spot.

![Drawing an underline. The loupe magnifies the end, and the preview already has a knob at each end](/blog/superpdf-underline-handles/drawing-handles.png)

With a selection up, every tap now only deselects — no page turn at the edge, no jumping to another underline. Swiping and drawing still work.

The edge leak was recognizer order. The page curl owns a tap recognizer for edge taps, and ours waited for it to fail (`require(toFail:)`), so edge taps never reached our "deselect first" branch. While a selection is up we now disable the page curl's tap recognizers; a disabled recognizer counts as failed, so ours takes the tap. In the scroll view, our tap claims it before PDF links can.

## History

- 2026-09-26 — Underline gaps and whole-line commits fixed; end handles
- 2026-10-28 — Handles on the page-curl view, tap to bring them back, glass-style handles
- 2026-10-28, later — Loupe while drawing and dragging handles, both knobs below the line, paper-aware glass
- 2026-10-28, late — Two-row glass toolbar instead of a popover, one blank tap deselects, change an underline's weight
- 2026-10-28, near midnight — Handles while drawing; any tap only deselects, edge taps included
