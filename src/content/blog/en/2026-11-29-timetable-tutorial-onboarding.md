---
title: "Two tutorials instead of one: first install starts at the + button, replay covers editing only"
date: 2026-11-29T02:16:38+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "A fresh install now opens on an empty home and walks you to the + button to create your first timetable or calendar. Replay skips that and runs only the ten editing steps."
---

A fresh install now opens on an empty home screen. The guide points at the + button, you create your first timetable or calendar yourself, and only then does it teach creating and moving events. Replay covers that second half only.

## The first screen is home, not a grid

The app used to create a "My Timetable" for you and start the tutorial on its grid. That stayed true after the home screen and the four-step creation sheet arrived, so nobody was ever shown how to make a document, and calendars never appeared in the first run at all.

| When | What the guide covers |
|---|---|
| First install | Empty home → welcome card → ring and finger on + → creation sheet → editing steps on the new document |
| Replay | Create → move → resize → edit → duplicate → delete → undo → redo → settings shortcut → lock |
| From a calendar's month view | One extra step first: open a week |

![An empty home with a coach card and a ring on the + button](/blog/timetable-tutorial-onboarding/home-add-step.png)

During the + step, "Import from File" is disabled. Imported timetables open locked, which would break the very next instruction.

Once the document exists, the card moves onto it and the counter continues from step 2.

![The new timetable's grid with the step 2 card and a create demo](/blog/timetable-tutorial-onboarding/grid-create-step.png)

## Two things replay no longer does

Replay means "show me the gestures again." Asking you to create a document each time would leave a new one behind on every replay, so the + step is first-install only.

The old tutorial also opened the settings sheet first to pick days and hours. The creation sheet asks that now, so the duplicate step is gone.

## On a calendar, opening a week is the first gesture

Calendars open in month view; the editable grid is the week you tap into. Replay from month view used to jump to a week automatically, which skipped the one thing you need to know. Now the card sits on the month and a ring marks one week row. Tap any date and the tutorial continues in week view.

![Month view with an "Open a Week" card and a ring around one week row](/blog/timetable-tutorial-onboarding/month-open-week.png)

Where month and week are already side by side, such as a landscape iPad, the step is dropped before it starts.

## What lost

- **Keep the pre-made timetable and still point at +.** It asks you to make a second one for no reason.
- **Start on the grid and mention + at the end.** The guide would bounce between two screens.
- **Finger demos inside the creation sheet.** It asks one thing per page and explains itself.

## What tripped us up

The step counter. "Open a week" exists on some layouts and not others, and removing it after you have passed it turns "step 3 of 11" into "step 2 of 10". It can now only be removed before you reach it.

Three screens read the same progress: home, month view and the grid. A step that none of them claims is invisible while its control locks still apply, so every new step is assigned to exactly one screen.

## Where it stands

Checked on screen on iPhone from a fresh install through week view. The iPad two-pane layout and right-to-left languages have not been looked at yet.
