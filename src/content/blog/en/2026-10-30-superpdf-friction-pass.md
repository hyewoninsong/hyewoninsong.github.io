---
title: "\"What would make this better to use?\" — thirteen small frictions in the read, underline, re-read loop"
date: 2026-10-30T01:47:38+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "No big feature: we walked the read, underline, re-read loop and fixed thirteen snags, grouped as finding again, undoing, explaining and fitting the hand. Plus the iPad keyboard and Dynamic Type traps we hit."
---

The answer to "what would make this better to use" was not a feature but a list of snags along one loop: open a book, underline, come back later and re-read only the underlines. We fixed thirteen of them, one PR each.

## Finding things again

- **Home cards** show `42 / 320 pages · 5 underlines` and a thin progress bar. They read stored values only and never open the PDF.
- **Home search** now finds underlines, memos and node titles across every book. Tap a result and that page opens with the underline selected. Usually you remember the sentence, not the book.
- **Map edit mode** shows a `p.N` chip on the selected node that jumps to the page.

## Undoing mistakes

iPhone has no ⌘Z, so deleting an underline had no visible way back.

![The undo toast right after deleting a node](/blog/superpdf-friction-pass/undo-toast.png)

- Deleting an underline or a node shows a 4-second "Deleted · Undo" toast. If anything else was edited in between, the button hides, so it can never undo the wrong thing.
- Map edits (move, delete, rename) are now undoable too, reversing an earlier decision. The old reason was avoiding SwiftData's automatic undo, not that map edits were risky. Registering explicit reverse operations by ID, as the underline ledger does, avoids that, and both now share one undo stack.
- Import shows "Importing 2 / 5" and one alert listing each failed file with its reason. Files that are not PDFs, are corrupt or are password-protected are rejected up front.

## Explaining what is hidden

![The text-recognition progress chip, readable in dark mode](/blog/superpdf-friction-pass/ocr-chip-dark.png)

- Scanned books showed `OCR 12/240` in tiny grey text. It is now a "Recognizing text 12 / 240" chip that explains itself on tap. Its background is opaque because Liquid Glass turned grey over a white page in dark mode and the text vanished.
- TipKit tips teach the hidden gestures (tap to hide buttons, long-press to underline, drag handles), and a "How to read" page lists them all.
- Empty states now say what to do, with a primary button.

## Fitting the hand

Tap areas grew to 44pt without changing visual size. Icons follow Dynamic Type, capped inside fixed frames so the two-row toolbar does not overflow. iPad keyboards get arrow and Space page turning and ⌥⌘1/2/3 tool keys. One glossary now governs copy: book, PDF, underline, page, undo.

## Three traps

**Bare arrow-key shortcuts never reached the app on iPad.** `.keyboardShortcut(.rightArrow, modifiers: [])` in a menu is processed after the focus system and scroll views claim arrow keys. Space and ⌥⌘2 worked. The fix is a `UIKeyCommand` with `wantsPriorityOverSystemBehavior`, which SwiftUI cannot express, so a small view controller behind the reading board owns those keys.

**A `Menu` label icon ignored our Dynamic Type cap.** At accessibility sizes the "…" button alone was huge, because a `Menu` label uses the system font and skipped the capped helper. Audit every sibling when you introduce a cap.

**A copy sweep must skip strings that stored data is compared against.** A placeholder node title is compared character by character with what is saved to decide whether OCR should fill it in. Rewording it would have orphaned existing nodes. We left it alone and added a test that fails if retired terms reappear.

## History

- 2026-10-30 — thirteen frictions
