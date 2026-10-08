---
title: "The timetable from the store screenshots now ships inside the app"
date: 2026-10-08T11:17:08+09:00
app: "timetable"
tags: ["devlog", "design", "data"]
summary: "A fresh install now has two sample timetables in the list, marked (Sample) in the name and created in the phone's language. Why the mark is a name and not a flag, and the two checks the samples disturbed."
---

Open the app for the first time and the list already holds two sample timetables next to your empty one. They are the same two timetables the App Store screenshots show. Until now a fresh install was blank, and the only way to see what a full week looks like was to build one.

## The samples sit in the list; the first screen is still yours

| | First launch |
|---|---|
| List order | My Timetable → Siwoo (Sample) → Lia (Sample) |
| First screen | Your empty timetable |
| Language | Whatever language the app launched in |
| If deleted | They do not come back |
| Existing users | Not added |

A sample is an ordinary timetable. Edit it, delete it, or rename it and it is simply yours.

The data is the fixture we already use to capture store screenshots. It carried translations for all eight languages, and now the screenshot and the app show the same thing.

## The mark is in the name, not in the data

- **A sample flag on the model plus a badge.** Cleanest to look at. It also grows the save format and needs a rule for when a sample stops being one. After one edit? After a rename? Any answer needs explaining, and there is nowhere to explain it.
- **"(Sample)" appended to the name.** The save format is untouched. Every place that shows a name, from list cards to the widget picker to the shared file name, carries the mark for free. Everyone already knows how to remove it.

We took the name. It is also the reversible choice: a flag can be added later, but a field that has shipped in a save file is hard to take back.

Showing a sample as the first screen lost too. The first-run tutorial walks you through creating an event on an empty grid, and running it on a sample would mix your first event into someone else's week.

## Two checks that moved with it

**"Barely used."** A reinstall is offered an iCloud restore once, when the store holds at most one empty timetable. With samples there are three from the first second, so the offer would never appear, silently. We looked for count-based "new user" checks before adding the samples, excluded the samples from this one, and pinned it with a test.

**Which language.** The capture path reads `Locale.preferredLanguages` and falls back to the Korean source text. That is fine for captures, which only run in supported languages. On a German phone the app UI falls back to English while the samples alone would fall back to Korean. The first-run path uses `Bundle.preferredLocalizations`, the localization the app actually resolved. A fresh install on a German phone produced "Siwoo (Sample)" with "School" and "Math".

First run is decided by whether a save file exists, not by whether the list is empty. Otherwise anyone who deletes every timetable would get the samples again.

## Where it stands

New users now start at three timetables, so any statistic that buckets users by timetable count shifts on this date. Whether the mark should become a badge is something to decide after living with it.
