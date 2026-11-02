---
title: "SuperPDF gets the reader basics — and a page turn that got 0.3 seconds slower"
date: 2026-11-02T21:38:01+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "A table of contents, go-to-page, pinch zoom on the paged view, bookmarks, a night page tone, and undo for deleting a book. The hard part was a delayed page-turn tap and a bug that appeared in 12 of 18 launches."
---

Long books are now easy to get around in SuperPDF. Jump by chapter, go straight to a page number, and pinch to read small scanned text without leaving the page-turning view.

We had spent our effort on underlines and the map, so a few things every PDF reader needs were missing.

## Everything you need while reading is in the bottom row

| You want to | Now you |
|---|---|
| Find a chapter | Open Contents, with the current chapter marked |
| Mark a page | Tap the bookmark; they collect beside Contents |
| Go far away | Tap "42 / 320", then use the slider or a number |
| Read small text | Pinch, or double-tap |
| See the next match | Use the `‹ 3 / 17 ›` bar, or ⌘G |
| Read at night | Choose Original, Sepia or Night |

![Zoomed in, the page fills the screen and underlines stay on their words](/blog/superpdf-reader-basics/zoom-fills-screen.png)

Night tone inverts brightness when the page is drawn, rather than filtering the screen. Underlines and ink sit on top in their own colours.

![In night tone the yellow highlight stays yellow, and the toolbar and tooltip turn to dark glass](/blog/superpdf-reader-basics/night-tone-tooltip.png)

![Sepia tone. The area around the page matches, so turning pages doesn't flash white](/blog/superpdf-reader-basics/sepia-tone.png)

## Undo instead of asking

Deleting a book no longer shows a "this can't be undone" alert. The card disappears and an undo toast stays for six seconds. People tap through alerts by habit, and a wrong tap cost every underline and the whole map.

We rejected a stored "deleted" flag: it needs a schema change, and a crash would leave the book hidden. Hiding it in memory means a crash simply brings the book back. Keeping both the alert and the toast would only ask twice.

## Double-tap made page turns late

Adding double-tap zoom delayed edge-tap page turns by 0.3 seconds, because a single tap has to wait for a double tap to fail. We had already rebuilt page rendering to make turning fast, so this wasn't acceptable.

The fix is zones. Double-tap only counts in the middle 60% of the board, so edge taps turn at once. While zoomed it counts everywhere, since page-turn taps are off.

## A shrunken page in 12 of 18 launches

One screenshot showed the scroll view small enough to fit three pages. It looked like a bad capture. Repeating the same launch 18 times showed the branch failing 12 times and main never, in the original tone too.

`PDFView`'s first fit runs asynchronously. If the view isn't in a window yet, its width is zero and the fit quietly does nothing. The recovery path only accepted views that had been fitted once, so a view that missed the first fit could never recover. One more settings subscription shifted update order and exposed the gap. Letting recovery accept unfitted views gave 18 good launches out of 18.

## Where it stands

Two-page zoom, a real finger pinch and haptics can't be checked on a simulator, so they still need a device.
