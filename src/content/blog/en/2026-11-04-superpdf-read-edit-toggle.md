---
title: "Swiping to turn the page drew a line instead — so reading and editing became two modes"
date: 2026-11-04T15:50:00+09:00
app: "superpdf"
tags: ["devlog", "gesture", "design"]
summary: "With the pen or crop tool in hand, a sideways swipe drew a stroke instead of turning the page. Rather than guess intent from the gesture, a single button in the bottom-right corner now switches between reading and editing — and editing brings back the last tool you used."
---

With the pen or crop tool selected, swiping to the next page drew a horizontal line or started a crop box.
Now a book opens in **reading** mode, and the pencil in the bottom-right corner switches to **editing**. In reading, a swipe always
turns the page. In editing, a drag always draws.

## One button for reading, a tool row for editing

Reading has no tool row — it did not at first; the same afternoon a four-button reading row took that spot (see the afternoon section below). A pencil sits in the corner. Swipe to turn; tap an underline to get its tooltip for color or delete.

![Reading — no tool row, only the pencil button in the corner](/blog/superpdf-read-edit-toggle/reading-pencil.png)

Tap the pencil and the tool row slides up, while the pencil turns into a V in the same spot. Tap the V to fold the row away.

![Editing — undo, six tools, and the V where the pencil was. The pen is selected](/blog/superpdf-read-edit-toggle/editing-tool-row.png)

Editing starts with **the tool you last picked**. Write with the pen, fold, turn a few pages, tap the pencil — you are holding the pen again.
It survives relaunch. The first time, it is the underline tool.

On a narrow iPhone screen the row sits directly left of the V, so the V never moves away from where your thumb found the pencil.

## Why not read the gesture

A fast, straight sideways swipe looks exactly like an underline drawn with the pen. And PencilKit starts inking the moment a finger lands,
so deciding afterwards that it was a page turn means erasing a stroke that is already on screen — a flicker even when the guess is right.

- **Pencil draws, finger turns** is the notes-app default, but many people here write with a finger, and an iPhone has no Pencil.
- **Two-finger turn while editing** was offered too, and left out for now. To turn, fold with the V. One rule, nothing to mix up.

With a mode, the app never has to guess. You tell it first.

## The cost

If you mark and turn on every page, a turn now takes a few extra taps. Remembering the last tool removes the re-pick.
If it still feels heavy, two-finger turning is the next step. The folded foldable screen is checked below; unfolded and iPad are not yet.

## 2026-11-04, afternoon — reading got its own bottom row

While editing has the tool row, reading had an empty bottom. The things you touch while reading — read aloud, underlines-only view, view mode (page turn, vertical or horizontal scroll) and page tone (original, sepia, night) — sat in the navigation bar, three of them behind `…` on a portrait iPhone.

Now, with the edit toggle off, those four stand where the tool row would be. No undo; there is nothing to undo while reading.

![Reading — read aloud, underlines only, view mode and page tone in the bottom row, pencil at the bottom right](/blog/superpdf-read-edit-toggle/reading-row.png)

Underlines-only is a toggle. The other three drill down the way a tool drills into its settings: the row becomes `<` plus a second row.

| Button | Tap |
|---|---|
| Read aloud | starts reading at once: `<` · pause · speed and voice · stop |
| Underlines only | on / off, row unchanged |
| View mode | `<` · page turn · vertical scroll · horizontal scroll |
| Page tone | `<` · original · sepia · night, each a paper-coloured dot |

![Page tone row — sepia selected, the page already sepia](/blog/superpdf-read-edit-toggle/tone-row.png)

`<` keeps reading aloud; the button stays lit, and tapping it again reopens the controls. Stopping, or reaching the end of the book, returns to the four. Picks stay in the second row — people flip between sepia and night — and that matches how the tool row behaves.

## The foldable's vertical bar only takes icons

The earlier toolbar work claimed that anything left in the system navigation bar would move to the right-hand vertical bar on the foldable iPhone. Nobody had a Duo simulator, so nobody checked. This time there was one, and the claim was half true.

![Folded Duo — only back and the two menus made it into the vertical bar; the rest stayed in a floating horizontal bar on top](/blog/superpdf-read-edit-toggle/duo-before.png)

Three captures narrowed it down:

1. Every button that stayed on top used `.buttonStyle(.plain)`. SwiftUI hosts a plain-styled button as a custom-view bar item, and the vertical bar does not take custom views. Dropping the plain style inside the system bar moved six of them.
2. The page number "1 / 3" still stayed — with a bare `Text`, without the accessibility actions, without any font or padding.
3. Swapping its label for an icon moved it. The vertical bar cannot stand text up; it only takes icon items.

The page number has to be text. Instead of sniffing the device, the app reads the system's own answer — `UITraitCollection.verticalBarEdge` on iOS 27.1 — and only then turns the bar item into a `#` (tap to jump) and floats "1 / 3" as a small pill above the bottom row.

![Folded Duo — back, list, #, contents, bookmark, view, search and … in the vertical bar; a 1 / 3 pill above the reading row](/blog/superpdf-read-edit-toggle/duo-after.png)

The capture checklist already said that text buttons and custom button styles do not move. The design session never opened it. Any change to the top bar now ships with a folded-Duo capture — the folded cover is enough to see the vertical bar.

## History

- 2026-11-04 — reading and editing split, bottom-right toggle, last tool remembered
- 2026-11-04, afternoon — reading row (read aloud, underlines only, view mode, page tone) with drill-down; foldable vertical bar takes icon items only
