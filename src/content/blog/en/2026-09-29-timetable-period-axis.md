---
title: "A class-period axis for the timetable — real times underneath, period rows on screen"
date: 2026-09-30T03:29:38+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "When you create a timetable you now pick time-based or period-based. Period timetables stack equal-height rows for Period 1, 2, … and events snap to them as you drag."
---

School timetables are read as "Period 2", not "10:00". New timetables now start with a choice: **by time** or **by period**. Pick periods and the left axis becomes class-period rows.

## You set the periods; the rows stack at equal height

A new period timetable opens the display sheet, where a "Periods" row takes the place of the time range and leads to the period editor. The default is seven 50-minute periods with 10-minute breaks and an hour for lunch. You don't set periods one by one: pick when the first period starts, the class, break and lunch lengths, and how many periods — they fill in (see the Sep 30 update; the per-period drag editor described in earlier updates is gone).

![Period axis grid — seven equal rows, one event spanning periods 2–3 on Monday](/blog/timetable-period-axis/period-grid.png)

Each period is one equal-height row labeled with its name and times. Long-press and drag to create an event as before; it snaps to period boundaries. Dragging across periods 2–3 above saves an event from 10:00 to 11:50. Moving and resizing work in whole periods.

## Why equal rows, and why whole periods only

Drawing to real scale leaves thin break stripes between every row and blurs the one thing you want to read: what's in which period. Equal rows read like a paper timetable. Lunch is just a row boundary by default; it can now be switched on as its own row (last update below). And people who choose periods rarely start something mid-period, so snapping to whole periods saves fiddling; the minute-level time wheel is off for these timetables.

## Real times stored, virtual times drawn

Storing "Period 2" would have forced alarms, calendar export and widgets to learn about periods. Instead events keep real times, and **only the grid draws period i as a virtual hour i**. That virtual grid is an ordinary hour grid with 60-minute snapping, so dragging, snapping, overlap checks and the now-line needed no changes. The work moved to the boundary: events leaving the grid convert back to real times, previews coming from editors convert in, and a boundary means "start of the next period" or "end of the previous one" depending on its role. Visible times are converted back too, so you never see a fake "01:00".

The same mapping keeps events attached when you edit periods: shift Period 2 to 10:10 and its events move with it. Only events in removed periods are deleted, after a confirmation.

## What's next

Widgets still draw a clock-time axis. They're correct, just not in period rows yet. (Shared images, printing and list previews switched to period rows later that night — see below.)

## Update, Sep 29 — periods you drag like events

Early feedback: the time-or-period choice was text only, unlocked period rows were too short to drag comfortably, and setting fourteen times with wheels was tedious.

![New timetable sheet — two "vertical axis" cards, one with clock ticks, one with Period 1–3 rows; period is selected](/blog/timetable-period-axis/new-timetable-kind-cards.png)

**The choice now shows the axis.** New timetables open in a small sheet with a name field and two radio cards. Each card draws a miniature of the real grid axis with one event on it — off the ticks for clock time, flush with a row for periods. (These miniatures were later replaced by drawn icons — see the update at the end.)

![Period editor — a vertical day timeline with seven period blocks on the left, the seventh selected and stretched to 17:15; start and end fields on the right](/blog/timetable-period-axis/period-editor-drag.png)

**The period editor is one day column.** Drag a block's middle to move it, its top or bottom edge to change its start or end. Drags snap to 5 minutes and, in this version, stopped at the neighboring periods (the afternoon update makes later periods shift instead), so a drag can never reorder or overlap them. Exact times were on the right — that list is gone as of the afternoon update. This version's timeline didn't scroll (scrolling and dragging would fight over the same finger; the evening update changes that), and its scale is frozen while you drag so the block stays under your finger.

![Unlocked period grid — rows 1.5x taller than when locked](/blog/timetable-period-axis/unlocked-period-rows.png)

**Unlocking zooms period rows too**, 72pt to 108pt on iPhone, while snapping stays at whole periods.

One bug on the way: blocks selected but wouldn't drag. A tap gesture attached inside a drag gesture claimed the touch first. A single `DragGesture(minimumDistance: 0)` now handles both.

## Update, Sep 29 afternoon — tap a period to edit it; later periods follow

The feedback on the morning version was blunt: setting periods was too hard, and the first period screen should also ask for days.

Three things made it hard. Seven periods meant fourteen time fields, while a real school day is a few rules ("9:00 start, 50-minute classes, 10-minute breaks"). Editing one period got blocked by its neighbors. And the timeline was 140pt wide, too narrow for labels.

**Wide timeline, one period at a time.** The per-period list is gone. The timeline spans the sheet, so every block reads "Period 2 · 10:00–10:50 · 50 min". Tap a block and the card below edits just that period: start time, length (− 50 min +), and the break after it (− 10 min +), in 5-minute steps (as of the evening update: start and end time only, shown only when a period is selected). The card keeps the same height whether or not anything is selected, so the timeline above never rescales.

**Later periods shift along, keeping their breaks.** Lengthen Period 2 by ten minutes and Periods 3–7 move ten minutes later. Dragging follows the same rule: moving a block moves it and everything after it, and stretching its bottom edge pushes the rest down. Edits stop only at the previous period's end and at midnight. Only the top-edge drag stays local, so a period you didn't touch never moves earlier.

**What lost.** The first proposal was a rule form (first start, length, break, count, lunch) that generates all periods at once. Tapping visible blocks won: it's the same grammar as the rest of the grid, and with rippling, the rule form's shortcut is only a few taps away.

**Days on first setup.** Time-based timetables open a display sheet with days right after creation. Period timetables showed the period editor instead, which skipped days entirely. The first period editor got the same days card at the top — reverted in the evening update.

## Update, Sep 29 evening — a tall scrolling timeline, and a card only when you pick a period

Four requests: make the timeline tall and scrollable, show the card only when a period is selected, drop the break row, and enter an end time instead of a length — while still showing how long the period is.

![Period editor — Period 2 selected with top and bottom handles; the card below shows start 10:00 AM, end 10:50 AM, and "50 min" next to the end time](/blog/timetable-period-axis/period-editor-selected.png)

**Tall timeline.** One minute is now a fixed 1.4pt, so a 50-minute period is 70pt and the day scrolls. **The card slides up only when you tap a period** and goes away when you tap empty space. It has two rows, start time and end time, with the length ("50 min", "1h 20m") next to the end time. End time wins because that's what the school's printed timetable says. Later periods still shift along, and breaks are set by dragging on the timeline.

**Scrolling vs. dragging, split by selection.** Unselected blocks only take a tap, so swiping over them scrolls. Only the selected block carries a `DragGesture(minimumDistance: 0)`, so a touch that starts on it drags immediately. The alternative, a drag on every block via `simultaneousGesture`, would turn one swipe into both a scroll and a move. The cost: tap once before dragging an unselected period. When the card appears and shrinks the viewport, the timeline scrolls so the selected block stays visible.

**Days go back to the display sheet.** Period timetables now open the same display sheet as time-based ones right after creation. Where the start and end times would be, a "Periods 7 · 09:00–16:40 ›" row opens the period editor, which now edits periods only. A days card on top would just shorten the tall timeline.

![Display sheet — under the days card, a Periods section with a "7 · 09:00–16:40 ›" row](/blog/timetable-period-axis/display-sheet-period-row.png)

At this point dragging to the edge didn't auto-scroll yet — the midnight update below adds it.

## Update, Sep 29 night — shared images, prints and list previews in period rows

The grid showed periods, but the image you share, the page you print and the preview card in the timetable list still used a 9 · 10 · 11 o'clock axis. Those are exactly what goes to classmates or onto a classroom wall.

![Shared image — Periods 1–7 as equal rows, each labeled with its name plus start and end time](/blog/timetable-period-axis/share-image-period-light.png)

All three now match the grid: equal-height rows, period name with start and end time on the axis, in whatever time format you pick on the share or print sheet.

![Dark, 12-hour shared image — period labels read "9:00 AM", "1:50 PM"](/blog/timetable-period-axis/share-image-period-dark12.png)

It was one change, not three: all of them render through the same offscreen canvas. That canvas gets the same trick as the grid — events move to virtual hours before drawing, so each period is a 60pt row and block layout, overlap hatching and alarm badges are untouched. Only the axis labels are new. The one trap was print sizing, which computed the canvas aspect ratio from "end hour − start hour" and would have sized a 7-row canvas as 8 hours. It now asks the canvas for its row count.

Widgets still use clock time; they draw separately.

## Update, Sep 29 late night — "P1, P2…" by default, and any period can be renamed

The word stays: for Korean students, university included, 교시 is still the word that reads fastest, and "block" already means an event. The real limit was that names were tied to order — there was no way to write homeroom, zero period, lunch or an after-school slot. Now tapping a period in the editor turns the card title into a name field, with "P3" as the placeholder. Clear it and the ordinal name comes back; add or remove periods and ordinal names renumber while custom names stay. Names cap at six characters, the width of the axis label. Only typing is blocked past the cap; imported files are never truncated. A range that includes a custom name reads "Homeroom–P1" instead of "P1–2".

## Update, Sep 29 — the edit sheet picks periods, not times

The grid snapped to periods, but the event edit sheet still asked for start and end *times*. Putting a class in Period 2 meant remembering that Period 2 runs 10:00–10:50 and dialing two wheels.

Now, in a period timetable, the sheet's Start and End rows show a period name in the capsule, with the real time in small type beside it. Tap a capsule and a wheel opens below it, each row reading "P2 10:00 – 10:50". Custom period names show up here too.

![New event sheet in a period timetable — Start shows 09:00 and a P1 capsule, the wheel below lists P1 09:00 – 09:50 and P2 10:00 – 10:50](/blog/timetable-period-axis/edit-sheet-period-wheel.png)

Move the start and the end follows, keeping how many periods the event spans. It stops at the last period. The End wheel only lists periods from the start onward, so the end can never come before the start.

![After moving the start to the last period, start and end both read P7](/blog/timetable-period-axis/edit-sheet-period-follow.png)

Times are still stored as real clock times. If you don't touch the wheel, nothing changes, so imported events that don't line up with period boundaries stay exactly as they are. The 30-minute minimum is dropped for period timetables, since a period can be as short as five minutes. We also considered a row of period chips (too many periods to fit, and range-by-tapping is guesswork) and a single row with a period-count stepper (you couldn't pick the end directly). Along the way we fixed a draft box that jumped far down the grid when you changed the time in the new-event sheet. That path was handing real times to a grid that draws in virtual period hours.

## Update, Sep 29 midnight — the whole day in a minimap, and auto-scroll at the edges

Dragging period 3 down would suddenly stop. Later periods were being pushed along, and the last one had hit midnight — far below the screen, so from where your finger was there was no visible reason. Dragging to the screen edge didn't scroll either.

**A minimap of the whole day.** The scrollbar is now a minimap, the same one our planner app uses: the track runs from 00:00 at the top to midnight at the bottom, periods are blue bars, and an outlined box marks what's on screen. Tap to jump, drag to scrub; while scrubbing, the lane widens and shows period names.

![Scrubbing the minimap — the lane widens with P1–P7 labels; the outlined box marks the visible range](/blog/timetable-period-axis/period-minimap-scrub.png)

The track spans the full day, not the scroll range, because the question it answers is "why did it stop?" — and the answer is midnight. The bars move live as you drag, and when the last period reaches midnight a blue wall lights up at the bottom of the track (the top, if the first period hits 00:00). We skipped a "can't move further" message; text popping up on every drag is noise.

**Auto-scroll.** Hold your finger within 48pt of the top or bottom edge while moving or resizing a period and the timeline scrolls, faster the deeper you go.

![Dragging period 3 and holding at the bottom edge — the timeline has scrolled to the evening and the minimap shows the wall at midnight](/blog/timetable-period-axis/period-drag-autoscroll-wall.png)

The catch: a drag gesture only reports when the finger moves, so a finger resting at the edge would leave the block behind while the content scrolled. The drag value is now computed from the finger's on-screen height plus the scroll offset, so gesture events and auto-scroll ticks share one formula. During a drag the timeline's range also extends down to midnight so auto-scroll can reach the wall.

## Update, Sep 29 — icons instead of axis miniatures

We looked at the type-card drawings again. The axis miniatures were accurate but busy — too many lines for a glance. They're now drawn icons instead. Time: a rounded frame, a ruler axis (hour ticks, half-hour ticks) with faint hour guide lines, and a block straddling one of them. Period: three equal-height rows numbered 1, 2, 3, with a block that fits exactly in row 2. Same "does it snap to a cell" story, told in a simpler drawing; the one-line caption under each card now carries the real times and period names.

![Time and period icons, light and dark, selected and unselected](/blog/timetable-period-axis/kind-icons-set.png)

![New timetable sheet — the period card with a 1-2-3 row icon](/blog/timetable-period-axis/new-timetable-kind-icons.png)

One catch on the way: the unselected card paints in `secondaryLabel`, which has alpha. Painting each stroke with that color made overlaps — a guide line crossing the block, the frame meeting the axis — visibly darker than the rest of the drawing (caught on a simulator capture). The fix draws the `Canvas` opaque black first, uses that as a mask, and fills once with `.fill(.foreground)`; overlapping strokes stop stacking into a darker patch. And since the period icon needs digits, it's drawn in code rather than shipped as an SVG asset — asset catalog SVG doesn't render `<text>`. The 64×64 SVG files stay as the source of truth, mirrored by hand into the `Canvas` code.

## Update, Sep 30 — five rules instead of seven periods

After a day of making per-period editing less painful — dragging, a wider timeline, later periods shifting along, a minimap, edge auto-scroll — the request that came back changed direction: "Don't make me set periods. Let me pick a start time, class length, lunch, break and number of periods."

Real school days are a handful of rules. The editor now takes the rules and shows the result.

![Period editor — a rules card (first period 9:00 AM, class 50 min, break 10 min, lunch 1 hr, lunch after P4, 7 periods) above a preview list with the lunch row](/blog/timetable-period-axis/period-plan-rules.png)

| Setting | Control | Range |
|---|---|---|
| First period starts | time picker | within the day |
| Class length | value pill → wheel | 30–180 min, by 5 |
| Break | value pill → wheel | 0–60 min, by 5 |
| Lunch | value pill → wheel | 0–180 min, by 10 (0 = none) |
| Lunch timing | value pill → wheel | "After P4" |
| Periods | value pill → wheel | 1–24 |

Lunch *timing* wasn't in the request, but a lunch length alone can't say where lunch goes, so it got its own row (default: after period 4). With lunch at 0 the row dims rather than disappearing, so the card doesn't jump. A value that pushes the last period past midnight is kept but shown as a red "—" and blocks ✓ (the steppers first refused such taps; they became wheels later the same day).

![No lunch, six periods — the lunch-timing row dims; the list shows periods 10 minutes apart](/blog/timetable-period-axis/period-plan-no-lunch.png)

Existing timetables open with rules inferred from their periods: the most common length and break, and the widest gap larger than the break as lunch. Period names stay with their position; events follow the same numbered period; events left without a period after lowering the count are deleted only after a confirmation.

The alternative was keeping yesterday's timeline under the rules as "fine-tune". Moving one period there would break the rules, and the next time the sheet opened there'd be no single source of truth. The timeline, minimap, add button and per-period card are gone. If a school needs one long period, the answer is another rule, not the old editor.

## Update, Sep 30 — the tutorial follows the period timetable

Replaying the tutorial on a period timetable used to show a ghost block growing in 10-minute steps, while the real grid snaps a whole period at a time. It also never said where period times are changed.

The tutorial now adapts to the timetable type. On a period timetable, the create/move/resize demos snap by period and the copy talks about periods, and a tenth step, "Period Times", sits just before Lock: it demos tapping a period on the left axis and advances as soon as the period editor opens.

![Tutorial step 9 of 10 on a period timetable — "Period Times"](/blog/timetable-period-axis/tutorial-period-step.png)

Why this shape:

- **Advance on open, not on save.** The editor is a set of rules; demanding a save would push people into changes they don't want. The step only needs to show where the setting lives.
- **Near the end, not first.** A new period timetable already opens the period editor right after creation.
- **A variant, not another course.** The tutorial already splits by shell (iPhone vs. wide iPad). Adding type as a course would make four; type is a separate axis multiplied in, and the demos only swap the grid step from 30 minutes to one period.

## Update, Sep 30 early morning — a cleaner editor, and lunch as its own row

The rules editor worked but looked like a settings form: five − / + steppers stacked up, and the end of the day hidden at the bottom of the list.

![Period editor — lunch card with 1 hour, after P4, "Show lunch on axis" on; the list below shows P1–P7 with a smaller fork-and-knife lunch line](/blog/timetable-period-axis/period-lunch-toggle.png)

- A big summary line on top: `09:00 – 16:40`, then `7 periods · 7h 40m`.
- Every value is a gray pill; tap it and a wheel opens under the row, like the time rows elsewhere in the app.
- Two cards: class (start, length, break, count) and lunch (length, timing, axis toggle).
- The preview bolds period names and turns lunch into a smaller, gray line with a fork-and-knife icon.

School-level preset chips (elementary to college) went in and came straight back out: values differ too much from school to school, and two wheel flicks do the same job.

**Lunch on the axis.** With the new toggle on, the grid gets a gray "Lunch" row between periods, and nothing can go in it. Creating there does nothing; dragging down from P4 stops at the lunch row (below, the finger is far lower but the block ends at 12:50); moving snaps to the nearer period; resizing stops at the edge; the edit sheet's end-period wheel won't cross lunch.

![Grid with a gray "Lunch 12:50–13:50" row between P4 and P5; a new block dragged down from Wednesday P4 stops above it](/blog/timetable-period-axis/period-lunch-row-clamp.png)

The lunch row is a full row, not a half one — snapping and zoom work in whole rows, and a half row would knock every later period off the grid. Drawing a thin band on the boundary instead would have needed every vertical coordinate rewritten. Lunch position isn't stored separately; it's read from the periods, the same way the editor reads its rules, so there's one source of truth. Events that already span lunch are left alone rather than silently cut.

## History

- Sep 29, early — period axis introduced
- Sep 29, morning — axis previews in the type picker, drag-to-edit periods, unlock zoom
- Sep 29, afternoon — wide timeline with a tap-to-edit card, later periods shift along, days on first setup
- Sep 29, evening — tall scrolling timeline, drag only the selected block, card on selection with start/end times, first setup via the display sheet
- Sep 29, night — shared images, prints and list previews in period rows
- Sep 29, late night — rename any period (default "P1, P2…")
- Sep 29, later evening — the edit sheet picks start and end periods
- Sep 29, midnight — whole-day minimap, midnight wall, edge auto-scroll while dragging
- Sep 29, night (later) — type cards switched from axis miniatures to drawn icons, mask fix for overlap darkening
- Sep 30 — period editor switched to rules (start, class, break, lunch, lunch timing, count); per-period drag editing removed
- Sep 30, later — tutorial variant for period timetables: period-snapped demos, a "Period Times" step
- Sep 30, early morning — cleaner editor (summary line, value pills + wheels, class/lunch cards); optional lunch row on the axis, closed to events
