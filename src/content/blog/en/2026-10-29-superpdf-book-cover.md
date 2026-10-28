---
title: "Leave the app and it closes like a book; unfold the phone and the book opens"
date: 2026-10-29T01:33:27+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "Come back after a while and a cloth cover waits; tap it and it swings open on its left edge. On an unfolded iPhone Duo the bookshelf gets an inside cover on its left. The settings sheet now picks one or two columns from its own width."
---

Come back to SuperPDF after more than two minutes and a cloth-bound cover is waiting. Tap it and it swings open on its left edge, with your page still underneath. Unfold the phone and you get an open book instead: an inside cover on the left, your bookshelf on the right.

## The cover is a lid, not a navigation

| When | What you see |
|---|---|
| Cold launch | Front cover |
| Back after the chosen delay (now, 1, 2, 5 min, never; default 2) | Front cover |
| Tap the cover | It turns away on its left edge (fades with Reduce Motion) |
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

The folded simulator would not rotate to landscape under test, so the wide layout was checked on iPad. Folded landscape, a real unfolded Duo, and the dark status bar text over the cloth still need a look on device.
