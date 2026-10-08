---
title: "It looked like the Live Activity ignored the weekday. It was ending with stale content."
date: 2026-10-08T12:25:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
summary: "The class Live Activity showed an event from another weekday as in progress. The weekday filter was fine. The card was being ended with the content it already had."
---

Move a class that is in progress to another day and the lock screen card now closes right away. Before, the card kept saying "in class" until the moved event would have ended.

## The report said "it ignores the weekday"

A day after shipping a Live Activity that shows the current class and time left, we got this: it seems to look only at the time, not the day. An event at the same time on another weekday shows as in progress.

The weekday filter was the obvious suspect, and it was there from the start. Everything the card shows comes from one shared "events for today's weekday" function. Nothing from another day could enter the plan.

## The leak was in ending, not planning

The card holds the rest of today's events, and the view picks "in class" or "break" from the current time. The app rebuilds the plan on every save: update the card if events remain, end it if none do.

The ending code assumed one reason for being there: the day is over. So it ended the activity with the content it already had and a dismissal 15 minutes after the last class. That is correct when time brought us there.

There is a second way in. Move or delete the class that is in progress, and today's remaining events also drop to zero. The old content still contains that event, so the view keeps resolving to "in class".

| Why we are ending | Events in the old content | Card |
|---|---|---|
| Time passed, day is over | All finished | "Done for today" |
| The current event was moved or deleted | One still unfinished | Still "in class" |

## An ended activity cannot be fixed

The first argument of `Activity.end(_:dismissalPolicy:)` is the final content, and with `.after(date)` it stays on the lock screen until that date. An ended activity no longer takes `update`. End it with the wrong content and it stays wrong until the dismissal date.

## Build the final content from current data

The final content is now rebuilt from today's saved events, not copied from the card. It contains only events that have already finished, so the view always resolves to "done". If nothing has finished today, or the 15 minute grace has passed, the card ends immediately.

We also re-plan every time the app becomes active. Before, that happened only at launch and on save, so a process that stayed alive across midnight kept yesterday's card.

## Why we missed it

Only the planning function was tested. The choice of final content was a single argument to a system call. That choice is now a pure function with a test for "move the class while it is in progress". The lesson for any function called on save: its "nothing left to do" branch is reached by time passing and by data changing, and it has to be right for both.

## Where it stands

The logic is covered by unit tests; the lock screen behavior still needs a check on a device. Adding a new event during the 15 minute "done" window still shows a second card.

## History

- 2026-10-08 — first entry
