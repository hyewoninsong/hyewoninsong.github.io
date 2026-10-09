---
title: "It looked like the Live Activity ignored the weekday. It was ending with stale content."
date: 2026-10-09T20:02:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
summary: "The class Live Activity showed an event from another weekday as in progress. The weekday filter was fine. The card was being ended with the content it already had. A day later the card was cut down to the one event in progress, and that evening the feature was removed."
---

A class in progress was moved to another day, and the lock screen card kept saying "in class" until the moved event would have ended. This post records that fix. By the end of it the card itself is gone: the app no longer has a class Live Activity.

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

### What was left then

The card only appeared if the app was opened during a class. A device check was still pending, and it never got that far.

## 2026-10-09, evening — The card is gone

After half a day with the smaller card, the feature was removed: the Settings toggle, the card, and the planning code behind it. The alarm card that appears on the Lock Screen before an alarm fires is a separate feature and stays.

The reason is short. A card that stays on the Lock Screen is the annoyance. That morning the complaint was read as "it is there all day", so the card was narrowed to class time. A class still runs one to three hours, and the same card sits on top every time the screen wakes. The person sitting in the class already knows which class it is.

### What the card was answering

The morning's table only compared when the card appears and when it leaves. Removing it was not a row. The better first question is what the card answers that nothing else does.

| Question | Already answered by |
|---|---|
| What is next and when | Lock Screen widget, Watch complication |
| What is in progress now | The same widget and the Watch app show the event in progress |
| Tell me it is about to start | The event alarm |

A widget sits where the user put it. A Live Activity is inserted at the top of the Lock Screen by the app. With the same information, the inserted one loses.

### What moved

The color dot view lived in the class card's file but the alarm card used it too, so it got its own file. A test that pins the Watch card's color dot was also living in the class card's test file and moved next to the alarm card tests. Check for tenants before deleting a file.

Devices with a card on screen at update time needed nothing. Every card had been ended on request to leave at class end, so the system removes it without any code in the new build.

The ActivityKit lesson above still holds for the alarm card: an ended activity cannot be fixed.

## History

- 2026-10-08 — first entry
- 2026-10-09 — card cut down to the event in progress, ended on request so it leaves at class end (Lock Screen only)
- 2026-10-09 — removed the feature that evening; a persistent card was the problem, and widgets and the Watch already carry the same information
