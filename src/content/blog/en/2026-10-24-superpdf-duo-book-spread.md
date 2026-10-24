---
title: "Unfold the iPhone and the PDF opens like a book"
date: 2026-10-24T17:03:11+09:00
app: "superpdf"
tags: ["devlog", "uikit", "gesture"]
summary: "On an unfolded iPhone Duo, SuperPDF lays two pages side by side and turns them with a page curl. Reading tool only; pick the highlighter and the vertical scroll comes back. The fold state is read from size classes, not the device name."
---

Open SuperPDF on an unfolded iPhone Duo and the PDF sits as a left page and a right page. Drag the right page and it curls over. Folded, nothing changes: the same vertical scroll as before. The unfolded screen is 669pt wide, too wide for one page at a readable size, and two pages bring it close to a paperback's column width.

## Two pages, hugging the spine

![Two-page spread in the PDF plus map split](/blog/superpdf-duo-book-spread/spread-split.png)

Even pages go left, odd pages right, each pushed toward the spine. Highlights, underlines and crops made in the scroll view draw on the spread as they are, and tapping one opens the same popover. The page bar reads "1–2 / 3" and the arrows move one spread at a time. With an odd page count the last right page is blank.

![The right page curling mid-turn](/blog/superpdf-duo-book-spread/page-curl.png)

The turn is `UIPageViewController` with `.pageCurl`, `spineLocation = .mid` and `isDoubleSided = true`; each page is a view controller hosting a `PDFView` in `.singlePage` mode. It is the only public API on iOS that curls paper.

## The fold is read from size classes

iOS has no API for the fold state; the iOS 27 UIKit headers have no posture, fold or hinge. What an unfolded Duo does have is a phone idiom with regular width *and* regular height, a combination no other iPhone produces. The rule is four conditions: phone idiom, regular in both axes, a PDF pane at least 560pt wide, and the reading tool. The idiom excludes iPad, the regular height excludes a landscape iPhone, the pane width excludes the half pane of a side-by-side split, and the tool excludes drawing. It is a pure function with ten unit tests.

## Drawing tools fall back to the scroll view

A highlight drag and a page-turn drag are the same one-finger pan; splitting them inside one view makes one of them always late. The range resolver, end handles, pen canvas and crop preview are also all bound to a coordinator that assumes a single `PDFView`, so the spread stays a read-only presentation. Switch to the highlighter and the scroll view returns; switch back and the spread reopens on the page you were on. Pinch zoom inside a page is off for the same reason.

Two alternatives lost: `PDFView.displayMode = .twoUp` with `displaysAsBook` gives two pages but a scrolling turn, and `usePageViewController` ignores `displayMode` entirely, so it never shows two pages.

## The simulator boots folded

The iPhone Duo simulator starts folded and can only be unfolded from a button in its window, so an unattended session cannot do it. With two screens, taking "the largest `XCUIScreen`" gave the inner screen, which is off while folded: every capture was black and the test still passed. The spread was captured on an iPad mini through a debug launch argument that skips the size-class check, the folded Duo was captured to confirm the scroll view is untouched, and whether a real unfolded Duo reports regular/regular is still something a person has to verify.

## What is left

Jumping from a map node lands on the right spread but without the flash the scroll view shows. Drawing directly on the spread would mean splitting the coordinator per page.
