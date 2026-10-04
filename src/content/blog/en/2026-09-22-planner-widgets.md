---
title: "The widget doesn't get to open the database"
date: 2026-09-22
app: "daily-planner"
tags: ["devlog", "swiftui", "data"]
summary: "Adding two home screen widgets meant deciding first whether they share the app's store. They don't — the app drops a small file with exactly what the widgets draw, and that's all they read."
---

Daily Planner has two home screen widgets now. **Now** shows a line across the current time, with what just finished above it and what's next below. **Activity** grows a grid for one todo, by day, week, or month. Both are shrunken versions of screens the app already had, so most of the work wasn't drawing — it was deciding **how a widget gets to see the data**.

## A widget is a different process

An app and its widget look like one thing and are not. They're separate processes in separate sandboxes, and they can't read each other's files unless you open a shared container — an App Group — between them.

That's where the fork is. Planner's data lives in a SwiftData store that syncs over iCloud. Letting the widget open that same store means two things.

First, the store file has to **move** into the shared container. That's a one-time file move on the device of someone already using the app, and if it fails, the screen says "brand new app." It looks like the data is gone. The path that opens the store already has several fallbacks for when things go wrong; this would add one more step that can't be undone.

Second, the widget process would have to bring up iCloud sync too. Widget processes have a tight memory budget, and when sync fails to attach it fails **quietly** — nothing appears on screen.

## What the widgets actually needed was small

So I counted from the other side. What do these two widgets actually draw?

- **Now**: a handful of today's and tomorrow's blocks — title, color, start and end, done or not.
- **Activity**: per todo, how many minutes on each day.

That's it. No relationships, no alarms, no undo, no drawer. There was no reason to hand over the whole database.

So instead: **every time the app writes, it drops one small file into the shared container, and the widget reads only that.** The widget knows nothing about SwiftData or iCloud. It decodes a file.

There's exactly one place that writes it. It runs *after* the save lands on disk, and since one user action often triggers several saves, it coalesces them into a single write 0.4 seconds later. Only then does it wake the widgets — the other order makes them re-render from the old file. Changes that don't go through the store get their own doors: switching profiles, going to the background, launching.

What goes in matches what the app shows: the current profile only, nothing parked in the drawer, and history only as far back as the monthly grid can display. Older than that appears in no grid, so it isn't worth carrying.

**The cost is explicit.** A change made on another device reaches this device's widget only after the app is opened here, because it's the app that rewrites the file. For an app you open at least once a day, that's a fair trade.

## The same grid nearly grew in two colors

The widget's grid has to be the *same picture* as the app's. When a cell darkens, whether a column is a week or a month, whether today's cell gets an outline — one difference and the same record looks like two different things.

So rather than copying the math, **both targets compile the same files**. Bucketing, grid construction, cell levels, cell color — one copy. The app's grid now calls the same functions.

One place almost slipped through. With no todo selected, the widget was drawing the combined grid in the first todo's color, while the app uses the profile color. Same picture, different color. The profile color now rides along in the file.

## One line of date formatting opened yesterday

Tapping a widget opens that spot in the app, which means putting a date in a URL. That's where a day went missing.

There's a formatter that writes a date in the standard format. I used it directly.

```swift
// wrong
midnight.formatted(.iso8601.year().month().day())
```

**That formatter defaults to GMT.** In Korea, midnight on September 22 is 15:00 UTC on September 21 — so the line wrote `"2026-09-21"`. The other side read that string back as a local date, and tapping the widget opened **yesterday**.

The nasty part is that it's wrong differently depending on where you are. West of UTC, midnight lands on the *next* UTC day and the date shifts forward instead. It reproduces on some machines and not others. A similarly named formatter (`.dateTime`) defaults to local time, so mixing the two makes it even harder to see where the shift came from.

**When you're carrying just a date, don't hand it to a formatter — write the local calendar's year, month, and day yourself.** A round-trip test caught it before the commit.

## A stale file pretending to be today

One more. The file holds "today and tomorrow." If the app isn't opened for three days, that file still sits there holding a three-day-old today. Without a filter, a three-day-old block lands at the top of the widget as "just finished."

The code that picks what to show now drops anything that isn't today or tomorrow first. When the file is stale, the widget says "nothing scheduled today" — better to say nothing than to say something wrong.

## Where it stands

Both widgets show up in the gallery, and a block created in the app appears within seconds. Nothing is interactive yet — they only read. Since a widget is only visible once it's on a home screen, previews for each state ship alongside the code, so there's somewhere to look while working on them.
