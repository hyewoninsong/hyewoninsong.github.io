---
title: "Switch the list to cards and the thumbnail becomes the card — flying a copy instead of fading the screen"
date: 2026-11-12T10:34:46+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Switching between the card pager and the title list now moves each preview and name from its old place to its new one. The two screens never share a view tree, so a copy layer outside the stack flies between measured frames."
---

The timetable list has two looks: preview cards you page through, or a plain list of names. Switching used to fade the whole screen out and the other one in. Now the card you were looking at shrinks into its row's thumbnail and its name slides to the row; going back, the thumbnail grows into the card.

## You can see the same timetable change places

![Cards to title list — the centred card's preview shrinks into the first row's thumbnail and the name moves to the row](/blog/2026-11-11-timetable-list-style-flight/to-titles.png)

![Title list to cards — the open timetable's thumbnail grows into the centred card](/blog/2026-11-11-timetable-list-style-flight/to-cards.png)

| Direction | What moves | Everything else |
|---|---|---|
| Cards → titles | The centred card's preview and name | Other rows fade in meanwhile |
| Titles → cards | The thumbnail and name of the card that lands in the centre | Other rows fade out in place |

The calendar list does the same with its month view. The move takes 0.36 seconds.

A fade says "you went somewhere else". These are two shapes of one list, so your eye should be able to follow the item.

## The two screens never exist at the same time

`matchedGeometryEffect` is the usual tool, but it needs both views in one tree for a frame. This sheet rebuilds its `NavigationStack` whenever the look changes, because the bottom search field's placement is decided only when the stack is first created. With a new stack identity there is nothing to match across.

Alternatives that lost:

- **Stop rebuilding the stack** — the search field placement bug comes back.
- **Snapshot the old screen and cross-fade** — everything dissolves; nothing travels.
- **Morph the whole card into a row** — the card preview is a pre-rendered image with no in-between shape.

What we did: a copy layer outside the stack. On tap, copies of the visible preview and name are laid exactly over the originals, and the originals are hidden. The rest fades, the stack is swapped while hidden, the new positions are measured, and the copies travel there. Then the copies are removed and the real views revealed.

## Frames live somewhere SwiftUI does not observe

Cards and rows report their frames with `onGeometryChange`. Storing those in `@State` would redraw the sheet every frame while paging, so they go into a plain class and are read only twice: at the tap and when measuring the landing.

The landing is not stable immediately — the list is built twice and then scrolls to the open timetable's row. We sample every 16 ms and accept two identical readings in a row, with a 250 ms deadline. If the row is off screen, the copy fades where it is.

A few rules we kept:

- Only curves with an end. A spring reports completion with its tail still moving, and the copy lands a few points off.
- A timer that checks it owns the flight removes the copy — not the animation's completion callback.
- No 0.97 scale on the content during a flight; frames measured while scaled put the copy in the wrong place.
- Going to cards, a missing preview image is rendered during the hidden beat so the card does not arrive blank.

## Where it stands

With Reduce Motion on, the old fade remains. The first check used a flight slowed to three seconds, which hid a blink that showed up at real speed (see November 12). Right-to-left languages and iPad are still to be checked.

## 2026-11-12 — The card dimmed once before it flew

A day later: "it blinks once, then animates." A real-speed recording, split into 60 fps frames and scanned for brightness changes, showed about ten frames (0.2 s) where the centred card sat half-faded before it brightened and took off.

![Before — the card stays washed out for several frames after the tap](/blog/2026-11-11-timetable-list-style-flight/blink-before.png)

![After — only the segment and page dots fade; the card leaves at full colour](/blog/2026-11-11-timetable-list-style-flight/blink-after.png)

The toggle button writes to its binding inside `withAnimation(.easeInOut(duration: 0.2))`, and the binding's setter runs synchronously inside that transaction. So placing the copy and hiding the original — meant to happen instantly in one frame — both rode the 0.2 s curve: the copy faded in while the original faded out, and for a moment neither was opaque. When the old stack was swapped out, only the copy remained and the card snapped back to full colour.

The fix wraps those two state changes in `withTransaction` with animations disabled, including the path that cancels a flight on a quick double tap. A source-contract test now guards it.

Two lessons. A three-second debug flight hides a 0.2 s fade that is half of a 0.36 s real one, so record decorative transitions at real speed too. And `simctl io recordVideo` writes the last frame of a still screen late: the video showed the card 5% too small at rest, while screenshots and measured frames said it was full size. Judge still screens from screenshots, not recordings.

## History

- 2026-11-11 — fade replaced by flying preview and name copies
- 2026-11-12 — removed the blink caused by the toggle's animation leaking into the copy placement; landing frames re-read during the flight
