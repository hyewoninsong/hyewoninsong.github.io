---
title: "Two of three tabs were showing the same thing"
date: 2026-09-21
app: "daily-planner"
tags: ["devlog", "design", "swiftui"]
summary: "The daily planner's Home tab is gone, folded into the Todos tab. The app now opens on the planner, and each todo row carries its own contribution graph. A day later the stats cards went from four to one."
---

The daily planner now opens straight onto the day view. The Home tab — contribution graphs and stats — is gone, and its cards moved to the top of the Todos tab. Two tabs: `Planner` and `Todos`.

## The same todo, drawn twice

There used to be three tabs: Home, Planner, Todos. Two problems.

The screen you open every day is the planner, but the app started on Home. One extra tap, every launch.

And Home and Todos were showing the same thing. Home's "per todo" card was a color dot, a name, a 14-cell strip graph and total time; the Todos list row was a color dot, a name, the last placement date and total time. The same row, and both led to the same detail screen. There was no information reason to switch tabs.

So Home is gone and its cards are now the top section of the Todos list. The per-todo card got absorbed into the rows themselves: every active row carries a strip graph. The full graph for one todo lives in its detail screen, one tap away.

![Summary and list in one scroll. The small strip on each row is the last 14 days, total time underneath](/blog/planner-two-tabs/todos-tab.png)

The row's subtitle went away. "Last Sep 20 · 1 total" was saying what the strip right next to it already said, and it was wrapping the title onto three lines to do it.

## One scroll, not a segmented control

Splitting the tab with a `Summary | List` control is the obvious move, but the screen already has an `Active | Archived` segment. Stack two and you have to read which axis you are on every time.

Keeping three tabs and just reordering them would fix the launch tap and leave the duplication intact. Dropping Home and moving stats into each todo's detail screen would leave nowhere for the profile-wide numbers — streak, completion rate, the day-of-week heatmap.

So: one scroll. Summary on top, list below.

## Seven cards buried the list

The first build put the list off-screen. Stat tiles, granularity picker, full graph, four-week completion, top todos this month, day × hour heatmap, stale todos — seven cards before the first row. Scrolling past your own statistics to pick a todo isn't merging, it's burying.

Now the tiles, the granularity picker and the full graph stay visible, and the other four sit behind **More stats**, collapsed by default and remembered once you open it. (Four became one a day later — see the Sep 21 section.)

![More stats reveals the top todos of this month](/blog/planner-two-tabs/more-stats.png)

The summary also shows up only when you are just looking at the Active list. While searching, or selecting rows in edit mode, it disappears and the list takes the whole screen.

## Granularity is one choice, shared

The granularity choice is shared between the summary and the rows, and it keeps the old Home storage key — someone who was looking at weekly buckets shouldn't be dropped back to daily by an update.

## 2026-09-21 — three of the four collapsed cards are gone

Collapsed cards cost no space, so keeping them felt free. After a few days of use, **More stats** never got opened, and opening it explains why.

**Four-week completion** showed `–` for half its bars: with no blocks that week there is no completion rate. Half a chart with nothing to read is not a trend.

**When do you usually do this** (a day × 4-hour heatmap) had the least to say of all, in this app specifically. You place your day on a timeline by hand here, so when you do what is already on screen — the grid just repeated the blocks you had just made, in color.

**Stale todos** listed todo names three rows above the todo list. Scroll a thumb's width and the same names are right there.

So all three are gone. **Top todos this month** is the one card left, and when there is nothing this month the **More stats** toggle hides too — a button that opens onto nothing is worse than no stats at all. The calculations only those cards used (weekly completion, the heatmap, days-since-last-placement) went with them, along with their tests: dead code that still has tests reads like live code to the next person.

The **expand chevron** on each list row went too. Tapping the row opens the detail screen, which draws that todo's graph larger and adds period tiles and a history calendar. There was no reason to draw the same graph in two places and hold an expanded-state set per row. The `ScrollViewReader` scroll added because "expanding the bottom row drew under the tab bar" disappeared with it — the cleanest fix is the one that stops being necessary.

A row does one thing now. It opens the detail.

## History

- 2026-09-20 — three tabs merged into two, summary moved to the top of Todos
- 2026-09-21 — three of the four collapsed stats cards and the row expander removed
