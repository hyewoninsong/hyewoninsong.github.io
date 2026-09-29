---
title: "The keyboard covered the notes field it opened"
date: 2026-09-29T18:54:50+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Schedule notes are no longer typed in place. Tap the notes card and a composer floats just above the keyboard, so what you type is always visible."
---

In SuperTimetable, schedule notes are now typed in a composer that floats right above the keyboard. The notes field used to sit at the bottom of the edit sheet, and the keyboard rose straight over it — you couldn't see what you were typing.

## The card shows, the composer types

| Where | What it does |
|---|---|
| Notes card in the sheet | Shows the note (4–8 lines). Tap to open the composer |
| Composer above the keyboard | Starts at one line, grows to six. Round blue button saves |
| Outside the composer | Tap to put the text into the card and close |

The composer is a chat-style input: a fully rounded card, 12pt clear of the keyboard and the screen edges so it reads as floating rather than part of the keyboard. It borrows the shape from our planner app, which already takes block notes this way.

![Typing three lines — the composer sits above the keyboard and every line is visible.](/blog/timetable-memo-composer/composer-typing.png)

However the composer closes — save button, outside tap, or the sheet going away — the text lands in the schedule's draft. Saving or discarding the schedule is still up to the sheet's checkmark and X.

![After closing: the notes card holds the three lines.](/blog/timetable-memo-composer/memo-card-after.png)

## Move the input, not the field

The obvious fix was to scroll the field above the keyboard on focus (`ScrollViewReader.scrollTo`). But the field grows line by line, so the scroll target keeps moving, and on iPad the editor is a popover that shrinks when the keyboard appears. Shrinking the sheet instead would shove the day and time cards around. Pinning the input to the keyboard makes all of that moot: wherever the keyboard is, the composer is right above it.

## Where it stands

Verified on the iPhone simulator end to end. The iPad popover gets a real-device look in the next build.
