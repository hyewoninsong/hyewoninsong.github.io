---
title: "One pill for a selected event, locked or not — no scope, tap to edit"
date: 2026-11-28T12:05:27+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The pill under the calendar grid said different things depending on the lock. It now shows the editor's own headline — time / length and repeat / period — and opens the editor when tapped."
---

Select an event in the calendar and the pill under the grid now reads the same whether the grid is locked or not: when it runs and for how long on the left, how it repeats and until when on the right. Tap it and that event's editor opens.

## Two answers for the same event

Until yesterday the pill depended on the lock. Unlocked, it showed the repeat pattern, the edit scope and the period, and opened a scope menu. Locked, it was a card with the title, pattern and time, plus a copy button and any memo. Each was half of what you want at a glance. The editor already had the right four facts in its two headline lines, so the pill now uses exactly those.

![Unlocked grid — previous/next occurrence buttons beside a pill reading '13:00 ~ 15:00 / 2 hr' and the repeat pattern with its period](/blog/timetable-selection-info-pill/pill-unlocked.png)

![Locked grid — the same pill, without the occurrence buttons](/blog/timetable-selection-info-pill/pill-locked.png)

## Scope left the pill

"This event / this and following / all events" took the most room and pushed the period into a short numeric form or onto a second line. It is also chosen elsewhere: tapping a recurring event asks for the scope before selecting it, and the editor's ✓ asks before saving. So the pill no longer shows or changes it.

## Tap to edit, unless locked

Tapping the pill takes the same path as tapping the selected block again: a sheet on iPhone, the centered editor on iPad. On a locked grid the lock shakes instead — the same refusal as editing a locked block. A read-only editor was considered and dropped: its close and save buttons are locked too, and it would break the app-wide rule that editing a locked grid is refused.

## Don't split the width in half

Equal columns clipped the period once the occurrence buttons took their space. The time column is always short, so it now takes only its own width and the period gets the rest, shrinking its text before it would ever drop anything.

## What's left

The locked calendar lost the old card's memo box and copy button; memos are read in the block and the editor. Timetables (not calendars) keep their locked card. Checked on the iPhone simulator only so far.
