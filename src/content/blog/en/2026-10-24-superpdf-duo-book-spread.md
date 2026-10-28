---
title: "Unfold the iPhone and the PDF opens like a book"
date: 2026-10-28T15:06:29+09:00
app: "superpdf"
tags: ["devlog", "uikit", "gesture"]
summary: "On an unfolded iPhone Duo, SuperPDF lays two pages side by side and turns them with a page curl. Reading and underline tools keep it; pick the pen or crop and the vertical scroll comes back. The fold state is read from size classes, not the device name."
---

Open SuperPDF on an unfolded iPhone Duo and the PDF sits as a left page and a right page. Drag the right page and it curls over. Folded, and on every other device, pages turn one at a time the same way (see the second October 25 section). Two pages only when the pane is wider than tall; hold the unfolded Duo upright and one page fills it (see the second October 26 section).

## Two pages, hugging the spine

![Two-page spread in the PDF plus map split](/blog/superpdf-duo-book-spread/spread-split.png)

Even pages go left, odd pages right, each pushed toward the spine. Highlights, underlines and crops made in the scroll view draw on the spread as they are, and tapping one opens the same popover. The page counter reads "1–2 / 3" and the arrows move one spread at a time. With an odd page count the last right page is blank.

![The right page curling mid-turn](/blog/superpdf-duo-book-spread/page-curl.png)

The turn is `UIPageViewController` with `.pageCurl`, `spineLocation = .mid` and `isDoubleSided = true`; each page is its own view controller (first a `PDFView`, later a pre-rendered image — see "Fast swipes made the paper stutter" below). It is the only public API on iOS that curls paper.

## The fold is read from size classes

iOS has no API for the fold state; the iOS 27 UIKit headers have no posture, fold or hinge. What an unfolded Duo does have is a phone idiom with regular width *and* regular height, a combination no other iPhone produces. The rule is four conditions: phone idiom, regular in both axes, a PDF pane at least 560pt wide, and the reading tool. The idiom separates the Duo from other iPhones (iPad got its own spread rule on October 26), the regular height excludes a landscape iPhone, the pane width excludes the half pane of a side-by-side split, and the tool excludes drawing. It is a pure function with ten unit tests.

## Drawing tools fall back to the scroll view

A highlight drag and a page-turn drag are the same one-finger pan; splitting them inside one view makes one of them always late. The range resolver, end handles, pen canvas and crop preview are also all bound to a coordinator that assumes a single `PDFView`, so the spread stays a read-only presentation (since 2026-10-28 a long press then drag underlines here too — see below). Switch to the pen or crop and the scroll view returns; put it down and the spread reopens on the page you were on (since 2026-10-28 the underline tool keeps the spread, and scrolling is its own "Read by scrolling" setting). Pinch zoom inside a page is off for the same reason.

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

Still to verify: a dark-mode turn on a real unfolded Duo, and whether a landscape iPad in PDF-only mode should get two pages (it now does, October 26).

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

## 2026-10-25 — One tap hides every button

The next ask came with an Apple Books screenshot: page numbers under the spread and buttons at the side, then one tap on the book hides all of it so the PDF fills the screen, and another tap brings it back.

![Page numbers 1 and 2 under the spread, button rail on the right](/blog/superpdf-duo-book-spread/spread-buttons-shown.png)

The unfolded Duo now shows each page's number under it. Tap the middle of a page and the rail, the page numbers, the status bar and the home indicator go away together, and the spread grows into the safe area. Single-page reading drops its navigation bar and bottom toolbar the same way. Tap again and everything returns.

![The same screen after the tap: only the spread](/blog/superpdf-duo-book-spread/spread-buttons-hidden.png)

One tap now means three things. An edge tap is still the page curl's own turn, a tap on a highlight opens its popover, anything else toggles the buttons. A single recognizer on the spread container does the sorting, with `require(toFail:)` on the page controller's tap recognizers so a turn never also toggles. Buttons do not auto-hide on a timer (they would vanish while you look for one), the hidden state is not saved, and VoiceOver gets a "hide/show buttons" action instead of the tap. Hidden or not, the spread keeps the page aspect; cropping to fill the width would hide part of the page.

Reading buttons also switched from the blue accent to the label colour, so they stay quieter than the page.

## 2026-10-26 — The buttons left, the page stayed small

A reader on the folded Duo's outer screen sent a screenshot: after the tap the buttons and status bar were gone and the white sheet reached the screen edges, but the page inside it stayed a small shadowed card with margins all around.

Re-applying the fit scale on resize changed nothing, and landscape iPhone never reproduced it. A log on the folded Duo simulator did: the page `PDFView` kept its 375×531 frame, yet its fit scale dropped from 0.630 to 0.610 the moment the buttons hid. The only thing that moved was `safeAreaInsets` — bottom went from 0 to 17pt. With the buttons gone, the page reaches under the status bar and home indicator, and **`PDFView` fits its page inside its own safe area**. Tall book pages lose the most: height shrinks by both insets and the width follows the aspect.

The fix was a `PDFView` subclass whose `safeAreaInsets` is always zero (gone the same day, when pages became pre-rendered images). The SwiftUI pane already decides where the page goes, so the page view should not avoid the safe area a second time. Setting the inner scroll view's `contentInsetAdjustmentBehavior` to `.never` did not help; the scale reads the view's safe area directly. After the fix the scale holds at 0.630 hidden or not. The earlier check ran on a landscape iPad mini, where the page barely touches the safe area — this only shows on a tall page that overlaps it.

## 2026-10-26 — Fast swipes made the paper stutter

One turn at a time was fine; a run of quick swipes lagged and the curl hitched mid-way. Measured on a scan-sized A4 page, building and drawing one page controller took **about 100ms** on the main thread — six-plus frames — and the unfolded Duo builds two per turn.

Each page hosted a fresh `PDFView`, and `UIPageViewController` asks for the next page and draws it the instant a turn starts. Attaching the document, decoding the scan JPEG and rendering the first tiles all ran right there on main.

Pages are now pre-rendered images with the highlight overlay on top. A background queue draws them at screen pixel size from its own copy of the `PDFDocument` (PDFKit makes no thread-safety promise for the on-screen one). The visible page goes first, the next two turns and the previous one are drawn ahead, and stale prefetches are dropped when the direction changes. Main-thread cost per page: **0.3ms**. Pooling `PDFView`s lost because `go(to:)` and tiling still run on main. Tests compare the drawing with PDFKit's thumbnails at every rotation and with an offset crop box, and check highlight taps on a rotated page.

The cost: page text is no longer exposed to VoiceOver the way `PDFView` did, and if prefetch falls behind a page can flash white for a moment.

## 2026-10-26 — An upright pane gets one page

A screenshot from an unfolded Duo held upright: two pages side by side, a black band above and below, text the size of footnotes. The ask: one page filling the screen in portrait, two pages in landscape, and the same on iPad.

Book pages are about 0.7 wide-to-tall. In a 700×1000 pane two pages are bound by width, each 350×500, and half the height is empty. One page gets 700×1000, nearly twice the size. The old 560pt minimum only kept pages from getting too narrow; it never asked whether the pane was tall.

The rule is now **pane at least 560pt wide and wider than tall**, on an unfolded Duo or any iPad. iPad used to always show one page, which left a lone page in the middle of a landscape PDF-only screen. A landscape iPhone still gets one page.

It reads the **pane's shape, not the device orientation**. A portrait iPad split top and bottom gives the PDF an 834×525 pane, where two pages are as big as one and fill the width, so it spreads. A landscape iPad split side by side gives 597×800, so one page. Picking whichever layout makes the page bigger, given each document's page aspect, was more exact but would flip the layout between a slide deck and a book on the same screen.

Checked on an iPad simulator in PDF-only mode, portrait to landscape and back, with unit tests for Duo and iPad shapes. An upright real Duo is still to be tried.

## 2026-10-28 — Underline while paging, then read only what you underlined

You can now underline in the full-screen paged view: hold for 0.3 s, then drag. Move before that and the page turns as before; a quick tap still hides the buttons or opens a highlight. While you drag, the page controller's gestures are switched off. The colour, style and weight are whatever you last picked in the highlighter.

The real blocker was not the gesture but the range calculation — text selection, OCR line snapping for scans, region OCR before a page is scanned — which lived in a coordinator built around one `PDFView`. Paged pages are pre-rendered images now, so that logic moved into a view-independent type both screens call. The same drag leaves the same underline in either view.

Review also gets a **Flow** tab. Shrinking the gap in the existing list would not have done it: list rows carry page, colour and "add to map" lines and cut quotes at three lines, and the cropped-page strip scales each crop to the width, so the type size jumps from item to item.

![Flow tab — quotes run as paragraphs under the chapter title, colour as a thin margin bar, page number at the end of each paragraph](/blog/superpdf-duo-book-spread/reading-flow-tab.png)

Quotes become paragraphs under chapter headings, 14 pt apart, lines capped at 620 pt. Colour is a 3 pt bar in the margin and the page number trails the paragraph in small grey type. Crops and handwriting sit in place as images. Tap to jump to the PDF, long-press for the highlight menu; deleting and filtering stay in the list.

Still to check on hardware: underlining on an unfolded Duo spread, and OCR snapping on a scanned book in the paged view.

## History

- 2026-10-24 — Two-page spread with page curl on the unfolded Duo
- 2026-10-25 — Arrow turns froze in an AttributeGraph cycle; page swaps moved out of the update
- 2026-10-25 — Turns no longer curl the pane margin; the reading tool pages on every device; bars moved to a right rail
- 2026-10-25 — Floating top/bottom buttons on single pages; the right rail is Duo-only
- 2026-10-25 — Single-page buttons in the iOS bars; floating only when a bar overflows
- 2026-10-25 — Tap the page to hide or show every button; page numbers under the spread; reading buttons in the label colour
- 2026-10-26 — Hiding the buttons no longer leaves the page inset by the safe area
- 2026-10-26 — Two pages only when the pane is landscape; landscape iPad spreads too
- 2026-10-26 — Fast swipes no longer stutter: pages are drawn off the main thread ahead of time
- 2026-10-28 — Long-press underlining in the paged view; a Flow tab that reads underlines like a book
