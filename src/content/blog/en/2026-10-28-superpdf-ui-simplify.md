---
title: "Four modes, four tools, four review tabs became two places: Read and Collect"
date: 2026-11-03T09:50:57+09:00
app: "superpdf"
tags: ["devlog", "design", "swiftui"]
summary: "The app is about reading a PDF full-screen, marking it up, and coming back to just the marks, but the screen didn't follow that loop. The top bar is now Read and Collect, there are three tools, and review is one screen. Along the way we found a hang that froze the app when you opened a book on iPad."
---

SuperPDF does one thing well: you read a book full-screen a page or a spread at a time, mark it up, and later read only what you marked. The screen had four view modes on top, four tools at the bottom, and four tabs inside review. We removed those layers in seven steps.

## Two places on top

The toolbar used to say `PDF+Map | PDF | Map | Review`. Now it says **Read** and **Collect**.

![The Read | Collect segment in the toolbar](/blog/superpdf-ui-simplify/sections-toolbar.png)

- **Read** is the book. On wide windows the view menu in the toolbar shows the map with it (it started as "Map beside" in the … menu).
- **Collect** is what you marked. It started with four views (list, cards, flow, map); the same night it became the map alone (see the end).

![Collect: search, four views, colour chips](/blog/superpdf-ui-simplify/collect-list.png)

The map now lives inside Collect. New books open in Read without it. AI suggestion chips only appear while you edit the map. The "added" toast now points to Collect.

## Three tools, and the book stays put

The "Read" button is gone, because reading is what you do with no tool in hand. Underline, pen and crop became toggles; tap the active one again to put it down (since 2026-11-03 they live in one tool menu, see the last section). Style and weight moved into an Options popover.

![Underline tool and its options](/blog/superpdf-ui-simplify/tool-options.png)

Picking the underline tool no longer swaps the page-turning view for a scroll view. Scrolling is a reading setting now, a toolbar toggle. Pen and crop followed a day later (see the 2026-10-29 night section).

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

## 2026-10-29 (night) — Pen and crop stay on the page too

The next report was blunt: picking pen or crop still flipped the book into a scroll view, and that felt like a bug. Now only the "Read by scrolling" setting decides how the book is shown; no tool changes it.

- **Pen** draws on a PencilKit canvas laid over each page. The page-turning view shows pre-rendered page images, not PDF views, so the canvas code moved into one class that both views share.
- **Crop** is a straight drag on the page, with a dashed preview clipped to the page you started on.

![A pen stroke drawn on the page-turning view](/blog/superpdf-ui-simplify/paged-pen-stroke.png)

Dragging used to turn the page, and pen and crop both draw by dragging. So while either tool is in hand, drag-to-turn is off and you turn pages with the previous/next buttons. Pen also turns off edge taps, since a tap makes a dot.

![A crop drawn on the page, with the "added to Collect" toast; the page counter still reads 1/3](/blog/superpdf-ui-simplify/paged-crop.png)

We didn't go with pencil-draws/finger-turns because finger drawing is the default, and people without a Pencil couldn't draw at all. This time we listed everything the scroll view did for pen and crop before moving them, so nothing quietly went missing like the underline handles did the day before. Two-page spreads use the same code but haven't been checked on screen yet.

## 2026-10-30 — One toolbar; pick an underline with the select tool and edit it right there

Even after the two-place change, the top of the screen had three shapes: the reading toolbar, an edit toolbar that replaced it when you tapped an underline, and the system bar with a segmented control in Collect. Now there is one toolbar whenever a book is open.

- **Collect is a toggle** in that toolbar. The toolbar stays; only the button lights up.
- **Undo/redo is its own group** on the left of the second row, always there, Collect included — it isn't a setting of any tool.
- **A select tool** (the hand) sits first among the tools. Tap an underline with it and a one-row tooltip appears right next to it: style, weight, colour, delete, and a `…` menu for note, edit/copy text and the map.

![Collect keeps the same toolbar; only the Collect button is on](/blog/superpdf-ui-simplify/collect-same-toolbar.png)

![A one-row tooltip under the selected underline; the top toolbar stays](/blog/superpdf-ui-simplify/select-tooltip.png)

Tap-to-select in reading mode lost because tapping the page to hide the buttons would keep opening a tooltip whenever the tap landed on an underline. The old two-row edit toolbar lost as a tooltip because it covers too much text. The tooltip is placed by a SwiftUI `Layout` that asks the tooltip its size, rather than measuring and feeding the size back into state.

## 2026-10-30 (afternoon) — Pen drawings and crops are selectable too

Tapping a pen drawing or a crop with the select tool already opened the tooltip, but nothing showed what you had picked: only text highlights got the "selected" look. You were one tap away from Delete without seeing what would go.

Now all three follow the same grammar: tap, everything else dims, the tooltip sits right above what you picked. Underlines keep their end handles, since they have a text range to adjust. Pen drawings and crops get a dashed rounded frame instead, 6pt outside the region so it never sits on a crop's own 1pt outline.

![A selected crop wrapped in a dashed frame, with Delete and More above it](/blog/superpdf-ui-simplify/select-crop.png)

![A selected pen drawing in a dashed frame, with colour and Delete above it](/blog/superpdf-ui-simplify/select-ink.png)

Corner resize handles lost: there is no way to stretch ink or re-cut a crop yet, and a handle you can grab that does nothing is worse than none.

## 2026-11-02 — Rotating the device left the tooltip behind

With an underline selected, rotating the device moved the underline and its handles, but the tooltip stayed at the same screen coordinates, floating over an unrelated line.

The tooltip's anchor was a view-space rectangle captured at the moment of the tap, and it was only measured again when a handle was released. View coordinates are true for one layout. The handles live on the page overlay and move with it; a coordinate copied into state does not.

Now, whenever a page or the board changes place, the selected underline's rectangle is measured again from page coordinates, once, on the next run loop. Two neighbours got fixed with it: the scroll board now keeps the selected underline in view instead of jumping to the top of the page, and selecting on the right page of a spread makes that the current page, so rotating to one page still shows it.

Dropping the selection on rotation would have been the shortest fix, but it interrupts the edit. One gap remains: scrolling by finger in the scroll board still leaves the tooltip where it was.

## 2026-11-02 — A half view between the book and the map

On wide windows the single Collect button is now three: book, half, map. Any of them is one tap away.

![Side-by-side half view: book on the left, map on the right, the half button lit in the toolbar](/blog/superpdf-ui-simplify/half-side.png)

A wide window puts the book on the left and the map on the right. A tall window puts the book on top. The icon draws the current direction.

![Stacked half view: the book scrolls at full width on top, the map sits below](/blog/superpdf-ui-simplify/half-stacked.png)

Stacked, the book always scrolls. The top pane is short, so turned pages would shrink, while scrolling keeps the page at full width. Your reading setting is untouched: back in book view, pages turn again.

The split already existed, hidden behind a toggle at the end of the second row. The toolbar also sat on the PDF pane, so it jumped to the left half when the split opened, and the button you had just pressed moved out from under your finger. The toolbar now belongs to the window.

We passed on one button cycling through the three states: getting from half back to book would mean going through the map. iPhone keeps the single button, because the toolbar would cover nearly half of a stacked top pane.

## 2026-11-03 — The half view wasn't half

The divider sat left of the screen's center.

The ratio was applied to the size `GeometryReader` reports, which is the size inside the safe area. With a status column on the right, half of that width is not the middle of the screen. The book draws to the screen edge, so it looks like the screen is being divided while the math divides something narrower. iPad's symmetric safe areas hid this.

The ratio now uses the full screen length, dragging divides by the same length, and the toolbar sits on the same axis. On a simulator with a temporary 60pt right inset, the divider's offset from center went from -30pt to 0. It hasn't been checked yet on a device with the real status column.

## 2026-11-03 — Fixing the formula didn't fix the split

The same day came another report: still not centered. This time we measured the capture first. On a 951pt screen the book took 451pt, the divider 8pt and the map 492pt, which put the divider 20.5pt left of center.

The map reached the screen edge, so safe areas weren't the cause. A ratio of 0.5 would give the book 472pt, and 451pt works out to about 0.478. The formula was right and the stored value wasn't. That number comes from the measurements; we couldn't read it off the device.

A fresh simulator install only ever holds the default, so the earlier check had shown zero error. The divider saves any drag, even a brush, and nothing could undo it. The half button did nothing if the half view was already on.

Now the half button always returns to the exact center, and a dragged divider snaps there within 3%, with one haptic. The stored ratio also moved to new keys, because the number changed meaning and an old value would have read as the new one. Dragged ratios reset once on update. Removing dragging would have cost a wider map, and resetting on every open would have lost a width you chose.

UI tests now measure the real divider against the window. They pass on an iPad simulator; a check on an unfolded Duo is still open.

## 2026-11-03 — Nine buttons, and one tool button

The tools took four slots while text and photo insertion hid in the second row, and page tone, scrolling and settings sat inside the `…` menu. The top row is now, in order: back, PDF list, tool, underlines only, page-turn/scroll toggle, view, page tone, export, settings.

![The nine-button top row, with undo, search and page controls below](/blog/superpdf-ui-simplify/toolbar-nine.png)

The tool button opens one menu: finger, underline, pen, crop, text, image. The view button opens book, book and map, or map. The `…` menu is gone.

![The tool menu with finger checked](/blog/superpdf-ui-simplify/tool-menu.png)

The real change is the finger. Reading with no tool and the select tool used to be separate states. A menu always has something picked, so keeping both would have left a seventh state the menu couldn't show. They are one default state now: tap an underline while reading and its tooltip opens. We rejected exactly that four days ago, and the cost is still real, since tapping an underline no longer hides the buttons. But switching tools now takes two taps, which made leaving the reading state to fix an underline the worse trade.

Search wasn't on the list. Deleting it would lose a feature and a tenth button overflows an iPhone, so it moved next to undo in the second row. The underline tool needs that width, so the button steps aside there, and the search popover hangs off the group so ⌘F keeps working.

On the page-turning view, zooming and selecting now exclude each other, because both want the same finger on page coordinates. Verified on simulators at iPhone width on both boards; inserting a photo end to end and an unfolded Duo are still open.

## History

- 2026-10-28 — Read/Collect, three tools, one collect screen, underline on the page-turning view, the `UserDefaults` write loop.
- 2026-10-29 — Collect is the map; reading-mode nodes read like prose with page numbers; colour grouping and the fit button removed; edit taps only select.
- 2026-10-29 (later) — tighter reading-mode spacing.
- 2026-10-29 (night) — pen and crop stay on the page-turning view; drag-to-turn is off while drawing.
- 2026-10-30 — one toolbar: Collect toggle, separate undo group, select tool with a tooltip beside the underline.
- 2026-10-30 (afternoon) — select tool picks pen drawings and crops too, with a dashed frame.
- 2026-11-02 — The tooltip anchor is measured again from page coordinates whenever the board is re-laid out
- 2026-11-02 — book, half and map buttons on wide windows; stacked half always scrolls; toolbar pinned to the window.
- 2026-11-03 — the half view ratio uses the full screen, so the divider and toolbar sit at the exact center.
- 2026-11-03 — half button recenters, the divider snaps to center, and the ratio moved to new keys.
- 2026-11-03 — nine-button top row: one tool menu, reading and select merged into the finger, view menu, no more `…` menu.
