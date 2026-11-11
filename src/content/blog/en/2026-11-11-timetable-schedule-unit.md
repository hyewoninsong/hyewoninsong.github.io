---
title: "To allow 5-minute events, the grid had to grow six times taller first"
date: 2026-11-11T14:31:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Each timetable now picks its event unit: 5, 10, 15, 20 or 30 minutes. One unit is always as tall as today's 30-minute cell, so a 5-minute block can still be tapped, dragged and resized."
---

Each timetable in Super Timetable now has an **event unit**: 5, 10, 15, 20 or 30 minutes. The unit is the shortest an event can be in that timetable. Until now the floor was 30 minutes everywhere, so a 10-minute break or a 5-minute roll call could not be written down at all.

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
- **Leave them alone.** This is what shipped. A 10-minute event stays 10 minutes, and editing its title or color still saves. Only changing its length applies the new floor: it can grow, it cannot shrink.

That choice reaches into the loader too. The app raises too-short events to a floor when it reads the file. If that floor were the timetable's unit, the next launch after raising the unit would silently lengthen events. The load floor is a fixed 5 minutes. A user-changeable setting is the wrong baseline for a load-time repair.

## The unit multiplies the zoom instead of joining it

The grid already had two scales — the edit zoom and a fit that stretches short timetables to the screen — and takes the larger. Adding the unit as a third candidate lost: when the fit wins, the unit's scale disappears and a 5-minute cell ends up shorter than a 30-minute cell used to be. The unit multiplies the result instead, so the guarantee comes from the order of the arithmetic.

Snapping did not change. Moving and resizing already snapped to 5 minutes, and drag-to-create now does too. The unit decides how short an event may be, not where it lands.

## The "at least 30 minutes" message carried its own number

The too-short message had "30" written into it, separately from the constant the check used. Changing only the check would have made a 10-minute timetable reject a 5-minute event while saying "at least 30 minutes". The check now hands its value to the message, which went through plural rules in all 18 languages.

## Where it stands

Verified on the iOS simulator: the settings row, the list, and the grid at 15 and 5 minutes. Not yet checked on a real device, iPad, or the folding iPhone at the 5-minute unit. The save file gained one value per timetable, so the Android app is being brought to the same key and version. A timetable left at 30 minutes writes exactly the file it wrote before.
