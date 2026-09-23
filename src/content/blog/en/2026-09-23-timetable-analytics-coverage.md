---
title: "The event list looked complete. Four features weren't being counted."
date: 2026-09-23
app: "timetable"
tags: ["devlog", "data"]
summary: "Auditing SuperTimetable's analytics for 'can we actually learn something from this'. All 31 events were registered in GA4 — and the tutorial, printing, the alarm permission prompt and every failure path had zero events. The gaps show up in the feature list, not the event enum."
---

SuperTimetable sends 31 analytics events, and as of this morning every parameter on them is registered as a GA4 custom dimension. So when the question came — "is there anything to add so the stats are meaningful?" — the first answer was almost no. Everything being sent was readable. The problem was what wasn't being sent.

## Count from the feature list, not the enum

An event enum is a list of things someone once decided to count. What nobody decided to count isn't in it. So the audit walked the app's features instead: every sheet, every permission prompt, every export path, every failure alert, counting `logEvent` calls at each entry point.

| Feature | Events | Question we couldn't answer |
|---|---|---|
| First-run tutorial | 0 | Which step do people quit on? |
| Print (a whole module with paper, N-up and grayscale options) | 0 | Does anyone print? How often does vector output silently fall back to bitmap? |
| Alarm permission prompt | 0 | What fraction get blocked at the first gate of the alarm feature? |
| Failure paths | one `error_occurred` call in the entire app | What fraction of import attempts fail? |
| User properties | `setUserProperty` never called | Do people with many timetables retain better than people with one? |

The tutorial is the first ninety seconds of every new user. Nothing there was being counted.

## A funnel is four events

The tutorial got `tutorial_begin` → `tutorial_step_reached` → `tutorial_complete`, plus `tutorial_skipped`. The first and last of the main three are GA4 recommended event names, so the console groups them into built-in reports for free.

The important part: one `tutorial_step` parameter is shared, with the same vocabulary, by *reached* and *skipped*. That is what lets a single dimension read "how far they got and where they left". Split it into `reached_step` / `skipped_step` and every report needs two columns lined up by hand. A contract test forbids sharing parameter names across events, so this one went onto the intentional-sharing list.

The events fire from the state machine, not the views. Every step transition happens inside `TutorialState`, including the one where a window-width change switches the course and silently skips a step — the views never see that one. And `tutorial_begin` is the Start button, not the welcome card appearing; showing a card isn't something the user did.

## Crashlytics is the cause; analytics is the rate

Import failures already went to Crashlytics as non-fatals, which tell you exactly which file broke and why. What they can't tell you is what fraction of import attempts fail, because successes never reach Crashlytics. So every failure branch now also logs `error_occurred`: render and write failures on image export, encode failure on file sharing, read and decode failures on import, the PDF-to-bitmap fallback on print. Values are fixed words like `render_failed`, never messages.

Alarm permission can only be logged where the prompt state is known. The caller gets a single Bool and can't distinguish "asked and granted" from "already denied and tried anyway". The latter is counted separately as `already_denied`, because that number is both feature demand and the count of people blocked by one setting.

## User properties, bucketed

`timetable_bucket` (0 / 1 / 2-3 / 4-9 / 10+), `schedule_bucket` (0 / 1-9 / 10-29 / 30-79 / 80+), `alarm_user` (true / false). Raw counts have unbounded cardinality and can't be a dimension. These attach to the user rather than an event, so every report can be split by who the user is. They sync on launch and on backgrounding, and the labels are pinned by a test — change a registered vocabulary and old and new values land in the same column.

## Where it stands

Ten new event-scoped dimensions and three user-scoped ones are registered and read back. The registration spec lives in the repo so the next event gets registered in the same PR as its code — registration isn't retroactive, and "later" is exactly that much of a hole. Reports take a day or two to fill.
