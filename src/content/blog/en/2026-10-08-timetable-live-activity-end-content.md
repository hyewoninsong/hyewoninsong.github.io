---
title: "It looked like the Live Activity ignored the weekday. It was ending with stale content."
date: 2026-10-09T01:55:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
summary: "The class Live Activity showed an event from another weekday as in progress. The weekday filter was fine. The card was being ended with the content it already had. A day later the card was cut down to the one event in progress."
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

## 2026-10-09 — The card shows only the event in progress

After a day of use the complaint was different: the card is always there. Open the app once in the morning and the Lock Screen showed "next class starts" for hours, then the break, then "done for today". Showing the next event had made it an all-day card.

Now the card holds one thing: the event in progress, its end time and the time left. No event in progress, no card. The next-event line, the break state, the "done" state and its 15 minute grace are gone, and so is the view picking a state from the clock.

### Appear on its own, or leave on its own — pick one

Without server push, ActivityKit can neither start nor end a card while the app is not running.

| Option | Appears | Leaves | Dynamic Island |
|---|---|---|---|
| End it right after requesting (chosen) | When you open the app during a class | Exactly when the class ends | No |
| Keep it alive | When you open the app during a class | When you next open the app | Yes |
| Keep it alive, schedule the start | At class start, on its own | When you next open the app | Yes |

The chosen option calls `end(content, dismissalPolicy: .after(classEnd))` right after the request. An ended activity stays on the Lock Screen until that date and the system removes it. It also leaves the Dynamic Island immediately, so the card is Lock Screen only.

Both "keep alive" options leave the card up after class until the app is opened again, usually hours later. That is the original complaint. The scheduled start in iOS 26 fixes appearing and breaks leaving in the same way.

### Every card is now an ended card

The lesson above applies again: an ended activity cannot be fixed. The lookup that only saw live activities now sees everything not yet dismissed; otherwise every save would stack a new card on top of the visible one. There is no update path either. If the content changes, the old card is dismissed and a new one requested. Move the class to another day and there is no plan, so the card closes.

### Where it stands

The card only appears if the app is opened during a class. The planning logic is unit tested; whether an ended card keeps its timer running, leaves on time, and accepts a second `end` still needs a check on a device.

## History

- 2026-10-08 — first entry
- 2026-10-09 — card cut down to the event in progress, ended on request so it leaves at class end (Lock Screen only)
