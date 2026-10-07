---
title: "We shipped an all-day strip and pulled it the same day"
date: 2026-10-07T17:25:47+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "All-day items came as a strip, left the same day, and came back two weeks later as a list view of the day. One thing changed underneath: the contribution graph now counts what you finished, not what you scheduled."
---

The day planner got an **all-day strip** — a todo held on a date with no time — and it was reverted in full the same day. Two weeks later the same model came back in a different place: a **list view** of the day. The sections below go in order — what was built, why it was pulled, and what changed enough to bring it back.

Here is what it was. The planner could hold a todo on a day without a time. A small `All-Day` strip sits directly under the date bar; its trailing `+` places a todo there as a chip. Before this, "groceries, sometime today" had to be forced onto some hour, where it rang alarms and joined overlap and push calculations, or go into the drawer, which forgets that the item belonged to today at all.

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

## 2026-09-21 — pulled it back out

Half a day after the strip shipped, it was removed. Not because of a bug — because of what this
app is for.

The planner has one value: it lays the day out on a timeline and makes you look at it. An all-day
strip is a second place to park work that never touches the timeline, so it quietly lets you skip
the only question the app asks — *when are you actually doing this?* Let chips pile up on the strip
and the day becomes a list, and the app has no reason to exist. Work with no time already had a
home: the drawer. The drawer does forget that an item belonged to today, but that is a reason to
fix the drawer, not to add a second surface.

The cost was real, too. Adding a query to a screen went from picking one of two filters to one of
three (visible / on the timeline / on the strip), placing work went from one path to two (drag on
empty space, or the strip's `+`), and alarm rules split by item shape. Any further feature doubles
all three. The cheapest moment to undo it was immediately.

The way to remove it is to revert the merged commit, not to delete by hand. All-day touched
twenty-six files — model, store, menus, sheets, tutorial gating, the string catalog — and hand
picking leaves a line behind every time. Only three spots that collided with work merged in the
meantime were resolved manually.

No data was touched. An item that had been made all-day comes back on the timeline at the minutes
it was still carrying, usually 08:00. Keeping start and end minutes instead of clearing them is the
design decision that paid off here. A field that once reached the iCloud record type cannot be
deleted, but a field nobody reads does not affect syncing.

The record stays. The decision log is append-only, so the decision that introduced all-day is
marked reversed rather than deleted. If the need comes back, that design — one flag, outside the
timeline math — is the starting point. The question to re-ask first is where it lives.

## 2026-10-07 — back as a list view, and the graph counts only what got done

All-day items are back two weeks after the revert. The model is the one from September — a single `isAllDay` flag on a placement, kept out of the timeline math. What changed is **where it lives** and **what the contribution graph measures**.

The premise moved first. September's reason for pulling it was "no second surface that bypasses the timeline." This time that is exactly the use we accepted. Drink water, vocabulary, stretching — some tasks have no reason to pick an hour, and some people use **only** that. For them a planner that is nine-tenths empty hour grid is the wrong screen. So instead of a thin strip under the date bar, a `Timeline | List` segment at the top swaps **the whole day page**. The date bar, swiping between days and the bottom buttons are shared. The choice is remembered per device, so a checklist-only user opens into the list every time.

![The list view: two all-day tasks, a check circle on the left and the last seven days of the graph on the right](/blog/planner-all-day/list-unchecked.png)

The list has two sections. `All-day` rows are checked with the circle on the left, and each row carries its own last-seven-days strip so the row reads as the place the graph grows from. `Schedule` shows the day's timed placements read-only: the check band works, tapping the body jumps to the timeline with that block selected. Moving and resizing stay on the timeline. The only way in is the `+` at the bottom right — pick a todo and it lands on the day you are looking at, with no time. The same todo cannot be added twice to one day; the check is the record, so a second row would mean nothing.

![After checking: the title is struck through and today's cell in the strip is at full color](/blog/planner-all-day/list-checked.png)

The bigger decision is the graph. Until now it counted **scheduled minutes** and ignored completion. A check cannot live on that scale — zero minutes is an empty cell forever, and inventing a default length piles up fake time. So the scale changed: **only finished work counts.** A timed placement contributes its minutes once checked; an all-day placement contributes one check. A cell takes the darker of its minutes level and its checks level, and one check fills the daily cell completely — a habit graph where "did it today" is pale does not feel planted. Weekly cells darken at 1, 3, 5 and 7 checks, monthly at 1, 8, 16 and 24. Period tiles and row captions follow the same rule and keep the two units apart, as in `1h 40m · 12×`.

Existing users see this. Minutes from placements that were never checked drop out of the graph. For someone who never used the checkbox the graph gets lighter. That was the deliberate choice — planning and doing do not share one scale.

![While on the timeline, unchecked all-day items show as a count badge on the list glyph](/blog/planner-all-day/timeline-badge.png)

The alternatives that lost: a per-todo `timed | count` type, because it forbids scheduling a habit on one day and just checking it on another; a separate check entity, because the drawer, undo, calendar dots and cache invalidation would all need a second implementation when one flag inherits them; and putting the segment in the bottom-left capsule, which is the undo-and-lock capsule and about timeline state, not about which view you are in.

One small thing broke. With the segment in the center of the toolbar the month title `October 2026` truncated to a single digit on iPhone width. The title now shows just the month inside the current year and adds the year only when you scroll into another one.

What is left is on the CloudKit side: `isAllDay` already reached the record type in September, but whether it is deployed to production only the console knows. Checking from the todo list sheet and from a widget button come next.

## History

- 2026-09-21 — all-day items and the strip
- 2026-09-21 — reverted in full the same day; no second surface that bypasses the timeline
- 2026-10-07 — back as the list view; graph and stats count finished work only, one check fills the daily cell
