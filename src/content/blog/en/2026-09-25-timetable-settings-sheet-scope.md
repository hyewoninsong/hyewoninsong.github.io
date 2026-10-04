---
title: "We merged, split, and re-merged the settings sheet in ten days"
date: 2026-09-25T18:00:00+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Should app-wide settings and per-timetable settings share a sheet? We changed the answer three times. The final answer is both: one sheet from the menu, a quick sheet from the grid."
---

The `…` menu in SuperTimetable now has a single "Settings" row. The sheet it opens has two areas: on top, values that apply to every timetable (appearance, time format, current-time line); below a hairline, values for the timetable you are looking at (displayed days, start/end hour, schedule text color). The "Display" sheet you get by tapping the day header or the time axis is still there, but it only carries the days and hours cards.

## What changed

![Settings sheet — everything above the line is app-wide, everything below is this timetable](/blog/timetable-settings-sheet-scope/settings-two-areas.png)

Each area ends with one line of explanation — "Applies to all timetables." and "Applies to this timetable only." The boundary is one hairline, card-wide. No extra header: the cards below already say "Days" and "Hours", and a "This timetable" header on top of them reads as two titles.

![Display sheet — days and hours only](/blog/timetable-settings-sheet-scope/display-sheet-days-hours.png)

The Display sheet is the quick path. It opens from the grid — tap the day header row, tap the time axis, or create a new timetable — and it lost the text color card. Days and hours are what you decide when you set a timetable up; text color is something you touch once later, so it lives in Settings only.

| Path | Sheet | Contents |
|---|---|---|
| `…` menu → Settings | Settings | app-wide values · line · this timetable (days, hours, text color) |
| Day header tap · time axis tap · right after a new timetable | Display | days · hours |

## Why three times

On September 11 we merged the two sheets: two entry points meant asking "which settings is it in" every time. On September 15 we split them again: the merged sheet had grown to five cards, and the two groups behave in opposite ways — app-wide values are set once and forgotten, per-timetable values get touched every time you build a timetable. The frequently used half sat at the bottom behind a scroll. So "Display" went to the top of the `…` menu, and tapping the day header or time axis opened it too.

Ten days later, half of that reasoning held. Frequently used values should be reachable fast — but the grid taps were already doing that. If you want to change the days, you tap where the days are written. Almost nobody went through the menu to pick "Display", and with both "Settings" and "Display" sitting next to each other in the menu, the "which one" question was back.

So this round keeps both sheets and separates their roles. The menu has Settings alone, with scope drawn as a line inside it. The Display sheet leaves the menu and stays as the grid's quick path. "Scope decides the sheet" is dropped for the menu entry; "tap where the value is written" stays.

Two alternatives lost:

- Remove per-timetable values from Settings again and keep only the Display sheet. Then nothing in the menu reaches text color or the hour range; the grid tap is fast once you know it and invisible before that.
- Drop the Display sheet and keep only Settings. Tapping the day header and landing on app-wide settings first is wrong — what opens should match what you tapped.

## One thing along the way

With two sheets drawing the same cards, the plumbing behind them — draft hours, the expanded wheel, the "delete schedules outside the range" confirmation, save-once-on-dismiss — almost got duplicated. That plumbing carries the rule "✓ and swipe-to-dismiss are the same confirm path"; fix it in one sheet and the other silently diverges ("swiping Settings closed doesn't save"). The state became one struct and the alert, dismiss gate, and `onDisappear` save became one view modifier that both sheets attach. A source-contract test checks that both do.

## Where it stands

The Settings sheet is longer now; on iPhone the lower area needs a scroll. Fine for a menu entry — if people report not finding text color, that is the first thing to revisit.
