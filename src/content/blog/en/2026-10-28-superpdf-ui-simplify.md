---
title: "Four modes, four tools, four review tabs became two places: Read and Collect"
date: 2026-10-29T00:22:21+09:00
app: "superpdf"
tags: ["devlog", "design", "swiftui"]
summary: "The app is about reading a PDF full-screen, marking it up, and coming back to just the marks, but the screen didn't follow that loop. The top bar is now Read and Collect, there are three tools, and review is one screen. Along the way we found a hang that froze the app when you opened a book on iPad."
---

SuperPDF does one thing well: you read a book full-screen a page or a spread at a time, mark it up, and later read only what you marked. The screen had four view modes on top, four tools at the bottom, and four tabs inside review. We removed those layers in seven steps.

## Two places on top

The toolbar used to say `PDF+Map | PDF | Map | Review`. Now it says **Read** and **Collect**.

![The Read | Collect segment in the toolbar](/blog/superpdf-ui-simplify/sections-toolbar.png)

- **Read** is the book. If you want the map beside it, turn on "Map beside" in the … menu. That option only appears on wide windows.
- **Collect** is what you marked. It started with four views (list, cards, flow, map); the same night it became the map alone (see the end).

![Collect: search, four views, colour chips](/blog/superpdf-ui-simplify/collect-list.png)

The map now lives inside Collect. New books open in Read without it. AI suggestion chips only appear while you edit the map. The "added" toast now points to Collect.

## Three tools, and the book stays put

The "Read" button is gone, because reading is what you do with no tool in hand. Underline, pen and crop are toggles; tap the active one again to put it down. Style and weight moved into an Options popover.

![Underline tool and its options](/blog/superpdf-ui-simplify/tool-options.png)

Picking the underline tool no longer swaps the page-turning view for a scroll view. Scrolling is a reading setting now, "Read by scrolling" in the … menu. Pen and crop still switch to scrolling, because their drags collide with page curl.

![Underlining on the page-turning view with the tool in hand](/blog/superpdf-ui-simplify/paged-underline.png)

## The hang

On iPad, opening a book with the map beside it froze the app on devices where the underline style had ever been changed. Here is the loop:

1. The parent rebuilt the workspace view, and a throwaway view model, on every toolbar change.
2. In an `@Observable` class, `didSet` also runs for assignments inside `init`. Restoring the saved style wrote the same value back to `UserDefaults`.
3. That write invalidated every `@AppStorage` in the domain.
4. The body and the toolbar ran again, which took the loop back to step 1.

The fix is to skip writes when the stored value is unchanged. A test now counts `UserDefaults` writes during that restore.

## 2026-10-29 — Collect is the map, and the map reads like prose

Four views did not last. The map was the one in use, and the flow view was the one that read well. So Collect is now just the map, and in reading mode its quote nodes follow the flow view's type: body size, tight spacing (3pt node padding, 2pt between lines, no minimum height — the first cut used the card padding and 5pt and looked too loose), a colour bar as tall as the paragraph, and the page number on the right where the document icon used to be. Edit mode keeps its cards untouched.

![Before: four view tabs on top, fit, colour-group and edit buttons below](/blog/superpdf-ui-simplify/collect-map-before.png)

![Now: the reading-mode map with paragraph-height colour bars and page numbers on the right](/blog/superpdf-ui-simplify/collect-map-reading.png)

The map's layout engine breaks lines itself with CoreText and sizes nodes as lines × line height, so the reading style went through the same path: a reading flag on the engine, padding and line spacing in the height, the measured page-label width taken out of the text column. A test renders the same strings in a `UIHostingController` and compares heights.

Colour grouping is gone (colours no longer carry meaning) and so is the fit button (double-tap and ⌘0 remain). Search stays in the nav bar, which already covers marks and body text.

One more fix came out of checking edit mode: tapping a node to select it jumped to the PDF and out of Collect. Edit-mode taps now only select. "Add to map", which only the list view had, moved to the PDF highlight toolbar.

## History

- 2026-10-28 — Read/Collect, three tools, one collect screen, underline on the page-turning view, the `UserDefaults` write loop.
- 2026-10-29 — Collect is the map; reading-mode nodes read like prose with page numbers; colour grouping and the fit button removed; edit taps only select.
- 2026-10-29 (later) — tighter reading-mode spacing.
