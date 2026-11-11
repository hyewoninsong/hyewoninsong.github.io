---
title: "Switch the list to cards and the thumbnail becomes the card — flying a copy instead of fading the screen"
date: 2026-11-11T23:22:05+09:00
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

With Reduce Motion on, the old fade remains. We verified the mid-flight frames with the flight slowed to three seconds; the landing at real speed, right-to-left languages, and iPad are still to be checked.
