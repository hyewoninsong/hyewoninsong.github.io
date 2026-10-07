---
title: "We merged, split, and re-merged the settings sheet in ten days"
date: 2026-10-07T11:46:25+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Should app-wide settings and per-timetable settings share a sheet? We changed the answer three times. The final answer is both: one sheet from the menu, a quick sheet from the grid."
---

> Update, October 7, 2026: this layout changed again. Settings now holds app-wide values only, and everything per-timetable lives in the Display sheet. The first sections below are the September 25 reasoning as written; the change is in the last section.

Since September 25 the `…` menu in SuperTimetable has had a single "Settings" row. The sheet it opened that day had two areas: on top, values that apply to every timetable (appearance, time format, current-time line); below a hairline, values for the timetable you are looking at (displayed days, start/end hour, schedule text color). The "Display" sheet you get by tapping the day header or the time axis is still there, but it only carries the days and hours cards.

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

The Settings sheet is longer now; on iPhone the lower area needs a scroll. Fine for a menu entry — if people report not finding text color, that is the first thing to revisit. (Twelve days later, that report came. See below.)

## October 7, 2026 — the text color report came, and per-timetable values left Settings

Schedule text color sat at the very end of the Settings sheet. In the meantime the app-wide card had grown to seven rows (sound, haptics, app lock, and iCloud backup were added), so text color was below that card, two standalone cards, the days card, and the hours card. The second complaint was that display settings felt out of place under app settings.

Both had one cause: per-timetable values were split across two sheets, and text color was only in the one that hid it.

![Settings — a "Display" row on top, then three app-wide cards](/blog/timetable-settings-sheet-scope/settings-app-only.png)

Settings now holds app-wide values only, in three cards: Screen, Sounds & Haptics, Lock & Backup. A single "Display" row on top leads to the per-timetable sheet, with a line under it saying what is inside. The `…` menu still has Settings alone.

![Display sheet — vertical axis, days, hours, and schedule text color at the bottom](/blog/timetable-settings-sheet-scope/display-sheet-text-color.png)

The Display sheet holds every per-timetable value. Text color is back as its last card and fits without scrolling on iPhone.

| Path | Sheet | Contents |
|---|---|---|
| `…` menu → Settings | Settings | a row to Display · Screen · Sounds & Haptics · Lock & Backup |
| Day header tap · time axis tap · right after a new timetable · the "Display" row in Settings | Display | vertical axis · days · hours · text color |

This is the first alternative that lost on September 25. It lost because the menu would no longer reach text color or the hour range. One row in Settings answers that without copying three cards.

The reason for keeping text color out of the Display sheet had also weakened. That sheet is opened often from the grid, and the timetable stays visible behind it, so a text color change shows immediately. The Settings sheet covers the timetable, so there was no preview there.

Tapping the "Display" row closes Settings and opens the Display sheet once the dismissal finishes. Stacking a second sheet on top, or pushing inside Settings, would hide the grid that serves as the live preview. In SwiftUI the next sheet is presented from `onDismiss` of `.sheet(isPresented:onDismiss:)`, guarded by a flag set only by the row, so ✓ and swipe-to-dismiss chain nothing.

## History

- 2026-09-25 — Merged Settings into two areas (all timetables / this timetable); the Display sheet kept days and hours only.
- 2026-10-07 — Removed per-timetable values from Settings and added a "Display" row on top. Text color moved to the Display sheet; the app-wide card became three.
