---
title: "The more of a book you had read, the slower it opened"
date: 2026-10-25T17:10:49+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "data"]
summary: "Large scanned PDFs froze on open until TestFlight offered to report it. The PDF was not the problem: every page's OCR results were decoded on the main thread, twice. Now only page numbers are read on open and lines load per page. 2.6 s became 0.15 s on 800 pages."
---

Large scanned books now open right away in SuperPDF. Before, the app stalled and TestFlight offered to send a report, and the longer you had been reading the book, the worse it got.

## The PDF already loaded only what you see

The obvious suspect was the PDF itself. We measured: a 960 MB, 800-page image PDF opened in tens of milliseconds, and attaching it to the view took tens more. PDFKit already draws only visible pages. A 2,000-page text PDF opened in under a second. Nothing reproduced, because both files were freshly imported and empty.

## A well-read book has a full OCR cache

For scans, the app OCRs each page and stores the lines as JSON, which is what snaps underlines to text and makes body search work. We filled all 800 pages with OCR results, added 300 underlines, and timed each step of opening the file. The main thread stalled for 2.6 seconds, on a Mac simulator.

| Step on open | Time |
|---|---|
| Repairing split quotes: decoded every page first, even with nothing to repair | 1.24 s |
| Starting the OCR scheduler: decoded every page to learn which were done | 1.36 s |
| Everything else | under 0.1 s |

Both jobs were small. Both decoded 800 pages of JSON first, because the model's `lines` property runs `JSONDecoder` on every access. The cache grows as you read, so opening slowed down with use.

## Page numbers on open, lines on demand

- On open, fetch only the page numbers (`propertiesToFetch`), which never touches the JSON.
- Decode a page's lines the first time something asks for that page: the one on screen, the one being underlined.
- Quote repair reads only pages that have something to repair, usually none.
- Work that needs every page, body search and OCR chapter titles, takes raw bytes on the main thread and decodes in the background.

Same data: 2.6 s became 0.15 s. Moving the full decode to a background thread would also have unblocked the main thread, but underlining right after opening would wait on it, and 800 pages would sit in memory for the few that are visible.

## Why we missed it

The day before, chasing the same report, we fixed a different freeze and wrote down that a 400-page scan with a full cache opened in "two to five seconds, fine." On a simulator, two seconds is already a signal. Large-document performance has to be measured with data that looks like long use, not an empty file.

## Where it stands

Still to confirm on a real device. Body search still copies every page's bytes on the main thread, without the decode; if a bigger book makes that noticeable, it gets split per page too.
