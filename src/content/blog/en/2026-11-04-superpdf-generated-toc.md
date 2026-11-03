---
title: "A table of contents for PDFs that have none — and the on-device model that deleted a real chapter"
date: 2026-11-04T00:33:01+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "SuperPDF now builds a table of contents from a book's printed contents page, or from its large headings. Apple Intelligence only judges each row, yet once the real model ran in the simulator it dropped a heading the book itself listed."
---

Most scanned textbooks and publisher PDFs ship without an outline. In SuperPDF you can now tap "Make contents" and get a table of contents you can jump from, built from the book itself.

## One button, three steps behind it

![Contents sheet of a PDF without an outline, offering a "Make contents" button instead of a dead end](/blog/superpdf-generated-toc/toc-empty-generate.png)

1. **Printed contents page.** The front 15% of the book is searched for a "Contents" page with `Title ····· 12` rows. Printed page numbers are shifted to PDF pages by one offset, voted from numeric page labels, the numbers in page headers and footers, and where the first titles appear. Levels come from numbering (Part > Chapter > 1. > 1.1) or indentation.
2. **Large headings.** With no contents page, lines 1.2× larger than body text become headings, and their size buckets become levels. Scans wait until every page is recognized, so a partial pass never saves a contents list that quietly misses later chapters.
3. **On-device model.** If Apple Intelligence is on, the model gets the row list (up to 80 rows) and answers only "is this a heading, and at what level". It never rewrites titles or pages. If it tries to drop more than half the rows, its answer is thrown away.

Siri itself has no API an app can call. The model underneath it does (`FoundationModels`), but with a 4,096-token context it can't read a book, and it could invent page numbers. So the rules come first and the model only refines.

## The real model ran in the simulator

I wrote down that the model's real answers were untested, since the unit tests use a fake client. The next feature's UI test swiped away the row "1.2 다시 읽기" and checked that it was gone. It passed. In the screenshot, though, the row had never been there. On a Mac with Apple Intelligence on, the simulator's model is available, so UI tests call the real thing. It had judged a heading printed on the contents page as "not a heading". The half-drop guard can't catch a single wrong drop, and `waitForNonExistence` passes for something that never existed.

Now, rows read from a printed contents page can't be dropped by the model, only re-leveled. The delete test asserts the row exists before deleting it, which turns it into a regression check wherever the model runs.

## People fix the rest

![Generated contents after renaming the first row and deleting one, reopened. The note says the list was refined on device](/blog/superpdf-generated-toc/toc-generated-edited.png)

Rows of a generated list can be swiped to delete or rename, or long-pressed for the same two actions. A PDF's own outline stays untouched.

## Still open

In the simulator, the first tap on "Save" in the rename alert doesn't close it while the keyboard is up. It needs a device check, and if real devices do the same, the rename moves to a sheet.
