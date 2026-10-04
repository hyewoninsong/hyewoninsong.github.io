---
title: "Overlaying two timetables: a slider decides which one you read"
date: 2026-10-02T11:29:12+09:00
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

You could hide a layer, adjust its opacity, or reorder it with a drag handle (retired 2026-10-02 — see below). Bringing a candidate to the front did not make it rank first. Hidden layers still participated in the numerical comparison, and view controls lived only for the current sheet session.

![Lia is the front layer while Siwoo remains first in the tied ranking: a record of a view retired 2026-10-02](/blog/timetable-overlay-compare/candidate-layers.png)

Bars compared four criteria (replaced by a table on 2026-10-02) and the grid highlights the relevant days or intervals. Gaps lie between the first and last event of each day. Morning means an event starts before noon: an 11–13 event counts as one morning event, not one hour. Occupied time counts overlaps within each candidate once.

Overlap between two candidates is not a conflict warning. They are alternatives, not events you intend to attend simultaneously. Users choose the criterion; equal values share a rank. There is no combined score claiming one timetable is best for everyone.

### Keep the evidence beside the choice

Restoring another comparison sheet would separate candidate selection, numerical results, and the actual weekly arrangement. Keeping the overlay here lets you inspect why the numbers differ without remembering a different screen. It remains read-only and part of the existing Premium purchase.

This is an extension under development. Earlier screenshots in this post document the retired views, not the current candidate comparison.

## 2026-10-02 — One screen, a table instead of bars, the grid paged

New semester, several draft timetables, deciding which courses to actually take: that's who opens this screen. The October 1 version stacked a candidate list, a sort picker, a 600pt-wide horizontally scrolling overlay grid, layer sliders, and rank bars — comparing meant scrolling through two or three screens. Candidates usually share most of their courses, so overlaying them stacked the shared blocks N deep and buried the differences.

This version fits on one screen with no scrolling: a row of candidate chips, a metrics table (candidates as rows; days with events, gap time, morning events, and total time as columns, lowest value in each column highlighted, tapping a column header sorts and highlights that metric on the grid), and the grid filling the rest of the height. The grid pages one candidate at a time — an iPad page sheet shows two or three side by side — and draws events present in every candidate in grey, reserving color for the differences. A caption below reads "Only here: School (Mon) · Math (Sat)," next to a button that opens the full timetable.

![A candidate chip row, a metrics table, and a paged grid fit on one screen without scrolling](/blog/timetable-overlay-compare/one-screen.png)

The overlay survives as "pick two": long-pressing two rows in the table overlays just those two on the grid, front candidate at 85% opacity, back at 60%. Layer reordering, hiding, opacity sliders, and rank bars are all gone — the same layer list described above, where "bringing a candidate to the front didn't make it rank first." With only two candidates ever overlaid, a fixed 85/60 split is enough; that layer of control wasn't needed.

![Long-pressing two rows overlays them: shared events turn grey, each candidate's differences keep their own color](/blog/timetable-overlay-compare/overlay-two.png)

Same course, different section means a different time — and that time difference is exactly what the decision is about. So "shared" is judged by title plus day plus start/end time, not title alone. Candidates as table columns were considered too, but ten candidates overflow an iPhone's width; candidates stay as rows, and the table scrolls internally past six. A separate button to enter overlay mode was also considered, but that's one more state and a control outside the table — long-press plus a one-line hint does the same job.

Nesting the comparison sheet inside the list sheet kept it stuck at 580pt wide on iPad even with `.presentationSizing(.page)`. iPadOS sizes a sheet presented from inside another sheet to match the presenter's size — measuring both sheets showed identical widths down to the pixel. The fix: the list sheet closes itself, its `onDismiss` opens the comparison sheet, and the comparison sheet's `onDismiss` reopens the list (unless you tapped to open the timetable, which skips that). Metric definitions and the Premium gate are unchanged.

## History

- 2026-09-29 — Overlay view added, then reworked the same day into a swap button and opacity slider
- 2026-09-29 — "Lay Under" added to the edit screen; underlay masked around your blocks
- 2026-09-30 — separate overlay and underlay views removed
- 2026-10-01 — layer controls and visual metrics integrated into own-candidate comparison
- 2026-10-02 — candidate comparison moved to one screen (chips, metrics table, grid pages colored only by difference); overlay reduced to picking two
