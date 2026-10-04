---
title: "Expanding the calendar now moves the dates instead of replacing them"
date: 2026-09-21T20:10:00+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "Pulling the date bar open used to fade seven day cells out and fade a month grid in somewhere else. Now those same seven cells slide down to the row they occupy in the grid, and the rest of the month arrives around them."
---

The daily planner keeps the current week in a single row at the top of the screen, and pulling
the handle opens the whole month. Until now the week's seven dates faded out on the way and a
month grid appeared somewhere else, so there was nothing to follow. Those seven dates now stay
on screen and travel to the row they occupy in the grid; the other weeks slide in around them.

## The same date was drawn two different ways

The collapsed row and the month grid were separate screens with separate numbers — 34pt cells in
one, 30pt in the other, weekday letters stacked on each cell in one and a shared header row in
the other. While September 30 looks different in the two places, no animation curve makes the
change read as movement.

So the cell became one type, 32pt, and the weekday header moved to the top of the bar where it
stays put through the transition. Only then is the transition a geometry problem.

![The collapsed date bar: September 27 through October 3, with the 30th selected](/blog/planner-week-month-morph/week-row.png)

## The month grid is always there, just clipped to one row

Instead of swapping views, the grid stays mounted and the bar clips it to the row holding the
selected day: the window is one row tall and the grid is shifted up by `row × 40pt`. Expanding
releases those two values together. The dates in the collapsed row were that grid row all along,
so they simply arrive where they belong.

![The expanded grid: its last row is the row that was collapsed, with October 1–3 dimmed](/blog/planner-week-month-morph/month-grid.png)

The week row is still its own pager — horizontal swipes there move by week, which the month grid
cannot do. It is pinned to its row *inside the grid's coordinate space*, and the window height
and offset are applied **once** to the pair. Giving each its own offset with the same curve was
the first attempt; they drifted by a frame and the numbers ghosted.

## A week that straddles two months lost its numbers

The grid left the leading and trailing cells blank. Looking at September 30, the collapsed row
reads `27 28 29 30 1 2 3` while the grid row reads `27 28 29 30 · · ·` — October 1–3 vanish the
moment you expand. The gutters now hold the neighbouring month's real dates, dimmed and tappable,
which also makes crossing a month boundary a single tap.

## Correcting a note that said this could not work

Overlaying both views and clipping the height had been tried before and had failed, and the repo
carried a note saying not to do it: the horizontal pager would sit on its first page, showing a
week from a year ago and a month from ten years ago.

That did happen — but the structure was not the cause. With `ScrollView` +
`.scrollTargetBehavior(.paging)` + `.scrollPosition(id:)`, seeding the position in `onAppear` is
too late: the scroll view has already settled at content offset zero and ignores the value.
Seeding it in `init` with `@State(initialValue:)`, and sizing the container from a computed height
(row constant × row count) rather than a measured one that starts at zero, makes the first layout
pass correct.

The note was corrected in place rather than deleted — the real rule is "seed `scrollPosition` in
`init`", not "avoid this layout". A UI test now asserts that the collapsed strip starts on the
current week, since a screenshot cannot tell you which week you are looking at; only the
accessibility identifiers can.

## Where it stands

The transition is still 0.32s ease-in-out — the height changes fivefold, so a spring's overshoot
becomes a visible wobble. While collapsed the month grid takes no touches and is hidden from the
accessibility tree, which matters more than it sounds: otherwise a screen reader announces day
cells that are not on screen.
