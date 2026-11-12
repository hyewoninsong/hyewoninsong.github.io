---
title: "To allow 5-minute events, the grid had to grow six times taller first"
date: 2026-11-13T02:52:12+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Each timetable now picks its event unit: 5, 10, 15, 20 or 30 minutes. One unit is always as tall as today's 30-minute cell, so a 5-minute block can still be tapped, dragged and resized."
---

Each timetable in Super Timetable now has an **event unit**: 5, 10, 15, 20 or 30 minutes. The unit is the shortest an event can be when you drag it out or resize it on the grid; two days later the setting was renamed "minimum drag length" (see the 11-13 section). Until now the floor was 30 minutes everywhere, so a 10-minute break or a 5-minute roll call could not be written down at all.

## One unit is always the same height

Lowering the floor is not enough. At the old scale a 5-minute block is one sixth of a 30-minute cell — a sliver thinner than a fingertip. You could barely tap it, and grabbing its top or bottom edge to resize was out of the question.

So the grid stretches with the unit. One rule: **one unit is as tall as today's 30-minute cell.** A 15-minute unit doubles the grid; a 5-minute unit makes it six times taller.

![30-minute unit — one hour is two cells](/blog/timetable-schedule-unit/grid-30min.png)

![5-minute unit — the same cell height is now five minutes, and the axis labels every ten](/blog/timetable-schedule-unit/grid-5min.png)

Same timetable, same zoom. The axis labels get denser along with it.

| Unit | Grid scale | Axis label every | Tap on empty space creates |
|---|---|---|---|
| 30 min | 1× | 1 hour | 1 hour |
| 20 min | 1.5× | 1 hour | 40 min |
| 15 min | 2× | 30 min | 30 min |
| 10 min | 3× | 20 min | 20 min |
| 5 min | 6× | 10 min | 10 min |

The setting is the last row of the time group in the timetable's settings. Picking a value stretches the grid behind the sheet immediately.

![The event unit list — 5, 10, 15, 20, 30 minutes](/blog/timetable-schedule-unit/unit-choices.png)

Share images, print and the list preview cards use the same scale. Home screen widgets do not: a widget is where a whole day has to fit. Period-based timetables do not show the row, because there the period is the unit.

## Raising the unit never touches short events

Add a few 10-minute breaks at a 5-minute unit, then set the unit back to 30. What happens to them?

- **Stretch them to 30 minutes.** They would collide with their neighbours. A settings change must not rewrite events.
- **Ask in an alert.** That is the first option with a permission slip.
- **Leave them alone.** This is what shipped. A 10-minute event stays 10 minutes, and editing its title or color still saves. Its length can still be dragged on the grid, with handles outside the block and down to 5 minutes (see the 11-13 sections). It took three revisions to get there.

That choice reaches into the loader too. The app raises too-short events to a floor when it reads the file. If that floor were the timetable's unit, the next launch after raising the unit would silently lengthen events. The load floor is a fixed 5 minutes. A user-changeable setting is the wrong baseline for a load-time repair.

## The unit multiplies the zoom instead of joining it

The grid already had two scales — the edit zoom and a fit that stretches short timetables to the screen — and takes the larger. Adding the unit as a third candidate lost: when the fit wins, the unit's scale disappears and a 5-minute cell ends up shorter than a 30-minute cell used to be. The unit multiplies the result instead, so the guarantee comes from the order of the arithmetic.

Snapping did not change. Moving and resizing already snapped to 5 minutes, and drag-to-create now does too. The unit decides how short an event may be, not where it lands.

## The "at least 30 minutes" message carried its own number

The too-short message had "30" written into it, separately from the constant the check used. Changing only the check would have made a 10-minute timetable reject a 5-minute event while saying "at least 30 minutes". The check now hands its value to the message, which went through plural rules in all 18 languages.

## Where it stands

Verified on the iOS simulator: the settings row, the list, and the grid at 15 and 5 minutes. Not yet checked on a real device, iPad, or the folding iPhone at the 5-minute unit. The save file gained one value per timetable, so the Android app is being brought to the same key and version. A timetable left at 30 minutes writes exactly the file it wrote before.

## 2026-11-13 — Short events move; only their length is locked

The day before, events shorter than the unit could not be dragged at all: a block smaller than a fingertip cannot tell "grab the edge" from "grab the middle". Blocking the move as well turned out to be too much — moving a 10-minute break to another day meant opening the editor and changing day and time.

Now a short event **moves wherever you grab it**. Its edges moved it rather than resized it in this morning version; the afternoon version below added outside handles. In a multi-selection, one short event keeps the whole group to moving only.

![Dragging a 10-minute event — the start time sits above the finger, the end time below it](/blog/timetable-schedule-unit/short-move-pills.png)

While you drag, the start and end time pills used to sit 22pt above and below the block. On a long block your finger is in the middle and covers neither. On a 10-minute block both ended up under your fingertip. Resizing already pushed its pill 66pt away from the finger, so moving a short event now does the same: start pill 66pt above the finger, end pill 66pt below. If the block stops against another event and the finger keeps going, the pills return to the block once the finger is far enough away. Events of 30 minutes or more are unchanged.

![Tapping a short event selects it without handles and shows the notice](/blog/timetable-schedule-unit/short-select-toast.png)

(Morning version) The notice said the event can be moved but not resized by dragging; the afternoon version removed the notice. It appears on a tap, not while a long press is already moving the event — a "can't" message under a move that is working reads as wrong.

## 2026-11-13, afternoon — Resizing too: handles outside the block, down to 5 minutes

Resizing was blocked because a block smaller than a fingertip cannot tell "grab the edge" from "grab the middle". So the two now live in different places.

![A selected 10-minute event gets both handles outside the block](/blog/timetable-schedule-unit/short-outside-handles.png)

Select a short event and both resize handles sit **outside** the block. Anywhere on the block moves it; the 36pt bands above and below resize it. A 5-minute block is only 6pt tall, so the move zone is widened to 24pt around its center and the handles step out with it.

![Dragging the top handle all the way down stops at 5 minutes](/blog/timetable-schedule-unit/short-resized-5min.png)

The floor: "grow only" lost to "down to 5 minutes", the same floor as the event editor. Events at or above the unit keep the unit as their floor. Which rule applies is decided by the saved length, not the length mid-drag, so the bands never change under your finger. The time pill, multi-selection resizing and the save path all read the same rule, and the notice is gone in all 18 languages. The setting's name is the open question: it is no longer a floor for short events.

## History

- 2026-11-11 — Per-timetable event unit; one unit = one 30-minute cell
- 2026-11-13 — Short events: move allowed, length locked, time pills step out from under the finger
- 2026-11-13 (afternoon) — Short events resize: outside handles, 5-minute floor, notice removed
