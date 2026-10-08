---
title: "One event, four ways of showing its color. Now it is a single dot."
date: 2026-10-08T23:25:00+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "The class Live Activity used a color stripe, the alarm card a full color background, the watch card a colored ring. All of them now use one filled dot before the title, and the Live Activity shows the current and next event, each with its own dot."
---

The class card on the Lock Screen now shows the event in progress and the next one on two lines, each with a dot in that event's color. The alarm card and the Apple Watch app use the same dot.

## The same color had four shapes

Inside the timetable grid, an event's color is the block itself. Outside the grid, every new surface picked its own shape.

| Surface | Before | After |
|---|---|---|
| Class Live Activity | 4pt stripe on the left edge; next event was a gray line of text | Current line and next line, each with its own dot |
| Alarm Live Activity | Whole card filled with the event color | System background, dot before the title |
| Alarm Dynamic Island (compact) | Alarm symbol tinted with the event color | Dot |
| Watch app cards | Colored ring gauge and a faint colored background | Dot before the title, neutral background |
| In-app ringing banner | No color | Dot before the title |

Each choice made sense alone. Once the class card and the alarm card could sit next to each other on the Lock Screen, the same math class was a stripe in one and a background in the other.

![Watch app: the in-progress card and the next card, each with a color dot before the title](/blog/timetable-schedule-color-dot/watch-cards-dot.png)

## Two lines on the class card

A stripe exists once per card, so the next event had no place for its color. A dot can go on every line: a larger one for the current event, a slightly smaller one for the next. Lines without a dot are indented by the dot column so the text lines up. The data sent to the card did not change; the next event's color was already there.

## What lost

- **Keep the color background and add a dot.** A dot on its own color is invisible, and outlining it makes a ring.
- **Count the watch ring as "a circle".** The ring carries progress. Asking it to carry color too leaves two grammars on one screen, since the list below already uses filled dots.
- **Keep the alarm symbol in compact, drop its tint.** Then the color is gone from the Dynamic Island. The event title sits right next to the dot, which is enough.

The dot won because it is the smallest thing that works: one per line, and no demand on the background, so it sits on whatever material the system draws.

## What it cost

The watch cards no longer show class progress. The time range is still there, and the watch face complication keeps its ring. The alarm card gave up its full-color presence, reversing a choice made when it was the only card of ours on the Lock Screen.

## Where it stands

Home and Lock Screen widgets keep their color stripes for now; tinted widget modes drop color and keep only alpha, so they need their own pass. The watch screen was checked in the simulator. The Lock Screen and Dynamic Island still need a look on a real device.
