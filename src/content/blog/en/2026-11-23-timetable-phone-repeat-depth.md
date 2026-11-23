---
title: "Repeat settings on iPhone now live one level down"
date: 2026-11-23T23:37:20+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The iPhone event editor used to stack every repeat control in one long column. Now there is a single Repeat row that states the current rule, and a screen behind it."
---

Open a calendar event on iPhone and you now see time, repeat, alert and notes on one screen. To change how it repeats, tap the Repeat row and go one level in. Before, every repeat control sat on the first screen, so reaching the notes field meant scrolling past a full month calendar.

## The wide layout already had the answer

On iPad and unfolded foldables the same form is two columns: time, alert and notes on the left; frequency, interval, weekdays, range and calendar on the right. Same content, yet it reads as simpler, because everything about repeating is in one place and nothing else is mixed in.

iPhone has one column, so the two groups were simply stacked. We now show only the left column and fold the right one into a row that pushes a screen inside the same sheet.

![First screen: a single Repeat row under the start and end times, showing the rule and date on two lines](/blog/timetable-phone-repeat-depth/repeat-row.png)

![The Repeat screen: frequency chips, interval, weekdays, range, calendar, and a one-line summary](/blog/timetable-phone-repeat-depth/repeat-screen.png)

## The row has to state the value

Move a setting inward and it can look like it was removed. The difference between "moved" and "gone" is whether the value is still visible. So the row carries two lines.

| Event | Top line | Bottom line |
|---|---|---|
| Weekly | Weekly on Mon | Start date – no end |
| Every four days | Every 4 days | Start – end |
| Does not repeat | Never | The event's date |
| No matching day in the range | Weekly on Tue | The reason, in red |

The last row matters. A rule with zero occurrences cannot be saved, so the confirm button is disabled. If the reason only appeared on the inner screen, the first screen would show a dead button with no explanation.

Joined with a middle dot, the two lines are exactly the summary at the bottom of the inner screen. One function produces both.

## One confirm button

The inner screen has only a back button. Edits made there go into the same draft, and the single confirm on the first screen saves everything. A second confirm inside would invite "I confirmed in there and it didn't save."

## What lost

- **A collapsible card.** Expanded, it is the long column again, and the user has to track which state it is in.
- **Keeping the date of a non-repeating event on the first screen.** That was the first plan. But two days earlier we had decided the date belongs in the same group as "Never" so the relation is visible, and pulling it out would split the phone layout from the wide one. The date is shown in the row and edited inside. Moving a one-off event's date costs one more tap. That is the price of this version.
- **Reusing the settings picker row.** That row picks one item from a list. This one opens a screen with several values.

## Where it stands

Checked on the iPhone simulator: the row, the inner screen, and the row after coming back. Folded foldables, dark mode, right-to-left languages and languages with long two-line values are still unverified.
