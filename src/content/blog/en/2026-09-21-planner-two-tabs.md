---
title: "Two of three tabs were showing the same thing"
date: 2026-09-25T00:30:00+09:00
app: "daily-planner"
tags: ["devlog", "design", "swiftui"]
summary: "The daily planner folded its Home tab into Todos, then removed that summary entirely, then cut the four layers left above the list — segment, search, edit, avatar — down to one title row. Plus the pitfall: a title menu does not attach to a large title."
---

The daily planner now opens straight onto the day view. The Home tab — contribution graphs and stats — is gone, and its cards moved to the top of the Todos tab. Two tabs: `Planner` and `Todos`. (That summary was removed entirely on Sep 23, and on Sep 25 the chrome above the list shrank to a single title row — see the last section.)

## The same todo, drawn twice

There used to be three tabs: Home, Planner, Todos. Two problems.

The screen you open every day is the planner, but the app started on Home. One extra tap, every launch.

And Home and Todos were showing the same thing. Home's "per todo" card was a color dot, a name, a 14-cell strip graph and total time; the Todos list row was a color dot, a name, the last placement date and total time. The same row, and both led to the same detail screen. There was no information reason to switch tabs.

So Home is gone and its cards are now the top section of the Todos list. The per-todo card got absorbed into the rows themselves: every active row carries a strip graph. The full graph for one todo lives in its detail screen, one tap away.

![Summary and list in one scroll. The small strip on each row is the last 14 days, total time underneath](/blog/planner-two-tabs/todos-tab.png)

The row's subtitle went away. "Last Sep 20 · 1 total" was saying what the strip right next to it already said, and it was wrapping the title onto three lines to do it.

## One scroll, not a segmented control

Splitting the tab with a `Summary | List` control is the obvious move, but the screen had an `Active | Archived` segment at the time (it is gone now — see the Sep 25 section). Stack two and you have to read which axis you are on every time.

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

## 2026-09-25 — the summary is gone entirely, and so are the four layers above the list

The summary the sections above built — tiles, full graph, **More stats** — was removed wholesale on Sep 23. The one remaining card never got opened either, and the profile-wide numbers now live in the home-screen widget. In-app statistics are the row strip and the detail screen, nothing else.

Even without the summary, opening the Todos tab still put the list far away. Four layers sat above it: the toolbar (`Edit` on the left; sort, `+` and the profile avatar on the right), a large title, the search field, and the `Active | Archived` segment. On a profile with two todos, half the screen was chrome, and in select mode a large `0 selected` title kept that space while the search field and segment stayed put. Every layer had a reason. The problem was that all of them were **occasional** features in **permanent** places.

So the chrome is now one row.

![One title row, then the list. The title is the profile name with a chevron; on the right, add and more](/blog/planner-two-tabs/title-row.png)

| Was | Now |
|---|---|
| `Active \| Archived` segment | An `N archived ▸` row at the **end** of the list. It pushes the archived screen, and it is absent when nothing is archived |
| Search field | Only from 8 todos up, and as a bottom magnifier button (iOS 26's minimized search), not a layer above the list |
| `Edit` | `Select` inside the `…` menu |
| Sort · strip granularity | Same `…` menu |
| Profile avatar | The title itself. The title already was the profile name; the avatar next to it was the same profile twice. Tap the chevron to switch or manage |
| Large title | Inline |

Select mode follows Photos: the title becomes `N selected`, the tab bar goes away, and `Archive` and the trash stand in its place as a bottom bar. Row strips stay during selection — a row that changes shape per mode makes the list jump on every switch.

![Select mode: deselect all, 1 selected, done on top; archive and trash where the tab bar was](/blog/planner-two-tabs/select-mode.png)

The empty state got an `Add Todo` button, and the archived row survives below it — "where did my todos go" should be answered right there.

![No active todos, but the 1 archived row remains, with an Add Todo button in the empty state](/blog/planner-two-tabs/archived-link.png)

## Why archived stays visible

Putting Archived only inside the `…` menu was the tidiest option, and it hides the fact that anything is archived at all. The end-of-list row also carries the count. Keeping the segment and folding only search would leave the biggest layer in place. Dropping search entirely lost to profiles with dozens of todos, so a count threshold it is — at the cost of the list scrolling to the top when the threshold is crossed, since `.searchable` cannot be switched off and has to be attached conditionally.

## The title menu did not attach to a large title

The profile menu started as `toolbarTitleMenu`. It built, and nothing appeared: no chevron next to the large title, no menu on tap. Then select mode turned the title inline (`1 selected`) and the chevron showed up **there**, opening the menu in the one place it wasn't wanted.

`toolbarTitleMenu` only hooks the inline title view. With a large title the title is a plain `StaticText` in the accessibility tree; the menu appears only once scrolling collapses it. The docs don't say so.

The fix was an inline title with a `Menu` placed as the `principal` toolbar item — the same grammar the planner tab's month button already uses — which also makes the mode-dependent presence a single `if` in the toolbar builder. Dropping the large title made the chrome literally one row, so the pitfall pushed the decision one step further.

A UI test's screenshot caught it. Code review can't, and neither can a capture taken after scrolling or on an inline screen: a title-menu change has to be checked on an **unscrolled large-title** screenshot.

The line above about the screen "already having an `Active | Archived` segment" is history now. No segment, no summary — a title row and the list.

## History

- 2026-09-20 — three tabs merged into two, summary moved to the top of Todos
- 2026-09-21 — three of the four collapsed stats cards and the row expander removed
- 2026-09-23 — summary removed entirely; stats are the row strip and the detail screen
- 2026-09-25 — segment, always-on search, edit and avatar gone; chrome is one title row. `toolbarTitleMenu` doesn't attach to large titles
