---
title: "A locked timetable no longer opens Display settings from the day header"
date: 2026-10-09T17:09:31+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Display settings can delete events, yet the sheet opened even with the grid locked. Taps on the grid now shake the lock; coming from Settings, the app asks before unlocking."
---

The lock in SuperTimetable promises that events will not change. The Display sheet broke that promise: tapping the day header or the time axis opened it even on a locked grid, and shortening the visible hours there deletes events outside the range. The sheet now opens only on an unlocked timetable.

## The same "it's locked" is said differently per entry point

| Where you tapped while locked | What happens |
|---|---|
| Day header or time axis on the grid | No sheet. The lock shakes and ripples |
| The "Display" row in Settings | A confirmation. Unlock closes Settings, opens the lock, then raises the sheet |
| iPad menu bar, widget header | The same confirmation, over the grid |

![The confirmation over the Settings sheet says why the lock opens and that Undo and Redo will work.](/blog/timetable-display-sheet-unlock-gate/unlock-alert.png)

Cancel changes nothing. If you came from Settings, you stay in Settings.

## Why not one response everywhere

The rule is whether the lock is visible at that moment.

On the grid it sits right below your thumb. Long-pressing an event while locked already shakes it, and a header tap is the same kind of attempt. An alert there would fire on every stray tap while scrolling.

The Settings sheet covers the grid. A shaking lock behind it is invisible, and a row labelled "Display" that does nothing reads as broken. So the app asks, and the message carries two facts: events may be edited along with the display, and Undo and Redo can take it back.

Two alternatives lost:

- **Confirm everywhere.** Too heavy where one shake already says it.
- **Dim the row and menu item while locked.** A dimmed row cannot say why, and a widget deep link has nothing to dim.

## The unlock happens after Settings is gone

Unlocking at the moment of the tap would play the animation behind the Settings sheet. The order is: Settings goes down, the lock opens, the Display sheet comes up. The alert is attached to the Settings sheet's content, not to the grid underneath it; I did not want to rely on an `alert` on a covered view showing up over the sheet. That is why the two alerts keep separate state.

Unlike the lock button, this unlock does not turn a tapped event into a selection. The grid must not enter edit mode behind the sheet.

## Where it stands

The decision lives in one function, and an unknown entry point falls to "ask", not "block silently". The screenshot automation used to open this sheet from a locked grid, so it now unlocks first. The menu bar and widget paths still need a pass on a real device.
