---
title: "All-day items as one strip above the timeline"
date: 2026-09-21T21:00:00+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "'Groceries, sometime today' does not want a start time. The day planner now places a todo on a date only: one boolean on the model, one pinned strip under the date bar, and timeline math that never sees these items. Why optional minutes, a second entity and drawer tags lost."
---

The day planner can now hold a todo on a day without a time. A small `All-Day` strip sits directly under the date bar; its trailing `+` places a todo there as a chip. Before this, "groceries, sometime today" had to be forced onto some hour, where it rang alarms and joined overlap and push calculations, or go into the drawer, which forgets that the item belonged to today at all.

## The strip is pinned, the chips speak the block grammar

The strip lives outside the vertical scroll. Whatever hour you are looking at, today's all-day items stay in view, and each day page carries its own strip so it pages with the day. It is where Apple Calendar keeps its all-day row.

![Two chips on the all-day strip. The left one is completed: strikethrough and dimmed. The dashed + is the only way to add an all-day item](/blog/planner-all-day/strip-chips.png)

Chips follow the block rules: the todo's color as background, a check glyph on the left that completes it, strikethrough and reduced opacity when done. The one difference is that tapping a chip opens its menu immediately. Blocks need a "select, then tap again" step because selection is what shows the drag and resize handles. A chip has nothing to drag or resize, so a selection state would have no job.

![Chip menu: Edit, Move to Timeline, Put in Drawer, Remove from Schedule](/blog/planner-all-day/chip-menu.png)

| | Timed block | All-day chip |
|---|---|---|
| Place | long-press and drag on empty space | `+` at the end of the strip |
| Complete | check on the block's left | check on the chip's left |
| Menu | tap a selected block again | tap the chip |
| Switch | block menu `Move to All-Day` | chip menu `Move to Timeline` |

`Move to Timeline` lands the item in the middle of whatever the screen is showing, at its remembered length. That is the same landing rule the drawer uses: no hunting for a free slot, and nothing appears where you are not looking. The edit sheet gains an `All-Day` toggle; switching it on hides the time row and the alarm row.

## One flag, minutes kept

The model change is a single `isAllDay` boolean. Start and end minutes stay. Moving an item to all-day does not erase them, so moving it back proposes the old place, and the duration keeps feeding the contribution graph and time totals.

The timeline side never sees these items. The one function that answers "blocks on this day" filters them out, so overlap hatching, push and pull, swap, re-layout, free-slot search and the minimap all run unchanged. The calendar dots, the stats, and "move all incomplete to tomorrow" do include them; an unfinished item is unfinished whether or not it had a time.

There are no alarms on all-day items. All three alarm slots are anchored to start and end times, so there is no moment to ring. Moving to all-day drops the alarms; undo brings them back.

## Why this shape

Optional minutes, with nil meaning all-day, is the first idea. It makes every timeline path unwrap, and it loses the original place and length when an item switches sides. A flag touches less code than an optional.

A separate entity would rebuild completion, notes, the drawer, undo, profile filtering and stats twice, and add an entity to a store that mirrors to iCloud. That store's rule is "non-optional attributes carry a default", and `isAllDay = false` opens with a lightweight migration.

A virtual block drawn above 00:00 scrolls away, which is the opposite of "today, whenever". A date tag on drawer items hides behind the bottom-right button and blurs what the drawer is: no date. A single morning reminder for all-day items drags in a new setting and a wider meaning for the slots; if the need shows up, it gets its own decision.

Dragging a block up into the strip is out for now. The top edge of a vertical drag is the auto-scroll zone, and the two would fight. Two menu lines cover the switch.

## Two things the capture test caught

An accessibility identifier on the strip's root view overrode the identifier on the inner `+` button, and the UI test could not find it. SwiftUI propagates a container's identifier to its children; identifiers belong on the controls you press.

The day pager keeps neighbouring pages rendered, so `firstMatch` returned the `+` from an off-screen page at x = -353 and the tap failed with "cannot compute hit point". Pick the element whose x is on screen, the same rule the app's tests already use for the gesture layer.

## What is left

Past four items the strip folds into an `N more` chip. The threshold gets revisited once real days show how many all-day items actually pile up.

## History

- 2026-09-21 — all-day items and the strip
