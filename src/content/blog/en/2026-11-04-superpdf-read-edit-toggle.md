---
title: "Swiping to turn the page drew a line instead — so reading and editing became two modes"
date: 2026-11-04T12:00:34+09:00
app: "superpdf"
tags: ["devlog", "gesture", "design"]
summary: "With the pen or crop tool in hand, a sideways swipe drew a stroke instead of turning the page. Rather than guess intent from the gesture, a single button in the bottom-right corner now switches between reading and editing — and editing brings back the last tool you used."
---

With the pen or crop tool selected, swiping to the next page drew a horizontal line or started a crop box.
Now a book opens in **reading** mode, and the pencil in the bottom-right corner switches to **editing**. In reading, a swipe always
turns the page. In editing, a drag always draws.

## One button for reading, a tool row for editing

Reading has no tool row — just a pencil in the corner. Swipe to turn; tap an underline to get its tooltip for color or delete.

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
If it still feels heavy, two-finger turning is the next step. iPad and foldable layouts have not been checked on screen yet.
