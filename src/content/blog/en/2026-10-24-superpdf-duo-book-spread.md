---
title: "Unfold the iPhone and the PDF opens like a book"
date: 2026-10-25T23:11:10+09:00
app: "superpdf"
tags: ["devlog", "uikit", "gesture"]
summary: "On an unfolded iPhone Duo, SuperPDF lays two pages side by side and turns them with a page curl. Reading tool only; pick the highlighter and the vertical scroll comes back. The fold state is read from size classes, not the device name."
---

Open SuperPDF on an unfolded iPhone Duo and the PDF sits as a left page and a right page. Drag the right page and it curls over. Folded, and on every other device, pages turn one at a time the same way (see the second October 25 section). The unfolded screen is 669pt wide, too wide for one page at a readable size, and two pages bring it close to a paperback's column width.

## Two pages, hugging the spine

![Two-page spread in the PDF plus map split](/blog/superpdf-duo-book-spread/spread-split.png)

Even pages go left, odd pages right, each pushed toward the spine. Highlights, underlines and crops made in the scroll view draw on the spread as they are, and tapping one opens the same popover. The page counter reads "1–2 / 3" and the arrows move one spread at a time. With an odd page count the last right page is blank.

![The right page curling mid-turn](/blog/superpdf-duo-book-spread/page-curl.png)

The turn is `UIPageViewController` with `.pageCurl`, `spineLocation = .mid` and `isDoubleSided = true`; each page is a view controller hosting a `PDFView` in `.singlePage` mode. It is the only public API on iOS that curls paper.

## The fold is read from size classes

iOS has no API for the fold state; the iOS 27 UIKit headers have no posture, fold or hinge. What an unfolded Duo does have is a phone idiom with regular width *and* regular height, a combination no other iPhone produces. The rule is four conditions: phone idiom, regular in both axes, a PDF pane at least 560pt wide, and the reading tool. The idiom excludes iPad (which turns one page at a time), the regular height excludes a landscape iPhone, the pane width excludes the half pane of a side-by-side split, and the tool excludes drawing. It is a pure function with ten unit tests.

## Drawing tools fall back to the scroll view

A highlight drag and a page-turn drag are the same one-finger pan; splitting them inside one view makes one of them always late. The range resolver, end handles, pen canvas and crop preview are also all bound to a coordinator that assumes a single `PDFView`, so the spread stays a read-only presentation. Switch to the highlighter and the scroll view returns; switch back and the spread reopens on the page you were on. Pinch zoom inside a page is off for the same reason.

Two alternatives lost: `PDFView.displayMode = .twoUp` with `displaysAsBook` gives two pages but a scrolling turn, and `usePageViewController` ignores `displayMode` entirely, so it never shows two pages.

## The simulator boots folded

The iPhone Duo simulator starts folded and can only be unfolded from a button in its window, so an unattended session cannot do it. With two screens, taking "the largest `XCUIScreen`" gave the inner screen, which is off while folded: every capture was black and the test still passed. The spread was captured on an iPad mini through a debug launch argument that skips the size-class check, the folded Duo was captured to confirm the scroll view is untouched, and whether a real unfolded Duo reports regular/regular is still something a person has to verify.

## What is left

Jumping from a map node lands on the right spread but without the flash the scroll view shows. Drawing directly on the spread would mean splitting the coordinator per page.

## 2026-10-25 — Turning a spread froze the app for good

The first TestFlight build with the spread drew a report: open a large scanned book and the app freezes, never to recover. Size looked guilty, so we built a 400-page image PDF with a full OCR cache and 300 highlights. The vertical scroll view opened it in two to five seconds on the simulator, which we read as fine. It was not: that was a second, separate freeze, fixed the next day (the whole OCR cache was decoded on open). Forcing the spread on with the same data froze it on the first arrow tap.

Sampling the stuck main thread gave one stack in every sample. SwiftUI was mid-update, called `updateUIViewController`, and we called `setViewControllers` there. The new page's `PDFView` became first responder as it joined the window, and the hosting view went to read the responder from the very graph it was updating. AttributeGraph treats that as a cycle and never leaves it. The first layout was fine only because the controller was not in a window yet, which is why it froze on the first turn, not on open.

The fix: once in a window, remember the target spread and set it on the next run loop, last target wins. Next, next, back now goes 3–4, 5–6, 3–4 of 400 with no stall. Our earlier check only captured the first screen and a finger swipe, and a swipe is UIKit turning the page itself; it never went through a SwiftUI update. Representables are now tested through a second update after they are on screen.

## 2026-10-25 — The curl took the black margin with it, and the bars shrank the book

Two notes from reading on an unfolded Duo in dark mode: turning a page curled the black pane margin along with the paper, and the top and bottom bars ate the height the book needed. A third followed: make a single page fill the screen too.

**Why the margin curled.** `.pageCurl` curls the child view controller's whole view. With the spread spanning the pane, each page controller got half of it, the PDF page fit narrower inside, and the leftover was the page view's background: black in dark mode, light grey in light mode, which is why the first check missed it. The spread now sits in a container sized to the page aspect times the number of pages, so the margin stays outside the turn. The aspect is the median of fifteen sampled pages, since scanned covers rarely match the body, and any small leftover is painted paper white.

**One rail on the right** (now only on the unfolded Duo — see the last section). In the reading tool the navigation bar is hidden, and back, file list, view mode, search, export, tool picker, dim, previous/next and the page counter, plus OCR progress, stack in a single column on the right. The book gets the full height. Floating the rail over the page lost: on a pane that fills by width, it covers the edge of the right page. Pick a drawing tool and the scroll view and its bars come back.

**Single pages too.** The reading tool now pages on every device: two pages where the spread fits, otherwise one page fitted to the pane with the spine on the left. The same view handles both by spine location, and is rebuilt when it switches because a page view controller's spine is fixed at creation. Vertical scrolling is now for drawing only.

Still to verify: a dark-mode turn on a real unfolded Duo, and whether a landscape iPad in PDF-only mode should get two pages instead of one.

## 2026-10-25 — Floating buttons on a single page, the rail only on the Duo

The rail lasted one round of feedback. On a phone, the ask was: keep the buttons at the top and bottom, floating, and move them to the right only on an unfolded Duo.

![iPhone portrait with floating button groups above and below the page](/blog/superpdf-duo-book-spread/single-page-floating.png)

(This changed a few hours later; see the last section.) When one page fills the pane (iPhone, iPad, folded Duo), four translucent capsules float over it: back and file list top left, view mode, search and export top right, tool and dim bottom left, previous, page counter and next bottom right. They sit where the old bars were, in the same order.

![The two-page spread with the vertical rail on the right](/blog/superpdf-duo-book-spread/spread-right-rail.png)

The two-page spread keeps the right rail. Why the split: a portrait iPhone pane is about 0.46 wide-to-tall and a PDF page about 0.7, so a width-fitted page leaves margin above and below, which is where the capsules land. The rail instead took 60pt of width on every phone, and on a narrow screen width is text size. The unfolded Duo fills by height, so its spare room is on the right. Both layouts share one set of buttons, and only one is on screen at a time, so the search popover and share sheet never attach twice.

## 2026-10-25 — System bars first, floating only when they overflow

The next ask set an order: put the buttons in the iOS top and bottom bars, and float them only when there are too many to fit.

![iPhone portrait with reading buttons in the navigation bar and bottom toolbar](/blog/superpdf-duo-book-spread/single-page-system-bars.png)

Single-page reading now uses the real navigation bar and bottom toolbar. With iOS 26 glass they look almost like the capsules did, but the title is back, back is the system button, and keyboard focus and VoiceOver order match the rest of the app.

System bars do not report overflow, so the fit is decided up front from the window width: 44pt per button, 48pt of bar chrome, 84pt for the page counter and 84pt for OCR progress. The top bar needs 268pt, the bottom 308pt (392pt during OCR). A regular iPhone fits both; a 320pt Slide Over window running OCR moves only the bottom bar to floating capsules. A whole bar moves at once, never single buttons, so nothing ends up split between bar and air. The unfolded Duo keeps its right rail.

## History

- 2026-10-24 — Two-page spread with page curl on the unfolded Duo
- 2026-10-25 — Arrow turns froze in an AttributeGraph cycle; page swaps moved out of the update
- 2026-10-25 — Turns no longer curl the pane margin; the reading tool pages on every device; bars moved to a right rail
- 2026-10-25 — Floating top/bottom buttons on single pages; the right rail is Duo-only
- 2026-10-25 — Single-page buttons in the iOS bars; floating only when a bar overflows
