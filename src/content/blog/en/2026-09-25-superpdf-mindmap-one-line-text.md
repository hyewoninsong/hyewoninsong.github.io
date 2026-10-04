---
title: "Mind map titles went to one line — and every title got cut off"
date: 2026-09-26T01:30:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "Node titles used to wrap across two or three lines. Now they stay on one line, growing the node up to 480pt before truncating. The first build shipped truncated every title at around ten characters — wrapping had been hiding a width-math bug that one line finally exposed. The same evening the one-line rule was reversed: nodes are now one screen-wide column and titles wrap inside it."
---

Every underline you draw in SuperPDF becomes a mind map node. Titles used to wrap across two or three lines inside a 200pt-wide card. That was fine for short quotes, but a full sentence turned a node into a three-line card that ate the screen fast. A request to show titles on one line, long, sent me into a small width-math bug that had been invisible until now.

## One line, but how wide is too wide

Dropping the wrap isn't a one-line change. While wrapping was on, text past the node's width cap just fell to the next line. Remove the wrap, and there's nowhere for overflow text to go — the node either keeps growing, or something gets cut.

Two options: let the node grow as wide as the text needs, or cap it generously (480pt) and truncate anything past that with an ellipsis. Unbounded growth is the more literal read of "show it on one line," but a highlighted quote can be long, and an unbounded node would stretch the canvas sideways until the map itself became hard to navigate. I went with the 480pt cap — most titles fit comfortably under it, and only the unusually long ones get truncated. (Reversed the same evening; see below.)

Same pass, I also cut the vertical spacing between sibling and parent/child nodes from 12pt to 6pt. The map lays out top-to-bottom like an outline, and tighter spacing makes it read more like a page of compact notes.

![Mind map after the fix — every node title renders fully on one line](/blog/superpdf-mindmap-one-line-text/node-titles-one-line.png)

## What wrapping had been hiding

Node width isn't measured live against the screen — it's precomputed from the text plus a fixed "chrome" allowance for the icon, badges, and padding, then locked in with a fixed frame. That chrome estimate had two small, real errors: the leading type icon had no explicit width, so different SF Symbols rendered slightly wider than the assumed 14pt, and the spacing gap between the title and the trailing spacer was missing from the formula entirely.

While titles wrapped, neither error mattered — a few missing points just pushed the last word to a second line, which looked completely ordinary. The moment wrapping went away, that same shortfall had nowhere to hide, and text was cut by exactly the amount the formula was short. A seven-character title like "다시 읽을 때" ("when reading again") truncated down to two characters.

Unit tests never caught it. The width tests compared computed values against each other — "a chapter node is wider than a plain one," "a chevron adds width" — all derived from the same flawed formula, so they agreed with each other perfectly while none of them checked the formula against a real render. Only a screenshot caught the truncation, and by then the previous build had already gone out on TestFlight.

Two fixes: pin the icon's width with an explicit frame so the assumed and rendered widths match, and add the missing spacing term to the formula. I also gave the title text explicit layout priority over the trailing spacer — when width is tight, better not to leave it to SwiftUI's default.

## Where it stands

The rule I'm taking from this: removing a line-limit (wrap → single line) is not done until it's been checked against a real screenshot. Wrapping's slack can hide a width-math error for a long time, and the moment that slack disappears, the error shows up in full. Unit tests that only compare computed values to each other won't catch this class of bug — at some point the computed width has to be checked against what actually got rendered.

## 2026-09-25, evening — One line is out; a node is one screen-wide column

The afternoon's "one line, 480pt cap" lasted a few hours. An underline in a real book is usually a whole sentence, and past 480pt the part behind the ellipsis is invisible until you tap through to the PDF. For someone re-reading the map, that is a node that might as well not be there. So it went the other way: **a node is as wide as the screen**, and the title wraps inside it.

![Nodes fill the screen width, a long quote wraps to three lines, and the pill at the top reads depth 1/3](/blog/superpdf-mindmap-one-line-text/column-depth1.png)

### One node, one column

*(Changed the next day — since 2026-09-26 node width shrinks 28pt per depth, the map no longer overflows sideways, and the column snapping and depth pill below are gone. See the last section.)*

Every node was the pane width minus 16pt gutters, whatever its depth or kind. Children still sat on the row below, indented 28pt, so depth 1 overflowed the right edge by 28pt and depth 2 by 56pt. That overflow was the horizontal scroll. On release the canvas snaps to the **left edge of the nearest depth**: snapped to depth 2, its nodes fill the screen and the parents are tucked 28pt off the left.

| Action | Result |
|---|---|
| Drag or fling sideways | Springs to the nearest depth column on release |
| Tap a node | Snaps to that node's depth, so a child that was clipped on the right shows whole |
| Tap a dot in the pill | Goes to that depth |
| Zoom out until the map fits | No snapping; centred as before |
| Zoom in past one column | No snapping; free pan |

The pill at the top of the pane shows which depth you are on: one dot per depth, a larger dot for the current one, and "2/3" beside it. It follows the finger mid-drag and disappears when there is only one depth or nothing to snap to.

![After a drag to the left the canvas sits at 3/3, the grandchild aligned to the gutter, parents clipped on the left](/blog/superpdf-mindmap-one-line-text/column-depth3.png)

### Why this shape

Page-style paging, one column per swipe, lost because columns are 28pt apart — too fine to page. Snapping while zoomed in lost because a column wider than the pane cannot be read when aligned. Edge-to-edge nodes lost because rounded corners and borders clip at the pane edge; the 16pt gutter became the snap position. A text-only "depth 2" label lost because it does not show how many depths there are. The edit field stays single-line: a multi-line field turns Return into a newline.

### The engine breaks the lines, not the view

The afternoon's lesson — a computed size that disagrees with the rendered one clips — is now built in. Node height is still precomputed, so if the engine measured two lines and SwiftUI wrapped three, the bottom would clip. The engine therefore breaks lines itself with CoreText (`CTTypesetterSuggestLineBreak`) and the view renders exactly those lines.

It still slipped once. Joining the lines with `"\n"` into a single `Text` let SwiftUI re-wrap an 11-character Korean line at width 120: its glyph advances round to screen pixels differently from CoreText's, and the error grows with the character count, so neither a 2pt slack nor a 3% slack held. Bigger constants only move the edge, so the approach changed: **one `Text` per line**, `lineLimit(1)`, stacked vertically. Height is fixed at lines × line height, and a line that disagrees on width shrinks by up to `minimumScaleFactor(0.9)` instead of clipping. SwiftUI also rounds each line's height to the pixel (17.9 → 18), so the precomputed height rounds per line too; that was the 1pt short at 15 lines.

This time a unit test caught it, because the test does what the afternoon said it should: it hosts the real title view in a `UIHostingController` and compares the rendered height with the engine's — long Korean without spaces, multi-word Korean, Latin words, embedded newlines, three fonts, three widths.

### Where it stands

Checked on the iPhone simulator: a three-line quote unclipped, a short drag snapping to 3/3, a fling back to 1/3. Not yet checked: how a 160pt-wide column reads in the narrow map pane next to a PDF on iPad.

## 2026-09-26 — Snapping is out; the map reads like notes

After a day of use the request was simple: most of the time the map should read like a page of notes, and only look like nodes while editing. You reopen the map to re-read your underlines, and every sentence was in a bordered card with connectors, children clipped off the right edge behind a horizontal scroll. Cards help when you edit. They get in the way when you read.

**The map now opens in reading mode.** No cards, no L-shaped connectors, no grey map panel, no `+` handle. Each sentence gets a thin colour bar in its node colour, its indent, and the PDF badge at the end; tapping still jumps to the page. An "Edit" button in the floating toolbar brings the cards, connectors, `+` and drag back and turns into "Done". Double-tapping a title to edit it, or creating the first node on an empty map, switches to edit mode without asking.

![Reading mode: sentences stacked with indents and yellow, green and blue colour bars, no cards or connectors.](/blog/superpdf-mindmap-one-line-text/reading-mode.png)

![The same map in edit mode: coloured cards, L-shaped connectors, and + and Done buttons at the bottom.](/blog/superpdf-mindmap-one-line-text/edit-mode.png)

### Width shrinks with depth so nothing leaves the screen

Put the two screenshots side by side and not a single glyph moves. That is the point: both modes share one layout; only background, border, shadow and connectors toggle. The layout engine does not know which mode it is in.

That meant giving up yesterday's "every node is the same width", where children stuck out 28pt per depth and snapping managed the overflow. Notes cannot run off the page, so **node width = column width − depth × 28pt**. Every node ends at the same right edge, the map never overflows horizontally, and column snapping, one-column swipes and the depth pill all became pointless and were removed. The canvas rule "horizontal only when there is overflow" stays, so at 1× the map only scrolls vertically; zoomed in it pans freely.

Shrinking width per depth needs a floor, so there is now a **depth cap**. It started at three levels under the root (chapter → highlight → note). One regression test caught the flaw: PDFs with a table of contents get two chapter levels ("1 → 1.2"), so highlight nodes already sit at depth 3 and could not take a note. The cap is four. The narrowest node is the column minus 112pt — 258pt on an iPhone, still a readable line. The cap applies at input only: no `+` on depth-4 nodes, and a drag counts the height of the subtree it carries, refusing to offer a drop that would go deeper (no indicator, release returns it). Undo is never blocked. Nodes stored deeper than that from before the cap are pulled up once when the project opens, as siblings right after their depth-4 ancestor, in reading order.

### What lost

Separate layouts per mode (reading with shrunk widths, editing with yesterday's columns and snapping) lost because the toggle would jolt every node and two layouts would need maintaining. Keeping deep nodes and merely clamping their indent lost because "visible depth = real depth" would break and the drag rules would stop making sense; flattening won. Keeping type icons in reading mode lost because an icon per line reads as a list, not notes — colour stayed, because colour-coded underlines are how this app is used. Long-press as the only way into edit mode lost on discoverability; the toolbar toggle is the default, double-tap and the menu are shortcuts.

Quote text also moved from 12pt to 15pt and chapter titles to 17pt bold. 12pt fit a label inside a card; it was too small for a sentence you re-read.

### Where it stands

Reading mode is a **presentation state, not a data lock** — the first version locked structure and thirty existing view-model tests failed at once, so the lock stayed with colour grouping only and reading mode just hides the drag gesture and the `+` handle. How narrow a depth-4 node gets in the slim map pane next to a PDF on iPad is not yet checked on a device.

## History

- 2026-09-25 (afternoon) — one-line titles, 480pt cap, 6pt spacing, the truncation incident
- 2026-09-25 (evening) — one screen-wide column per node, engine line breaking with one Text per line, depth snapping and indicator
- 2026-09-26 — reading mode by default, cards only behind an Edit toggle; width shrinks per depth so snapping and the pill are gone; depth cap of four and one-time flattening on load
