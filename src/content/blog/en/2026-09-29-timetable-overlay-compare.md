---
title: "Overlaying two timetables: a slider decides which one you read"
date: 2026-10-01T10:42:15+09:00
app: "timetable"
tags: ["devlog", "design"]
summary: "The overlay view now draws the top timetable in its own colors instead of a black dashed outline, with an opacity slider and a swap button. Where two schedules overlap, you pick which one to read."
---

The separate overlay view built on September 29 had a ⇄ button that swaps which timetable sits underneath, and a slider that sets how opaque the top one is. Where two schedules overlap, the app no longer decides which one wins — you do.

The separate overlay and underlay views were removed on September 30. The sections below preserve that design history; the October 1 update brings layer controls into the comparison of your own timetable candidates.

## Why the overlay view existed

It shipped the same day as a question about the free-time finder: is finding free time really something people do often? The only evidence in the plan was an unsourced line. Instead of betting on one answer, the app temporarily had both: the free-time finder, and this smaller view that just draws one timetable on top of another — another timetable from your list, or a file someone sent you. The plan was to compare their usage. The separate overlay entry was later removed.

## The first version drew the top layer as a black dashed outline

Your schedules were solid colored blocks; the other timetable was a pale gray fill with a dashed black border. Two problems showed up quickly: the other timetable lost all its colors, and in overlapping cells you could not choose which side to read. A received file was always stuck on top.

## How the September 29 controls worked

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

The wide iPad layout had not been captured at that stage. That separate view was later removed; the candidate comparison below gives the layer controls a new purpose.

## 2026-09-29 — Lay another timetable under the one you're editing

The overlay view is read-only, so moving your own schedules around a friend's meant closing it and working from memory. Now the edit screen's `…` menu has "Lay Under", listing your other timetables.

![The … menu with Lay Under open, listing the other timetables](/blog/timetable-overlay-compare/underlay-menu.png)

Pick one and a row appears above the day header: the timetable's name (tap to switch), an opacity slider, and ✕. Its schedules are drawn in their own colors **beneath** your blocks — above the grid lines, below the now line — and ignore touches, so unlocked editing works exactly as before.

![Underlay at 73%: faint blocks and bottom-right titles show only in the gaps between your blocks](/blog/timetable-overlay-compare/underlay-grid.png)

Unlike the overlay view, your blocks always win where they overlap; the slider only sets how strongly the underlay shows in the gaps. Which timetable is underneath lives only while the window is open; the opacity is a view preference.

**A 5% leak.** The first capture showed underlay titles faintly through solid-looking blocks. Schedule colors are clamped to at least 0.95 opacity, not 1.0 — enough for dark text beneath to show. Rather than touching block rendering, the underlay layer is masked with your block shapes cut out (`.destinationOut`).

## 2026-10-01 — Show why a timetable ranks differently

This comparison helps you choose among timetables you created. It is separate from finding a meeting time with friends. The initial screen listed days with events, gaps, morning events, and occupied minutes, but a total of 120 gap minutes did not show where those gaps fell.

The update adds an overlay on a shared day-and-time axis. Each candidate has an identifying color used across its controls, bars, and grid. Using original event colors would make two blue events from different candidates hard to distinguish; this comparison color does not change the source timetable.

![Gap comparison highlights each candidate’s empty intervals with dashed outlines](/blog/timetable-overlay-compare/candidate-gaps.png)

### Drawing order must not become ranking

You can hide a layer, adjust its opacity, or reorder it with a drag handle. Bringing a candidate to the front does not make it rank first. Hidden layers still participate in the numerical comparison, and view controls live only for the current sheet session.

![Lia is the front layer while Siwoo remains first in the tied ranking: the two orders stay independent](/blog/timetable-overlay-compare/candidate-layers.png)

Bars compare four criteria and the grid highlights the relevant days or intervals. Gaps lie between the first and last event of each day. Morning means an event starts before noon: an 11–13 event counts as one morning event, not one hour. Occupied time counts overlaps within each candidate once.

Overlap between two candidates is not a conflict warning. They are alternatives, not events you intend to attend simultaneously. Users choose the criterion; equal values share a rank. There is no combined score claiming one timetable is best for everyone.

### Keep the evidence beside the choice

Restoring another comparison sheet would separate candidate selection, numerical results, and the actual weekly arrangement. Keeping the overlay here lets you inspect why the numbers differ without remembering a different screen. It remains read-only and part of the existing Premium purchase.

This is an extension under development. Earlier screenshots in this post document the retired views, not the current candidate comparison.

## History

- 2026-09-29 — Overlay view added, then reworked the same day into a swap button and opacity slider
- 2026-09-29 — "Lay Under" added to the edit screen; underlay masked around your blocks
- 2026-09-30 — separate overlay and underlay views removed
- 2026-10-01 — layer controls and visual metrics integrated into own-candidate comparison
