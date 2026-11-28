---
title: "One pill for a selected event, locked or not — no scope, tap to edit"
date: 2026-11-28T18:33:12+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The pill under the calendar grid said different things depending on the lock. It now shows the editor's own headline — time / length and repeat / period — and opens the editor when tapped."
---

Select an event in the calendar and the pill under the grid now reads the same whether the grid is locked or not: how it repeats and until when in one column, when it runs and for how long in the other. Tap it and that event's editor opens.

## Two answers for the same event

Until yesterday the pill depended on the lock. Unlocked, it showed the repeat pattern, the edit scope and the period, and opened a scope menu. Locked, it was a card with the title, pattern and time, plus a copy button and any memo. Each was half of what you want at a glance. The editor already had the right four facts in its two headline lines, so the pill now uses exactly those.

The two captures below are from the first version, with the time column on the left; the columns were swapped that night (see the end).

![Unlocked grid — previous/next occurrence buttons beside a pill reading '13:00 ~ 15:00 / 2 hr' and the repeat pattern with its period](/blog/timetable-selection-info-pill/pill-unlocked.png)

![Locked grid — the same pill, without the occurrence buttons](/blog/timetable-selection-info-pill/pill-locked.png)

## Scope left the pill

"This event / this and following / all events" took the most room and pushed the period into a short numeric form or onto a second line. It is also chosen elsewhere: tapping a recurring event asks for the scope before selecting it, and the editor's ✓ asks before saving. So the pill no longer shows or changes it.

## Tap to edit, unless locked

Tapping the pill takes the same path as tapping the selected block again: a sheet on iPhone, the centered editor on iPad. On a locked grid the lock shakes instead — the same refusal as editing a locked block. A read-only editor was considered and dropped: its close and save buttons are locked too, and it would break the app-wide rule that editing a locked grid is refused.

## Don't split the width in half

Equal columns clipped the period once the occurrence buttons took their space. The time column is always short, so it now takes only its own width and the period gets the rest, shrinking its text before it would ever drop anything.

## What's left

The locked calendar lost the old card's title (its memo box and copy button came back the same evening, below). Timetables (not calendars) keep their locked card. Checked on the iPhone simulator only so far.

## Evening update — memo and copy are back when locked

The first version dropped the memo box and copy button from the locked calendar. People who keep the calendar locked use the memo to know where to go and the copy button to send an event to a group chat, so both came back. The pill itself is unchanged. Memos sit in a glass card above it, using the old boxes, and copy is a round button to its right. Putting either inside the pill would have made its height vary per event and mixed its tap target (open the editor) with copy.

![Locked calendar — memo card above the pill, copy button on the right](/blog/timetable-selection-info-pill/pill-locked-memo.png)

## Night update — the pill shows while the scope menu is open, and the date comes first

Tapping a recurring event opens a small menu beside the block asking which events you mean. The pill used to appear only after you answered, which is backwards: the repeat pattern and end date are what you need to answer. It now shows while the menu is open.

![Scope menu open — the pill below already reads 'Weekly on Mon, Tue, Thu / Nov 23, 2026 ~ Jan 17, 2027' and '11:00 ~ 12:00 / 1h'](/blog/timetable-selection-info-pill/pill-with-scope-menu.png)

In that state the pill is read-only: no previous/next buttons, and a tap passes through to the grid and closes the menu instead of opening an editor with no scope chosen.

The columns also swapped, so the date side comes before the time side, the way people say it. Rather than keep a hand-written list of languages, the app reads the order from the system's own date-and-time format for the current locale. Of the 18 languages the app ships, only Vietnamese writes the time first, so only there does the time column lead. Arabic and Urdu keep the same order and simply start from the right.
