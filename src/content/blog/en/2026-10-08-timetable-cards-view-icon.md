---
title: "I drew the card icon with lines and got parentheses"
date: 2026-10-08T15:07:22+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "The button that switches the timetable list to preview cards has a hand-drawn icon now: one tall card with a neighbor peeking in on each side. Outlined neighbors read as parentheses at 24pt, so they are filled."
---

The timetable list has two views: preview cards you swipe sideways, and a plain list of names. A button in the top right switches between them and shows the view you would get. The icon for "show cards" is now drawn by hand instead of taken from SF Symbols.

## Two overlapping rectangles say "duplicate"

The old icon was `rectangle.on.rectangle`. That shape means copy almost everywhere, and this sheet has a real duplicate button in its edit mode. The card view is not a stack anyway. It is a row: one tall card in the middle and a sliver of the next card on each side. So the icon draws that.

![The new icon in the list sheet toolbar, light and dark](/blog/2026-10-08-timetable-cards-view-icon/toolbar-light-dark.png)

## Outlined neighbors lost twice

The icon next to it is line art (`list.bullet`), so the first drafts were all lines.

![Three drafts, large and at the real 24pt size. The two on the left look like brackets](/blog/2026-10-08-timetable-cards-view-icon/three-drafts.png)

- **Lines with rounded ends.** Fine when large. At 24pt it is `)▯(`.
- **Lines cut square at the edge.** I blamed the round ends and cut them off. Nothing changed. The outline of a mostly hidden rectangle is one curved line at this size, whatever its ends look like.
- **Filled slivers.** A filled shape reads as an object that continues past the edge. The center card stays outlined so the icon weighs the same as its neighbors in the toolbar.

A partly visible object in a small icon needs to be a shape, not a line.

## Compare against the real symbols before opening the simulator

The drawing uses a 64×64 grid in a SwiftUI `Canvas`, shown at 24pt with a 4.5/64 stroke to match a 17pt symbol. It is painted with the `.foreground` style, so it takes whatever color the toolbar gives it.

Picking between drafts did not need a simulator. Rendering the view next to `list.bullet` with `ImageRenderer` takes a few seconds, and the drafts only differed at the real size. One simulator capture at the end confirmed the button is still 36pt and that dark mode works.
