---
title: "The weak-note map came out of 'Study' and became the Stats tab"
date: 2026-09-22T17:10:00+09:00
app: "notequiz"
tags: ["devlog", "design", "swiftui"]
summary: "Seeing which notes you keep missing meant entering the Study screen first. The map moved to the Stats tab with each note's numbers spread right under it, the session list became its own tab, and the Study screen went away entirely."
---

SuperNoteQuiz's Stats tab is now a single staff map. Tap a dot and that note's record opens directly beneath it while the map stays put. Session-by-session history moved to a new Records tab.

![The Stats tab: colored dots on a staff map, a legend that spells out the thresholds, and the selected note's panel below it](/blog/notequiz-stats-map/stats-map-panel.png)

## Looking at something was buried inside doing something

The only picture of which notes are weak — the staff map — lived inside the Study screen. You reached it by tapping *Start studying* at the bottom of the Stats tab, and once there the map was a tool for picking cards to flip through. Checking where you're weak is looking, not doing, but it required starting a task first. Meanwhile the Stats tab was a session list: it told you how each round went, never which note keeps tripping you.

## One tab speaking in two units cuts both short

The first attempt pinned the map and the note panel to the top of the Stats tab and kept the session list below. Measured on an iPhone 17, the map (258pt) and the panel (~250pt) left about a row and a half for the list, and half of that row sat behind the floating tab bar.

So the split went along **the unit being counted**: Stats counts one note, Records counts one session. A third tab is a cost, but each screen now speaks in one unit.

![The Records tab: one row per session with date, range chip and question counts](/blog/notequiz-stats-map/records-tab.png)

## Tapping a dot doesn't move the map

A sheet was the easy option, and a sheet covers the map — if comparing two notes means opening and closing it, the original problem survives. A panel docked above the tab bar (the old structure) pushed the map up and clipped notes on far ledger lines.

The panel now sits inside the same card, right under the map, and only its contents change. Two rules follow:

- **A note is always selected.** The tab opens on the weakest note for that clef, and tapping the same dot again does not deselect — the map's tap is an assignment, not a toggle. An empty panel says nothing about what that space is for.
- **The panel's height never changes between notes.** A note with fewer than two timed questions still gets a same-height box explaining there's no trend yet, so the bottom of the card doesn't bounce as you browse.

The staff thumbnail is gone from the panel — the map an inch above already points at that position. The solve-time trend chart stayed, because one average can't answer "am I getting faster"; it just got shorter (56 → 44pt) and lost its dashed-average label, which the tile above already states.

## A green dot wearing an "often missed" badge

Dot color came from first-try rate (≥80% green, ≥50% orange, below that red). The badge in the panel used a *different* rule: missed at least once. A note answered 9 out of 10 could sit there as a green dot labeled "often missed," because two views were each deciding for themselves.

All of it now comes from one type (`NoteGrade`) — color, label, thresholds — read by the dot, the chip and the legend alike. And the thresholds are printed where the colors are:

| Verdict | Threshold (first-try rate) |
|---|---|
| Doing well | 80% or more |
| Shaky | 50–80% |
| Often missed | Below 50% |
| Too few | Under 3 questions — no rate claimed |
| Slow | Average ≥ 1.5× your median (3+ timed questions) |

A legend with names but no rule turns color into a vibe. Putting the rules in a help screen was considered; a rule that lives on another screen may as well not exist.

## Lifetime totals don't follow practice

Per-note stats count **the last 20 sessions only**. With lifetime totals, a note you missed twenty times six months ago stays red long after you can read it, and two good sessions vanish into a 100-question denominator.

Rather than adding a control for the window, it's fixed at 20 — and the legend's first line says so (`Dot color = first-try rate · Last 20 sessions`). Quietly changing what gets counted is how a statistic stops being trustworthy. The Records tab does the opposite and shows everything; there the question is "what did I play," so there's nothing to trim.

## Study isn't coming back

*Start studying* was the only way into the Study screen, so keeping the screen after removing the button leaves unreachable code. Moving the entry point to the toolbar was an option — that just adds a slot for a screen that wasn't being used. Seeing weak notes is the Stats tab's job now, and showing the answer while you read is already what the two reading stages in the practice ladder do. The deck builder, the multi-select mode on the map and ten strings went with it.

## Where it stands

There's no view of the full history: weakness older than 20 sessions drops off the map, and a window control would have to be designed if that turns out to matter. Session detail in the Records tab is unchanged, so there's still no jump from a missed note in one round to that spot on the map.
