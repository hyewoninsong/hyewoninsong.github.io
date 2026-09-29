---
title: "Overlaying two timetables: a slider decides which one you read"
date: 2026-09-29T22:53:40+09:00
app: "timetable"
tags: ["devlog", "design"]
summary: "The overlay view now draws the top timetable in its own colors instead of a black dashed outline, with an opacity slider and a swap button. Where two schedules overlap, you pick which one to read."
---

The overlay view now has a ⇄ button that swaps which timetable sits underneath, and a slider that sets how opaque the top one is. Where two schedules overlap, the app no longer decides which one wins — you do.

## Why the overlay view exists

It shipped the same day as a question about the free-time finder: is finding free time really something people do often? The only evidence in the plan was an unsourced line. Instead of betting on one answer, the app now has both: the free-time finder, and this smaller view that just draws one timetable on top of another — another timetable from your list, or a file someone sent you. Each logs its own events; usage will decide which stays.

## The first version drew the top layer as a black dashed outline

Your schedules were solid colored blocks; the other timetable was a pale gray fill with a dashed black border. Two problems showed up quickly: the other timetable lost all its colors, and in overlapping cells you could not choose which side to read. A received file was always stuck on top.

## What it does now

| Control | Result |
|---|---|
| ⇄ | The two chips trade places, and so do the bottom and top layers |
| Slider at 0% | Only the bottom timetable |
| Slider at 100% | Overlapping cells show only the top timetable |
| In between | The colors blend; default is 50% |

![Overlay at 50%: bottom schedules solid, top schedules translucent](/blog/timetable-overlay-compare/overlay-half.png)

The top layer keeps its own colors. Titles stay where they were — bottom layer at the top of the block, top layer at the bottom right — so two titles at the same time never collide. Opacity is applied after `compositingGroup()` flattens the block and its title, so the title doesn't show through its own fill a second time.

![After swapping, at 99%: chips reversed, overlapping cells show only the top timetable](/blog/timetable-overlay-compare/overlay-swapped-opaque.png)

The slider value is remembered as a view preference, not saved into the timetable file.

## What lost

- **Color the top layer but keep the dashes** — colors return, but you still can't choose a side.
- **Split overlapping blocks into half-width columns** — titles don't fit in half a narrow column, and the app already dropped column splitting for overlaps.
- **Two on/off toggles** — three discrete states instead of a continuous blend whose endpoints already mean "just one."

## Where it stands

The slider row on a wide iPad window hasn't been captured yet. Which of the two comparison views survives is up to the numbers after release.

## 2026-09-29 — Lay another timetable under the one you're editing

The overlay view is read-only, so moving your own schedules around a friend's meant closing it and working from memory. Now the edit screen's `…` menu has "Lay Under", listing your other timetables.

![The … menu with Lay Under open, listing the other timetables](/blog/timetable-overlay-compare/underlay-menu.png)

Pick one and a row appears above the day header: the timetable's name (tap to switch), an opacity slider, and ✕. Its schedules are drawn in their own colors **beneath** your blocks — above the grid lines, below the now line — and ignore touches, so unlocked editing works exactly as before.

![Underlay at 73%: faint blocks and bottom-right titles show only in the gaps between your blocks](/blog/timetable-overlay-compare/underlay-grid.png)

Unlike the overlay view, your blocks always win where they overlap; the slider only sets how strongly the underlay shows in the gaps. Which timetable is underneath lives only while the window is open; the opacity is a view preference.

**A 5% leak.** The first capture showed underlay titles faintly through solid-looking blocks. Schedule colors are clamped to at least 0.95 opacity, not 1.0 — enough for dark text beneath to show. Rather than touching block rendering, the underlay layer is masked with your block shapes cut out (`.destinationOut`).

## History

- 2026-09-29 — Overlay view added, then reworked the same day into a swap button and opacity slider
- 2026-09-29 — "Lay Under" added to the edit screen; underlay masked around your blocks
