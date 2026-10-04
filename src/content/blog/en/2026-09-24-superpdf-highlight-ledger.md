---
title: "The underline is the record now, and the mind map is one view of it"
date: 2026-09-24T17:00:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "data"]
summary: "Each underline used to be a mind-map node and nothing more. Now underlines live in their own ledger, the PDF is never rewritten, and the map and a new review mode are two views of the same data."
---

MindPDF is my own iPad app for reading PDF ebooks with a colour pen, then re-reading only what I underlined. Until today every underline became a mind-map node, and that node was the highlight. The relationship is now reversed: the underline ledger is the data, and the mind map and a new review mode are two views of it.

## Underlines live in their own ledger

Each underline is a SwiftData `Highlight` row, drawn as an overlay. The PDF file is never rewritten. Tapping a map node jumps to the passage and flashes it, so the link finally goes both ways. Consecutive underlines become siblings instead of a parent-child-grandchild chain. Apple Pencil starts an underline on touch; a finger still needs a long press. Tap an underline for a popover with colour, highlighter or underline style, note, copy, delete and show-in-map. Undo and redo work.

## Three ways to re-read

| Tab | What you see |
|---|---|
| Underlines only | The page, with everything but the underlines dimmed |
| Compact reading | A strip of the underlined lines as image crops, in page order; tap to jump |
| List | Grouped by chapter, with colour filter, search and promote-to-map |

Chapters come from the PDF outline, or from font-size heading detection when there is none. A new underline lands under its chapter when nothing is selected. Each colour carries a per-project meaning: yellow for key points, green for actions, blue for quotes, red for questions.

Scanned books get a page-level OCR cache, visible page first and then a background sweep, so underlines snap to OCR lines; quotes are back-filled later. Search covers underlines and body text. Export goes to Markdown, annotated PDF, map PNG or OPML. Pencil handwriting groups and rectangle crops become nodes too, and on-device FoundationModels suggest short labels, a parent and chapter summaries as chips that are never applied automatically.

## Why this and not that

- **Keep node = highlight and add features on top.** Every feature, from the review list to export to deleting a node without losing the mark, would have needed the node to exist, and deleting a node from the map deleted the reading trace. The daily surface is re-reading underlines, not the map.
- **Write highlights into the PDF as PDFKit annotations**, which is what the app did. Every stroke rewrote a 500-page file, there was no undo, and an "underlines only" view meant parsing the file back. Lost on cost and on never modifying the original.
- **Nest each new highlight under the previous node**, also what the app did. Five underlines produced a deep chain, because readers do not pick parents while reading. Replaced by "the book decides": outline chapters as parents, siblings otherwise.
- **iCloud sync** was left out on purpose. SwiftData with CloudKit needs optional relationships and no unique constraints; that is a schema redesign to decide separately.

## 400 tests crashed at a different place each run

The full unit suite crashed the whole bundle at a different test each run, and every failing test passed on its own.

A background `Task` for chapter extraction captured a SwiftData `PDFFile` model. Once the test's container was gone, a plain property read asserted. Capturing the `ModelContext` too did not help; a context does not keep its container alive, and `context.container` itself asserted. Capturing the container was still not enough for a row that had been deleted and saved: CoreData threw "could not fulfill a fault" and the process terminated.

The fix: capture the id, file URL, context and container synchronously where the task is created; after the await, re-fetch the row by id and write only if it still exists; keep the task on the view model and cancel it on leave. Reading the crash report first would have found it in minutes, since the faulting thread named the getter, instead of half a day chasing the failing test.

## Rotation was already applied

`PDFPage.draw(with:to:)` already applies the page rotation and the cropBox origin. The OCR renderer multiplied `transform(for:)` in again, so rotated scanned pages OCR'd to nothing and pages with an offset cropBox shifted every line by exactly that origin. A 40-line pixel probe settled it rather than the documentation: draw a black bar, read back the bounds of the dark pixels.

## Not yet seen on screen

Four stacked PRs on the app repo and 842 unit tests on the iPad Pro 11-inch simulator, but nothing exercised visually yet. iCloud is the open decision.
