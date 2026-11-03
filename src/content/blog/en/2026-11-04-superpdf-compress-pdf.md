---
title: "A 100 MB scanned book, cut to a third — pages become JPEG, text becomes an invisible layer"
date: 2026-11-04T01:24:13+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "data"]
summary: "SuperPDF can now export a smaller copy of a book. Scanned pages are re-rendered as JPEG at the resolution you pick, and the app's OCR result is laid over them as invisible text so other apps can still search. iOS has no API to swap just the image inside a page, so we re-render the whole page."
---

Scanned Korean books are 300 dpi colour images on every page, and a single volume easily passes 100 MB. There was no way to shrink one inside SuperPDF. Now the export menu has "Make a smaller PDF": pick a quality, tap, and a smaller copy lands in the share sheet.

## Three quality levels, and a text layer

![The export menu with the new item](/blog/superpdf-compress-pdf/menu-open.png)

Four options: quality (high 200 dpi, medium 150, low 100), grayscale, include recognized text, and rasterize text pages too. The sheet header shows the current size and page count.

![The options sheet — 7.4 MB, 6 pages](/blog/superpdf-compress-pdf/options-sheet.png)

The text layer is the point. Re-rendering a scanned page turns its letters into pixels, so the app lays its OCR result over the page as invisible text (PDF text rendering mode 3), one line at a time, sized to the line height and stretched to the line width. Select that spot in another app and you get that line. OCR already runs in the background while you read, so most pages come from cache; pages not yet recognized are run through Vision on the spot. If one page fails, that page goes without text — the book is not abandoned.

![The share sheet — the same book at 3.3 MB](/blog/superpdf-compress-pdf/share-result.png)

A six-page scanned sample went from 7.4 MB to 3.3 MB (medium, grayscale). If the result is not smaller, you get a notice instead of a share sheet, with the one option that would help.

## Why the whole page is re-rendered

Desktop tools keep the page structure and downsample the images inside. PDFKit and Quartz on iOS have no API for replacing an image object inside a page, so without a third-party PDF library the only route is to draw the page into a bitmap and build a new page from it.

So by default only scanned pages are touched. Pages with a text layer are usually small, and rasterizing vector text makes it worse. Those pages stay byte-identical: we replace the scanned pages inside the original `PDFDocument` and write it out, so the untouched pages are not even re-encoded. A toggle rasterizes everything; then the text layer of text pages is carried over line by line via `PDFSelection.selectionsByLine()`.

Paths we dropped: `PDFPage(image:)` (no control over compression — it goes in as Flate and gets bigger), redrawing the whole book into one `CGPDFContext` (annotations, links and forms on text pages vanish), and baking the app's own underlines in (that is what the annotated export is for).

## JPEG has to stay JPEG

One quiet way to get this wrong: compress the bitmap to JPEG, reopen it as an ordinary `CGImage`, draw it — and Quartz takes the pixels and re-encodes them with Flate. The file renders fine and is just as big. Wrapping the JPEG bytes with `CGImage(jpegDataProviderSource:)` makes Quartz embed the stream as DCTDecode untouched. You cannot see the difference, so a test guards it with a noise image: noise does not shrink under Flate, only under JPEG.

The page coordinate system is preserved — new media box equals the original crop box, rotation is re-applied, original annotations move over. Underline coordinates stay valid, which keeps the door open for replacing the book's PDF in place later.

## History

- 2026-11-04 — smaller PDF export (quality, grayscale, text layer)
