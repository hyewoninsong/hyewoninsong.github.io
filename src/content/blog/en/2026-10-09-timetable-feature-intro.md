---
title: "We drew the first-run tour instead of recording it"
date: 2026-10-09T20:54:19+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "On first launch, a phone-shaped mockup now demonstrates four things SuperTimetable can do. No video files and no real grid inside it — one clock and keyframes."
---

Open SuperTimetable for the first time and, before the empty timetable, you now get a four-page tour. Inside a phone-shaped frame a finger creates an event, moves it, recolors it and switches timetables, while a line underneath says what is happening. The hands-on tutorial comes after.

## Show what the app can do before asking anyone to try it

The old first run was an empty grid with a "start the tutorial?" card. The tutorial teaches by doing, which sticks, but it never tells you that you can make your own colors, lay a timetable out by class period, or keep several timetables. So the order is now tour, then tutorial.

| Page | What it shows |
|---|---|
| 1 | Drag to add → move → resize → duplicate → delete → undo → redo |
| 2 | Pick an event, change its color, create a custom color |
| 3 | By time ↔ by period |
| 4 | Add a timetable from the list and switch to another |

![Pages 1 and 2 — a finger moving a new event, and dragging along a hue bar to make a custom color. A numbered line under the mockup describes the current action](/blog/timetable-feature-intro/pair-edit-style.png)

There are two buttons, Back and Next, and no Skip. Four pages take seconds, and a Skip button gets pressed on page one. Back is dimmed on the first page rather than hidden, so Next never changes position.

## Not video, not the real grid

- **Bundle recorded videos.** We already record a store preview, but eight languages times four pages is thirty-two clips in the app, re-recorded whenever a screen changes, and again for dark mode.
- **Embed the real grid view.** Honest, but that view drags in the store, gestures and toolbars, and a demo would have to write sample data into the user's saved file.
- **Draw it.** This is what we did. The phone screen is a single 320×640 coordinate space; headers, axis, blocks, buttons, the color panel and list cards are drawn at absolute positions and the whole thing is scaled to fit.

Because the drawing reads the app's own strings and colors, it follows the language and dark mode for free. Nothing is written to the user's data.

![Pages 3 and 4 — the timetable switched to period layout, and a third card appearing in the timetable list](/blog/timetable-feature-intro/pair-kinds-list.png)

## One clock, everything else a function of time

Finger position, press ring, growing block, button flash, color blend, caption — chaining separate animations drifts a little more every loop. Each scene instead takes one number, seconds since the page started, and computes the whole picture from keyframes. Page 1 fits seven actions into a 16.4-second loop, and each caption starts at the same timestamp as the finger movement it describes, so text and motion cannot fall out of step.

## One snag

A UI test that pages through to the tutorial could not find the Next button. An accessibility identifier on the full-screen container was overriding the identifiers of the buttons inside it. Removing the container's identifier fixed it.

## Where it stands

The tour appears automatically only on a fresh install. For now there is also a "Replay Feature Tour" row in the menu, behind a build flag, while we polish it. The mockup does not reuse real views, so if the app's layout changes a lot the drawing has to be updated by hand — the cost of the route we chose.
