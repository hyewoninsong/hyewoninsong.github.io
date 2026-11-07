---
title: "Swiping to turn the page drew a line instead — so reading and editing became two modes"
date: 2026-11-08T02:40:54+09:00
app: "superpdf"
tags: ["devlog", "gesture", "design"]
summary: "With the pen or crop tool in hand, a sideways swipe drew a stroke instead of turning the page. Rather than guess intent from the gesture, a single button in the bottom-right corner now switches between reading and editing — and editing brings back the last tool you used."
---

With the pen or crop tool selected, swiping to the next page drew a horizontal line or started a crop box.
Now a book opens in **reading** mode, and the pencil (first floating in the bottom-right corner, since November 8 the last item of the right-hand bar — see that section) switches to **editing**. In reading, a swipe always
turns the page. In editing, a drag always draws.

## One button for reading, a tool row for editing

Reading has no tool row — it did not at first; the same afternoon a four-button reading row took that spot (see the afternoon section below), and on November 8 that row went away again and its four functions moved into popovers on the right-hand bar (see the 2026-11-08 section). Today reading has no bottom row. A pencil sits in the corner. Swipe to turn; tap an underline to get its tooltip for color or delete.

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
(This row was removed on November 8 — see below. The "second row" in this and the next two sections describes the shape until then.)

![Reading — read aloud, underlines only, view mode and page tone in the bottom row, pencil at the bottom right](/blog/superpdf-read-edit-toggle/reading-row.png)

Underlines-only is a toggle. The other three drill down the way a tool drills into its settings: the row becomes a second row, led by the icon you tapped (it was a `<` at first — see 2026-11-05 below).

| Button | Tap |
|---|---|
| Read aloud | starts reading at once: speaker · pause · speed and voice · stop |
| Underlines only | on / off, row unchanged |
| View mode | current mode icon · page turn · vertical scroll · horizontal scroll |
| Page tone | tone icon · original · sepia · night, each a paper-coloured dot |

![Page tone row — sepia selected, the page already sepia](/blog/superpdf-read-edit-toggle/tone-row.png)

Going back up keeps reading aloud; the button stays lit, and tapping it again reopens the controls. Stopping, or reaching the end of the book, returns to the four. Picks stay in the second row — people flip between sepia and night — and that matches how the tool row behaves.

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

## 2026-11-05 — the second row starts with its parent's icon, not `<`

Picking the underline tool turns the tool row into style · weight · colour; picking the pen turns it into pen · colour. Both started with a `<`, and the colour buttons look the same, so the row alone did not tell you whose colour you were changing.

Now the leftmost button is the icon of the item you came from, shown lit: the underline icon in its current style with a colour bar, or the pen. Tapping it goes back up, and the tool stays on — the same icon that took you down takes you up.

![Underline settings row — the lit underline icon with a yellow bar on the left, then style and colour](/blog/superpdf-read-edit-toggle/underline-row-parent-icon.png)

![Pen settings row — the lit pen icon on the left, then pen type and colour](/blog/superpdf-read-edit-toggle/pen-row-parent-icon.png)

The reading row does the same: speaker, current view mode, or the half-filled tone circle. Keeping `<` and adding the icon beside it would overflow the portrait iPhone row; a text label above would make the toolbar two rows tall. The icon fits the old 40pt slot, so nothing else moves.

## 2026-11-06 — empty glass buttons flashed at the bottom when reopening a book

On the folded iPhone, going back and reopening a book briefly showed an empty glass circle and capsule at the bottom while the screen slid in. The vertical bar held only the back button, and the reading row was pushed up.

![Right after reopening — the reading row is pushed up, with an empty glass circle and capsule below it](/blog/superpdf-read-edit-toggle/reopen-before.png)

The cause was the few frames before the PDF finished opening. Until then the screen used the older toolbar, which has a text segmented control (Read | Collect). The vertical bar can't take text items, so the system put up a horizontal bottom bar for those frames, before any of its items had drawn. Now a book with a PDF gets the reading toolbar while it's still loading.

![The same moment after the fix — buttons sit in the vertical bar from the first frame, no bottom bar](/blog/superpdf-read-edit-toggle/reopen-after.png)

Two things slowed this down. The report came through the book cover, which never reproduced in the simulator; "go back and reopen" did on the first capture. And empty glass has no identity: I blamed the leading items, the trailing items, then the shelf's search field, and was wrong three times. Removing one candidate at a time and recapturing the same first frame was the only reliable test. The rule: when you swap toolbar item sets by state, every branch has to fit the vertical bar, even one that lives for a few frames.

## 2026-11-08 — the bottom row is gone; everything lives in the right-hand bar

Four days later the reading row came out. The trigger was a screenshot of another PDF app on a folding iPhone: a house at the top of the right-hand vertical bar, a blue pencil at the bottom, and a `…` that opens a "More" popover with a page thumbnail card and plain menu rows. Everything you touch while reading sits in one bar; below it is only the page. The ask: back becomes a house, the "documents" icon becomes a sidebar icon, every reading control moves to the right with the depth redrawn, and the edit button goes to the very bottom of that bar.

![The folding iPhone's vertical bar — home, list, #, view, speaker, search, more, and the blue pencil at the bottom](/blog/superpdf-read-edit-toggle/right-bar.png)

Top to bottom: home, PDF list, page (`#` on the vertical bar, "3 / 120" in a horizontal one → page popover with thumbnail card, go-to-page, bookmark, contents, bookmark list), view (view mode, page tone, underlines only, book/half/map), read aloud (starts immediately and opens pause/stop, speed, tables, voice), search, more (exports and settings), and the accent-colored pencil. Seven items won over five — the five-item variant hid view and read-aloud behind "more", one tap too deep for the things you touch most. Contents and bookmark left the bar and became rows of the page popover.

### Rows first, choices one level in

The first build spread every choice across one view popover as large cells — icon above, label below. The answer was to make it like GoodNotes' "More → Rotate page": the top level is a menu of rows, and a row with choices opens a second level inside the popover.

![View popover — view mode, page tone, underlines only, pane; the current value and a chevron on the right](/blog/superpdf-read-edit-toggle/view-popover.png)

A row is an icon, a title, the current value in grey ("Page turn", "Original") and `›`. Tapping it swaps the title for the row's name, puts `‹` on the left and lists the options as same-height rows with a checkmark. Picking one keeps you there, so sepia and night can be compared without re-entering.

![Page tone level — ‹ and title, Original · Sepia · Night rows, Sepia checked](/blog/superpdf-read-edit-toggle/view-tone.png)

Icons are text-colored; blue stayed only on the checkmark. Read-aloud speed went the same way — a − / + stepper became a "Speed 1.0× ›" row with six checkable options. A `Menu` was ruled out for the same reason as before: it closes on selection.

### Three things that bit

Every label in the popovers looked bold. A popover presented from a bar button inherits that button's font environment; only explicitly styled text looked right. One `.font(.body)` at the popover root.

Tapping "Settings" in More closed the popover and no sheet appeared. The row set `isPresented` to false and the `onChange` presented the sheet at once — but false marks the start of the dismiss animation, UIKit still has a presentation in progress, and the new one is dropped silently. `.sheet` has `onDismiss` for exactly this; `.popover` does not. A 450 ms wait before presenting fixed it, and the UI test caught it on the first run.

On a portrait iPhone, iOS folded the trailing items — search, more, and the pencil — into the system `…`. Search and More still work from there (their popovers attach to the `…`), but an edit toggle hidden in a menu row does not. On that one layout the pencil stays a floating button in the corner. The same folding broke the share sheet: its anchor was the More button, which no longer existed in the window. The anchor now lives on the always-present bottom area.

Checked on the folded iPhone simulator and a portrait iPhone; the unfolded state and a real device are still to do.

## History

- 2026-11-04 — reading and editing split, bottom-right toggle, last tool remembered
- 2026-11-04, afternoon — reading row (read aloud, underlines only, view mode, page tone) with drill-down; foldable vertical bar takes icon items only
- 2026-11-05 — the second row leads with its parent's icon instead of `<`
- 2026-11-06 — the loading-state toolbar no longer raises an empty bottom bar on the folded iPhone
- 2026-11-08 — reading row removed; eight-item right-hand bar (home, list, page, view, read aloud, search, more, edit) with row-menu drill-down popovers; the edit toggle is the last bar item (floating only on portrait iPhone)
