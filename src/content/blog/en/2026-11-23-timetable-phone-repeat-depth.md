---
title: "Repeat settings on iPhone now live one level down"
date: 2026-11-24T00:25:49+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The iPhone event editor used to stack every repeat control in one long column. Now there is a single Repeat row that states the current rule, and a screen behind it."
---

Open a calendar event on iPhone and you now see time, repeat, alert and notes on one screen. To change how it repeats, tap the Repeat row and go one level in. Before, every repeat control sat on the first screen, so reaching the notes field meant scrolling past a full month calendar.

## The wide layout already had the answer

On iPad and unfolded foldables the same form is two columns: time, alert and notes on the left; frequency, interval, weekdays, range and calendar on the right. Same content, yet it reads as simpler, because everything about repeating is in one place and nothing else is mixed in.

iPhone has one column, so the two groups were simply stacked. We now show only the left column and fold the right one into a row that pushes a screen inside the same sheet.

![First screen: a single Repeat row under the start and end times, showing the rule and date on two lines](/blog/timetable-phone-repeat-depth/repeat-row.png)

![The Repeat screen as of Nov 23: frequency chips, interval, weekdays, range, calendar. The summary was a single line at the bottom then; it moved to the top a day later](/blog/timetable-phone-repeat-depth/repeat-screen.png)

## The row has to state the value

Move a setting inward and it can look like it was removed. The difference between "moved" and "gone" is whether the value is still visible. So the row carries two lines.

| Event | Top line | Bottom line |
|---|---|---|
| Weekly | Weekly on Mon | Start date – no end |
| Every four days | Every 4 days | Start – end |
| Does not repeat | Never | The event's date |
| No matching day in the range | Weekly on Tue | The reason, in red |

The last row matters. A rule with zero occurrences cannot be saved, so the confirm button is disabled. If the reason only appeared on the inner screen, the first screen would show a dead button with no explanation.

The inner screen shows the same two lines as its summary. One function produces both. (In the first version that summary was one line below the calendar; it moved to the top the next day, see the Nov 24 section.)

## One confirm button

The inner screen has only a back button. Edits made there go into the same draft, and the single confirm on the first screen saves everything. A second confirm inside would invite "I confirmed in there and it didn't save."

## What lost

- **A collapsible card.** Expanded, it is the long column again, and the user has to track which state it is in.
- **Keeping the date of a non-repeating event on the first screen.** That was the first plan. But two days earlier we had decided the date belongs in the same group as "Never" so the relation is visible, and pulling it out would split the phone layout from the wide one. The date is shown in the row and edited inside. Moving a one-off event's date costs one more tap. That is the price of this version.
- **Reusing the settings picker row.** That row picks one item from a list. This one opens a screen with several values.

## Where it stands

Checked on the iPhone simulator: the row, the inner screen, and the row after coming back. Folded foldables, dark mode, right-to-left languages and languages with long two-line values are still unverified.

## 2026-11-24 — The inner screen, tidied: the result on top, the end date in one card

Once the repeat controls had their own screen, its order stood out. Tapping a chip changes the sentence that states the rule, but that sentence sat below the calendar, off screen. Four changes, layout and wording only.

![Before: the summary is the last line under the calendar; the range presets and the start/end cells are separate](/blog/timetable-phone-repeat-depth/tidy-before.png)

![After: the rule and its range on top, the interval spelled out, a name above the weekday chips, and start, end and presets in one card](/blog/timetable-phone-repeat-depth/tidy-weekly.png)

| What | Before | After |
|---|---|---|
| Summary | One grey line under the calendar | Two lines on top: the pattern in bold, the range under it |
| Until when | A presets card plus two start/end cells | One card: a start row, an end row, presets under the end row |
| Interval of 1 | "Interval · Weekly" | "Interval · Every 1 week" |
| Unnamed rows | Weekday chips and the month grid alone | "Weekday" and "Months" above them |

A sentence that changes with every tap belongs above the controls. Presets are shortcuts for the end date, so they hang off the end row; before, "No end" was stated twice, once as a chip and once in the end cell. Tapping a row makes the calendar edit that end, marked by a grey capsule on its value. That mark is quieter than the old outlined cell, which is the cost of this version.

![Yearly: a "Months" name above the month grid](/blog/timetable-phone-repeat-depth/tidy-yearly.png)

On process: the four options were first offered as text, and the answer was "show me a screenshot of each." So all four variants went into one build behind a launch flag and one test run captured each next to the current screen. What was ambiguous in words was obvious in pictures, and all four shipped.

Checked on the iPhone simulator for weekly, monthly, yearly, daily and never. iPad two-column, dark mode, right-to-left and long-string languages are still unverified.

## History

- 2026-11-23 — Repeat settings moved behind a Repeat row on iPhone.
- 2026-11-24 — Inner screen tidied: summary on top, start/end/presets in one card, interval spelled out, names for the weekday and month rows.
