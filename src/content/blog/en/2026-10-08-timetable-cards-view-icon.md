---
title: "I drew the card icon with lines and got parentheses"
date: 2026-10-08T16:24:31+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "The button that switches the timetable list to preview cards has a hand-drawn icon now. Outlined neighbor cards read as parentheses at 24pt, so they were filled; after seeing it on a phone, the neighbors went away and one rectangle is left."
---

The timetable list has two views: preview cards you swipe sideways, and a plain list of names. A button in the top right switches between them and shows the view you would get. The icon for "show cards" is now drawn by hand instead of taken from SF Symbols. The first drawing was a card with its neighbors; what ships today is a single rectangle. This post goes through both.

## Two overlapping rectangles say "duplicate"

The old icon was `rectangle.on.rectangle`. That shape means copy almost everywhere, and this sheet has a real duplicate button in its edit mode. The card view is not a stack anyway. It is a row: one tall card in the middle and a sliver of the next card on each side. So the icon draws that.

![The first drawing in the list sheet toolbar, light and dark](/blog/2026-10-08-timetable-cards-view-icon/toolbar-light-dark.png)

## Outlined neighbors lost twice

The icon next to it is line art (`list.bullet`), so the first drafts were all lines.

![Three drafts, large and at the real 24pt size. The two on the left look like brackets](/blog/2026-10-08-timetable-cards-view-icon/three-drafts.png)

- **Lines with rounded ends.** Fine when large. At 24pt it is `)▯(`.
- **Lines cut square at the edge.** I blamed the round ends and cut them off. Nothing changed. The outline of a mostly hidden rectangle is one curved line at this size, whatever its ends look like.
- **Filled slivers.** A filled shape reads as an object that continues past the edge. The center card stays outlined so the icon weighs the same as its neighbors in the toolbar.

A partly visible object in a small icon needs to be a shape, not a line. That drawing did not last, though. See the last section.

## Compare against the real symbols before opening the simulator

The drawing uses a 64×64 grid in a SwiftUI `Canvas`, shown at 24pt with a 4.5/64 stroke to match a 17pt symbol. It is painted with the `.foreground` style, so it takes whatever color the toolbar gives it.

Picking between drafts did not need a simulator. Rendering the view next to `list.bullet` with `ImageRenderer` takes a few seconds, and the drafts only differed at the real size. One simulator capture at the end confirmed the button is still 36pt and that dark mode works.

## 2026-10-08: on a phone, one rectangle was enough

The filled slivers won among the three drafts, but on a real phone the button held three shapes while the X and "Edit" next to it held one. The neighbors are gone now.

![The current icon: one rounded rectangle, tall but fairly wide](/blog/2026-10-08-timetable-cards-view-icon/single-card.png)

Deleting the slivers was not the whole change. The center card had been narrow (26×46 on the 64 grid) to leave room for them, and on its own it looked like a phone. It took the freed width and is 34×46 now, closer to the real preview card. Stroke and the 24pt frame are unchanged.

It works without showing the swipe because the icon is never read alone. It alternates with `list.bullet` in the same spot, and "several lines" against "one big sheet" is enough to tell the views apart.

## History

- 2026-10-08: replaced the system symbol with a hand-drawn card and filled neighbor slivers
- 2026-10-08: dropped the slivers, one rectangle
