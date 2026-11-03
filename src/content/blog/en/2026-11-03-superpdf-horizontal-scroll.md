---
title: "Scroll within a page, swipe to the next page's top — a horizontal scroll mode"
date: 2026-11-03T23:04:22+09:00
app: "superpdf"
tags: ["devlog", "uikit", "gesture"]
summary: "SuperPDF now has three reading modes. Horizontal scroll fits each page to the width, keeps vertical movement inside the page, and a sideways swipe lands on the top of the next page. PDFKit's single-page mode quietly reset the zoom on every page change, and that took most of the time."
---

SuperPDF now offers three ways to read: book turn, vertical scroll, and a new horizontal scroll. In horizontal scroll the page fills the screen width, so the text stays large, but scrolling up and down stays inside the current page. Swipe sideways and you get the next page, starting from its top.

## Large text without losing track of the page

Book turn fits the whole page on screen, which makes the text small on a landscape phone. Vertical scroll keeps the text large, but the pages run together, so it's easy to lose track of where one ends and the next begins. Horizontal scroll sits between the two.

| Gesture | Result |
|---|---|
| Drag up/down | Moves within the current page and stops at its edge |
| Swipe left / right | Next / previous page, from its top |
| Buttons, keyboard, go-to-page | Also land on the new page's top |

![On a landscape iPhone, scrolled to the bottom of page one: the next page doesn't follow on](/blog/superpdf-horizontal-scroll/page-bottom-stays.png)

The toolbar toggle is now a menu in the same spot, so the top row still fits nine buttons on a phone.

![The view mode menu: book turn, vertical scroll, horizontal scroll](/blog/superpdf-horizontal-scroll/view-mode-menu.png)

When a page is zoomed wider than the screen, a swipe first pans across the page and only turns it at the edge. While the pen tool is active, swiping is off because one finger draws, so the page buttons do the turning.

## Same view, different display mode

The new mode is the same PDFKit view as vertical scroll, switched to `.singlePage`, plus swipe recognizers. Underlining, selection handles, pen, crop and text boxes all come along unchanged. We passed on three alternatives:

- **PDFKit's built-in page view controller**: each page gets its own scroll view, and there's no guarantee a new page starts at its top.
- **Adding scroll to the book-turn view**: its pages are pre-rendered images, so they blur when zoomed.
- **Snapping vertical scroll to pages**: the next page still shows below the current one.

## Every page turn zoomed the page out

On a portrait phone everything looked fine, but the sample page was shorter than the screen, so there was nothing to scroll and nothing to test. In landscape the bug showed up: each swipe shrank the page to fit the whole screen.

To find out why, we logged a call stack on every `PDFViewScaleChanged` notification. Even with `autoScales` off, `go(to:)` in single-page mode resets the scale to auto-fit through `_goToPage → _reflectNewPageOn → _resizeDisplayView → _internalSetAutoScaleFactor`. It does this even when the target is the page already on screen. Our layout code fits the page to the width and then calls `go(to: currentPage)`, so it was undoing its own fit. Every code path that changes the page now saves the scale before the call and restores it afterwards. A landscape UI test checks that the "fit width" button doesn't appear after a page turn.

## What's left

We haven't tried it on iPad or the unfolded Duo yet. On wide screens a width-fitted page is often shorter than the screen, so the mode works more like swiping through one page at a time.
