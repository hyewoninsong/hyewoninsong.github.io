---
title: "Leave the app and it closes like a book; unfold the phone and the book opens"
date: 2026-10-30T15:37:58+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "Come back after a while and a translucent sheet lies over your document's first page; tap or drag and it curls away like a page. On an unfolded iPhone Duo the bookshelf gets an inside cover on its left. The settings sheet now picks one or two columns from its own width."
---

Come back to SuperPDF after more than two minutes and a translucent sheet lies over the first page of the document you had open. Tap or drag it and it curls away like a page, and your book carries on underneath. Unfold the phone and you get an open book instead: an inside cover on the left, your bookshelf on the right.

## The cover is a lid, not a navigation

| When | What you see |
|---|---|
| Cold launch | Front cover |
| Back after the chosen delay (now, 1, 2, 5 min, never; default 2) | Front cover |
| Tap or drag the cover | It curls away like a page (fades with Reduce Motion) |
| Unfold the phone | An open book: inside cover + bookshelf, no front cover |
| Open a book while unfolded | The inside cover slides away; reading gets the whole screen |

Returning never sends you home. The book you were reading is still open under the cover.

## Open book only on an unfolded iPhone

Unfolded is read from size classes, not the device name: a phone that reports regular width and height. It also needs at least 560pt, so each half keeps 280pt. We passed on three alternatives. A closed cover in the middle of an unfolded screen contradicts the request. A permanent inside cover beside the reader would halve the two-page PDF spread. An open book on iPad would halve the bookshelf for nothing.

## The settings sheet looks at its own width

![Folded portrait: groups stack and the five-way control drops below its label](/blog/superpdf-book-cover/settings-narrow.png)

![A wide sheet: two columns, and each label shares a line with its control](/blog/superpdf-book-cover/settings-wide.png)

Folded landscape and the unfolded form sheet report different size classes, and the sheet's width changes with its detent anyway. So the layout is `ViewThatFits(in: .horizontal)` with the wide arrangement first. Nothing is measured and fed back into state.

At first the wide layout never won. `ViewThatFits` compares ideal widths, and a long footer's ideal width is the whole sentence on one line. Pinning each column with `frame(minWidth: 240, idealWidth: 240, maxWidth: .infinity)` fixed it. Two smaller catches: the row rule stopped at the control's edge in the stacked layout, and SF Symbols tinted with `colorMultiply` stayed black until they were drawn white first.

## Where it stands

The folded simulator would not rotate to landscape under test, so the wide layout was checked on iPad. Folded landscape and a real unfolded Duo still need a look on device.

## 2026-10-30 — The cloth cover became a sheet of tracing paper

The first cover was a cloth binding with a name label. It looked nice but never showed you which book was waiting. Now the cover is one translucent sheet over the open document's first page, with the book's title on top. Tap or drag it and it curls away with the same page curl the two-page spread uses, revealing the sharp first page before handing over to the reader.

![Back from the bookshelf: a translucent sheet over blank paper](/blog/superpdf-book-cover/cover-blank-paper.png)

With no document open, the sheet covers blank paper for now. Where you land after the turn is a setting, "When the cover turns": **last-read page** (default) or **first page**. Always landing on page one would match what was under the sheet, but would lose your place every time.

The first page is rendered off the main thread from the file and pre-blurred, since a page curl snapshots the whole view and a live blur view is risky there. The page controller gets its two pages once; SwiftUI updates only swap images and text.
