---
title: "Three ways to pick a value in one settings sheet — now one: a row with the current value, a pushed list"
date: 2026-11-09T18:20:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Radio pair, chip strip and value menu are gone. Every settings row is 'icon · name · current value ›' that pushes a check list, every row has an icon column, and the icons SF Symbols could not express are drawn by hand."
---

Every row in Super Timetable's settings that picks a value now looks the same: the name and the current value on one line, and a tap pushes a list where a checkmark moves. Until now one sheet mixed three grammars — the timetable kind was two radio buttons side by side, visible days and text color were chip strips next to a label, and the print paper was a menu that opened from the value.

## The row reads the value, the list picks it

![Timetable settings — kind, start/end hour, visible days, start day and text color share one row shape](/blog/timetable-two-depth-settings/settings-rows.png)

Depth one is a 52pt row inside the card: icon on the left, name, the current value in secondary color, `›`. It sits between toggle rows and hour-wheel rows without breaking the baseline. Depth two is pushed on the sheet's own `NavigationStack`.

![Kind list — time-based and period-based, a checkmark on the chosen line](/blog/timetable-two-depth-settings/kind-list.png)

Choosing keeps you on the list so you can compare; the system back button returns to the row with the new value in it. Rows that do real work on selection write immediately — switching to period-based shows its confirmation alert over the list, and cancelling leaves the check where it was.

| Sheet | Now two-depth | Still chips |
|---|---|---|
| Timetable settings | kind · visible days · start day · text color | — |
| Settings | appearance · time format | — |
| Print | paper | orientation · size · time format · color · text color |
| Share as image | — | time format · color · text color |

Chips stay where they sit under a live preview: you change the value while looking at the picture, and one more level would cost more than it saves. Those chip rows got the same icon column so the labels line up.

## Why not the radio pair, or radios stacked

The kind row had been through four shapes in a month — icon tiles, row + popover, row + dropdown, and finally two inline radios, which were good on their own and unlike every other row. Stacked radios grow with the number of choices and push the lower groups below the fold of a half-height sheet. Chip strips wrap under the label in long locales and then scroll. A value menu shows only the current value, and the closing glass refracted the label underneath. Two depths split the job: one line reads, one screen picks, and the row height never changes. The app's calendar assignment sheet had moved to this grammar a few days earlier.

The group title "Kind" above the row is gone — the row is already called Kind. The schedule editor was left alone; that sheet is for adjusting while you look.

## An icon column, and nine hand-drawn glyphs

![Settings — appearance and time format as two-depth rows, the current-time indicator with a hand-drawn glyph](/blog/timetable-two-depth-settings/app-settings.png)

A fixed 24pt icon column aligns every row — toggles, wheels, buttons included. Icons use the label color; the accent color is reserved for the checkmark. Where SF Symbols said the wrong thing (`stopwatch` for the current-time line, `tablecells` for the kind, `sunrise` and `moon.stars` for start and end hour) I drew glyphs on the same 64-unit grid as the time/period list icons: the same rounded frame, the same axis column. The current-time line is a bold stroke across the grid with a dot on the axis. The kind glyph shows only ticks on the axis and leaves the body empty — the list explains how it divides. Start hour is a thick top line with an `↑` hanging from it; end hour is a thick bottom line with a `↓` standing on it. An earlier version used a black block in both, but the blocks sat at different heights and read as two different things.

![Period rules card — first period start, period count, class/break, lunch and lunch-on-axis glyphs](/blog/timetable-two-depth-settings/period-glyphs.png)

The five period-rule rows follow the same grammar; only lunch keeps `fork.knife`, because that symbol does say the right thing. Icons that merely repeated the text — ㉔/⑫ for time format, 5/6/7 for visible days, a briefcase and a sun for Monday and Sunday — were dropped, and lists with no icons collapse the column so text starts at the edge instead of looking like something is missing.

## What moved with it

Choice identifiers keep the old chip and radio names so UI tests and the manual test catalog still find them; only the rows got new ones. The UI tests still changed shape: "tap the radio" became "tap the row, pick in the list, go back", and the back button must be looked up on the last navigation bar — `navigationBars.firstMatch` is the grid's bar behind the sheet.

Two things remain: the onboarding clip for the period chapter and one store screenshot still show the old radio row, and the Android app still has it.
