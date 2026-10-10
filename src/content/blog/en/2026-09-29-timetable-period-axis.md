---
title: "A class-period axis for the timetable — real times underneath, period rows on screen"
date: 2026-10-11T02:40:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "When you create a timetable you now pick time-based or period-based. Period timetables stack equal-height rows for Period 1, 2, … and events snap to them as you drag."
---

School timetables are read as "Period 2", not "10:00". New timetables now start with a choice: **by time** or **by period**. Pick periods and the left axis becomes class-period rows.

## You set the periods; the rows stack at equal height

A new period timetable opens the display sheet, where a period-rules card takes the place of the time range (since Oct 3 — before that a "Periods" row led to a separate editor; see the last update). The default is seven 50-minute periods with 10-minute breaks and no lunch (since Oct 11 — before that it included an hour of lunch after period 4; see the last update). You don't set periods one by one: pick when the first period starts, the class, break and lunch lengths, and how many periods — they fill in (see the Sep 30 update; the per-period drag editor described in earlier updates is gone).

![Period axis grid — seven equal rows, one event spanning periods 2–3 on Monday](/blog/timetable-period-axis/period-grid.png)

Each period is one equal-height row labeled with its name and times. Long-press and drag to create an event as before; it snaps to period boundaries. Dragging across periods 2–3 above saves an event from 10:00 to 11:50. Moving and resizing work in half periods (whole periods until the Oct 3 update below).

## Why equal rows, and why not minutes

Drawing to real scale leaves thin break stripes between every row and blurs the one thing you want to read: what's in which period. Equal rows read like a paper timetable. Lunch is just a row boundary by default; it can now be switched on as its own row (last update below). And people who choose periods rarely start something mid-period, so snapping to the grid saves fiddling; the minute-level time wheel is off for these timetables. The exception turned out to be 75-minute university classes, so half periods are allowed since Oct 3.

## Real times stored, virtual times drawn

Storing "Period 2" would have forced alarms, calendar export and widgets to learn about periods. Instead events keep real times, and **only the grid draws period i as a virtual hour i**. That virtual grid is an ordinary hour grid (snapping was 60 minutes, now 30, a half period), so dragging, snapping, overlap checks and the now-line needed no changes. The work moved to the boundary: events leaving the grid convert back to real times, previews coming from editors convert in, and a boundary means "start of the next period" or "end of the previous one" depending on its role. Visible times are converted back too, so you never see a fake "01:00".

The same mapping keeps events attached when you edit periods: shift Period 2 to 10:10 and its events move with it. Events only in removed periods are deleted, and events spanning a removed period are shortened; both are counted in a confirmation first (see the Oct 3 late-night update).

## What's next

At first widgets, shared images, printing and list previews stayed on a clock-time axis — correct, just not in period rows. Shared images, printing and list previews switched later that night, and the full timetable widget on Oct 5 — see below.

## Update, Sep 29 — periods you drag like events

Early feedback: the time-or-period choice was text only, unlocked period rows were too short to drag comfortably, and setting fourteen times with wheels was tedious.

![New timetable sheet — two "vertical axis" cards, one with clock ticks, one with Period 1–3 rows; period is selected](/blog/timetable-period-axis/new-timetable-kind-cards.png)

**The choice now shows the axis.** New timetables open in a small sheet with a name field and two radio cards. Each card draws a miniature of the real grid axis with one event on it — off the ticks for clock time, flush with a row for periods. (These miniatures were later replaced by drawn icons — see the update at the end.)

![Period editor — a vertical day timeline with seven period blocks on the left, the seventh selected and stretched to 17:15; start and end fields on the right](/blog/timetable-period-axis/period-editor-drag.png)

**The period editor is one day column.** Drag a block's middle to move it, its top or bottom edge to change its start or end. Drags snap to 5 minutes and, in this version, stopped at the neighboring periods (the afternoon update makes later periods shift instead), so a drag can never reorder or overlap them. Exact times were on the right — that list is gone as of the afternoon update. This version's timeline didn't scroll (scrolling and dragging would fight over the same finger; the evening update changes that), and its scale is frozen while you drag so the block stays under your finger.

![Unlocked period grid — rows 1.5x taller than when locked](/blog/timetable-period-axis/unlocked-period-rows.png)

**Unlocking zooms period rows too**, 72pt to 108pt on iPhone (144pt from Oct 3, back to 108pt on Oct 8), while snapping stays on the period grid.

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

Widgets stayed on clock time at this point, since they draw separately (moved to period rows on Oct 5 — see below).

## Update, Sep 29 late night — "P1, P2…" by default, and any period can be renamed

The word stays: for Korean students, university included, 교시 is still the word that reads fastest, and "block" already means an event. The real limit was that names were tied to order — there was no way to write homeroom, zero period, lunch or an after-school slot. Now tapping a period in the editor turns the card title into a name field, with "P3" as the placeholder. Clear it and the ordinal name comes back; add or remove periods and ordinal names renumber while custom names stay. Names cap at six characters, the width of the axis label. Only typing is blocked past the cap; imported files are never truncated. A range that includes a custom name reads "Homeroom–P1" instead of "P1–2".

## Update, Sep 29 — the edit sheet picks periods, not times

The grid snapped to periods, but the event edit sheet still asked for start and end *times*. Putting a class in Period 2 meant remembering that Period 2 runs 10:00–10:50 and dialing two wheels.

Now, in a period timetable, the sheet's Start and End rows show a period name in the capsule, with the real time in small type beside it. Tap a capsule and a wheel opens below it, each row reading "P2 10:00 – 10:50" (since Oct 8 the wheel steps by half periods and shows one time per row — see below). Custom period names show up here too.

![New event sheet in a period timetable — Start shows 09:00 and a P1 capsule, the wheel below lists P1 09:00 – 09:50 and P2 10:00 – 10:50](/blog/timetable-period-axis/edit-sheet-period-wheel.png)

Move the start and the end follows, keeping how many periods the event spans. It stops at the last period. The End wheel only lists periods from the start onward, so the end can never come before the start.

![After moving the start to the last period, start and end both read P7](/blog/timetable-period-axis/edit-sheet-period-follow.png)

Times are still stored as real clock times. At this point, not touching the wheel changed nothing, so imported events that didn't line up with period boundaries stayed as they were (since late on Oct 9, saving fits them to period times — see the last section). The 30-minute minimum is dropped for period timetables, since a period can be as short as five minutes. We also considered a row of period chips (too many periods to fit, and range-by-tapping is guesswork) and a single row with a period-count stepper (you couldn't pick the end directly). Along the way we fixed a draft box that jumped far down the grid when you changed the time in the new-event sheet. That path was handing real times to a grid that draws in virtual period hours.

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
| Class length | value pill → wheel | 30–180 min, by 1 (updated Oct 1) |
| Break | value pill → wheel | 0–60 min, by 1 (updated Oct 1) |
| Lunch | value pill → wheel | 0–180 min, by 1 (0 = none; updated Oct 1) |
| Lunch timing | value pill → wheel | "After P4" |
| Periods | value pill → wheel | 1–24 |

Lunch *timing* wasn't in the request, but a lunch length alone can't say where lunch goes, so it got its own row (default: after period 4). With lunch at 0 the row dims rather than disappearing, so the card doesn't jump. A value that pushes the last period past midnight is kept but shown as a red "—" and blocks ✓ (the steppers first refused such taps; they became wheels later the same day).

![No lunch, six periods — the lunch-timing row dims; the list shows periods 10 minutes apart](/blog/timetable-period-axis/period-plan-no-lunch.png)

Existing timetables open with rules inferred from their periods: the most common length and break, and the widest gap larger than the break as lunch. The original periods stay intact until a rule value actually changes; opening and saving without edits preserves the stored times (strengthened Oct 1). Period names stay with their position; events follow the same numbered period; events left without a period after lowering the count are deleted, and events spanning a removed period are shortened, both only after a confirmation.

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

**Lunch on the axis.** With the new toggle on, the grid gets a gray "Lunch" row between periods, and nothing can go in it. Creating there does nothing; dragging down from P4 stops at the lunch row (below, the finger is far lower but the block ends at 12:50); moving snaps to the nearer period; resizing stops at the edge; the edit sheet's end-period wheel won't cross lunch. (Changed on Oct 9: the wall no longer depends on the toggle. See the Oct 9 afternoon update.)

![Grid with a gray "Lunch 12:50–13:50" row between P4 and P5; a new block dragged down from Wednesday P4 stops above it](/blog/timetable-period-axis/period-lunch-row-clamp.png)

The lunch row is a full row, not a half one (changed to a half row on Oct 8, see that update) — snapping and zoom work in whole rows, and a half row would knock every later period off the grid. Drawing a thin band on the boundary instead would have needed every vertical coordinate rewritten. Lunch position isn't stored separately; it's read from the periods, the same way the editor reads its rules, so there's one source of truth. Events that already span lunch are left alone rather than silently cut.

## Update, Sep 30 evening — clearer rules and an easier preview

The editor keeps the same values and wheels, but makes the reading order easier to follow. **Class settings, Lunch, and Preview** headings separate the inputs from their result below the day summary.

![Period editor with a day summary, class and lunch headings, muted icons, and value pills](/blog/timetable-period-axis/period-editor-refined.png)

Small, muted icons give each rule a quick cue. The open row uses the app tint; the rest stay secondary, so the screen does not turn into a set of colored controls. Tapping anywhere in a rule row now opens its wheel, rather than requiring a tap on the value pill. Opening another row closes the first. With no lunch, the lunch-timing row stays in place, dimmed and unavailable.

The preview adds a quiet numbered circle to each class. It is easier to find the period position, then read its time range—even with a custom name. Lunch keeps its smaller fork-and-knife line and has no period number.

![The class-length row open, with a wheel selecting 50 minutes beneath it](/blog/timetable-period-axis/period-editor-wheel.png)

We chose clearer grouping over more controls or decorative colors. Bringing back individual period cards would create two competing answers again: the rules and hand-edited times. The summary, cancel/save flow, and confirmation before removing events remain the same.

## Update, Oct 1 — show the consequences before rebuilding a school day

Rule-based editing removed the work of positioning seven separate periods. The next improvements address what happens around those rules: reusing the same school day, choosing exact lengths, and understanding what an edit will change.

### Reuse the bell schedule without copying the classes

A new semester rarely needs a new set of bell times. The period editor can take times and period names from another period timetable, leaving the target's title, days, and events in place. Copying the whole timetable would make the user remove old classes again.

The source stays untouched. Imported periods are a draft until saved; cancellation discards them. Existing target events follow the same numbered periods, and events that lose their slot still go through the existing deletion confirmation and undo path.

Importing also preserves irregular periods exactly. A 15-minute homeroom followed by a 47-minute class should not turn into two equal classes merely because the editor inferred a rule. Regeneration begins only after a rule value actually changes, and the source notice explains that boundary.

### Exact minutes and a comparison you can fold away

Five-minute class and break steps, and ten-minute lunch steps, excluded valid school schedules. One-minute choices keep the existing wheel interaction while allowing a 47-minute class or a 45-minute lunch. A second keyboard-based input would create another way to edit the same value without improving this task.

![Period editor reopened after saving: 47-minute classes, 7-minute breaks, a 45-minute lunch, and a 09:00–15:49 day summary](/blog/timetable-period-axis/period-exact-minutes.png)

The preview also needs to answer “what changes?” alongside “what will the day look like?” The comparison shows old and new period times and the effect on existing events. Its details can be collapsed so a long period list does not push the rule controls away. Collapsing details does not replace confirmation before deleting events.

When the day runs past midnight, the chosen values remain visible. The editor explains the boundary and how to get back within it instead of silently shortening the day or undoing the user's wheel movement. Any recovery that removes period slots still uses the same impact review and deletion confirmation.

### Inferred controls are not the saved data

The old editor inferred the most common class length and break, then immediately rebuilt its draft from those rules. Irregular stored periods could therefore change even when the user simply opened the sheet and pressed save.

The original list now remains the preview and save payload until an actual rule edit. A picker opening and reporting its current value is not an edit. Inference supplies a starting point for the controls; it does not authorize rewriting the timetable. Impact previews must also share the commit path’s no-op condition, so an unchanged period list cannot falsely predict that an event will be deleted.

The checks must cover an irregular day: save without editing, open a wheel without changing its value, then make an actual edit and cancel. The important promise is small and concrete: a day the user did not change should remain a day the app did not change.

## Update, Oct 3 — half periods, for 75-minute classes

University timetables mix 50-minute and 75-minute classes. Counted in 50-minute periods, a 75-minute class is 1.5 periods, and period timetables had no way to draw it. The period grid now snaps to **half periods**: creating, moving and resizing all work in half rows.

![Unlocked period grid — each period row is twice its locked height](/blog/timetable-period-axis/half-period-edit-rows.png)

(Reverted to 1.5x on Oct 8 so period and time grids share one scale.) To make a half row easy to grab, unlocking now doubles the period row (144pt on iPhone, up from 1.5x at 108pt). A half row is now as tall as a full row when locked. The locked view stays at 72pt, so the day still fits on one screen.

A half period is a fraction, not a fixed time. If Period 2 runs 10:00–10:50, half of it ends at 10:25. Dragging from the top of Period 1 to the middle of Period 2 opens a new event from 09:00 to 10:25.

![New event sheet after dragging to the middle of Period 2 — 09:00 · P1 to 10:25 · P2](/blog/timetable-period-axis/half-period-new-event.png)

Earlier that same day we went the other way. A resize could shrink a block to half a period, because the time grid's 30-minute minimum leaked into the period grid, where 30 virtual minutes is half a period. We raised the minimum to one period. Then the 1.5-period case came up. The half period was useful after all; it was just inconsistent, with whole-period snapping and a half-period minimum. Now both are half a period.

What lost: asking users to define 75-minute periods (breaks timetables that mix both lengths), minute-level dragging (drops the reason to pick periods), and pointing them to time-based timetables (drops the period axis they wanted).

One more fix: saving used to stretch any event to at least 30 minutes. Half of a 50-minute period is 25, so it would spill into the break. Period timetables now use a 1-minute floor, matching the edit sheet. At this point the edit sheet's period wheels still picked whole periods (they step by half periods since Oct 8); a 1.5-period class stays as it is unless you turn them.

## Update, Oct 3 evening — the period rules live in the display sheet; the editor is gone

A time-based timetable edits days and hours in one display sheet. A period timetable had the same sheet with a single "Periods 7 · 09:00–16:40 ›" row, which closed the sheet, waited half a second and opened a separate editor with ✓ and X. One layer versus two, live versus draft. The request was simply to make them the same.

Now the period sheet has a **rules card** where the time card would be: first period start, class length, break, lunch, lunch timing, period count, and a summary line underneath — "09:00 – 16:40 · 7 periods · 7h 40m" (grouped into four rows on Oct 7; see that update). Turn a wheel and the axis behind the sheet changes immediately, exactly like the hour wheels on a time timetable.

![Display sheet — days card, then a Periods card with six rows and the summary line](/blog/timetable-period-axis/display-sheet-period-rules.png)

| | Before | Now |
|---|---|---|
| Getting there | "Periods ›" row → sheet closes → new sheet | a card in the same sheet |
| Applied | on ✓ | as you turn (saved on close) |
| Cancel | X | none — same as time timetables |
| Events losing their period | a dedicated alert | the same confirmation path as the time grid (period-specific wording since Oct 3 late night) |

What lost: pushing the editor inside the sheet (no sheet-on-sheet, but still a draft with X), making time timetables two layers too (a regression), and refusing to lower the period count past an occupied period (a wall inside a wheel is odd, and time timetables already confirm on ✓).

The big summary header and the preview list went away because the grid behind the sheet is the preview now. Move the first period to 10:00 and the axis label updates in place; lower the count and the blocks past the end get clipped, which shows what will be deleted or shortened before the alert counts it. The "check period times" comparison card, which used to appear after any edit, now only appears when the saved periods can't be expressed as rules.

**The lunch toggle had to be rebuilt.** The "lunch on the axis" switch described in the Sep 30 update was never in the app: its pull request was based on another working branch, that branch was squash-merged first, and the three commits landed nowhere. The notes said it existed; a grep said otherwise. The commits were recovered and the switch now sits under the lunch-timing row in the rules card. Turn it on and a gray "Lunch" row appears on the axis behind the sheet.

![Period grid — a gray "Lunch 12:50–13:50" row under Period 4](/blog/timetable-period-axis/lunch-slot-live.png)

Showing that live needed one more piece: when the lunch row appears, everything from Period 5 moves down a row, but blocks are placed by their saved period number. While the sheet is open, blocks are laid out by saved period first and then mapped to the preview axis's rows — the same mapping the save uses. Lesson: a PR stacked on a working branch can vanish when its base merges first. Base on main, or write the merge order into the PR.

**A pitfall, for the third time.** The test for the lunch row couldn't find the axis label's identifier. The hierarchy dump showed every label tagged `time_header_column` — the identifier on the axis column. In SwiftUI an `accessibilityIdentifier` on a container that isn't itself an accessibility element propagates to every element inside and overrides their own. The original lunch work had even moved the label identifier onto the combined element, and it still didn't help, because the parent was overwriting it. The fix is `.accessibilityElement(children: .contain)` on the container before its identifier. Since this was the third occurrence in a week, a source-scan test now fails on any tap container that gets an identifier without being made an element first.

## Update, Oct 3 night — a half period must sit at the exact middle, and so must the stripes

On a real phone the half periods added that afternoon didn't look like halves. A half-period block in Period 3 (11:00–11:50) ended at 60% of the row; a block in the next column ended above the middle. And the white/gray stripes that appear when you unlock still alternated by whole period, so the screen never showed where a half row was.

![Unlocked period grid — the top half of each period is white, the bottom half gray](/blog/timetable-period-axis/half-slot-stripes.png)

The stripes were a one-line change: the stripe unit for period timetables is now half a period, the same unit as snapping and the minimum length.

The 60% was more interesting. The grid maps saved real times onto a virtual axis, linearly within each period, so 11:00–11:30 in a 50-minute period is drawn at 30/50. The drawing was correct; the question was why 11:00–11:30 was saved. Three sources:

1. **Old data.** Until that afternoon, saving stretched every event to at least 30 minutes, so a 25-minute half period became 30. Lowering the floor to 1 minute didn't touch events saved before.
2. **Halves that aren't whole minutes.** Half of a 45-minute period is 22.5; saved as 23 it lands one virtual minute below the half line.
3. **Magnet snapping to neighbours.** Dragging snaps to other blocks' edges as well as to the half lines. Next to a 60% block, a resize snaps to 60% and is saved that way. One off-grid block spreads to the next column — that was the "above the middle" case.

Making every write path snap to half periods, which we had already done, cannot stop values that arrive from outside the write paths. So the fix is at the **one function where real times enter the virtual axis**: both edges round to the nearest half line, a zero-length result is widened to half a row, and anything past the end of the axis lands in the last half row. Saved values are untouched; 11:00–11:30 stays in the file, draws as a half row, and is rewritten as 11:25 the first time you move or resize it. The grid, shared images and the re-placement that runs when you change the periods all go through the same function. The current-time line is the exception and keeps the unrounded mapping, because it has to move continuously.

![An event dragged from the middle of Period 1 to the end of Period 2 — its top edge sits on the stripe boundary](/blog/timetable-period-axis/half-slot-block-midline.png)

What lost: migrating saved data (touches user files and leaves the 45-minute rounding), and excluding period neighbours from magnet snapping (stops the spread but leaves the 60% block itself wrong).

Why it slipped past the afternoon's check: every verified event was freshly dragged, and dragged events start on a half line. The tests now feed off-grid saved values — 60%, 40%, 23 minutes of a 45-minute period, a 5-minute event — and assert the drawing is a half row.

## Update, Oct 3 late night — counting only deletions let spanning events shrink silently

Lowering the period count keeps events on the same numbered period and deletes events that only lived in removed periods, after a confirmation. The gap was events that **span** a removed period. A double class in Periods 6–7 survives a drop from 7 to 6 periods, shortened to Period 6. That is the right outcome, but the alert counted deletions only, so a shortened class with nothing deleted produced no alert at all. The wording was also the time grid's "outside the new display range (days or hours)", which doesn't explain anything about periods.

![The "Change Periods" alert after lowering the count from 7 to 6 — one event deleted, one shortened](/blog/timetable-period-axis/period-change-alert.png)

Period timetables now get their own "Change Periods" alert. It lists only the lines that apply: events that will be deleted, and events that will be shortened to the remaining periods. If nothing is deleted, the button says Continue instead of a red Delete. The check compares how many periods an event spans before and after the change. The Done button, the swipe-to-dismiss block and the alert all read that one check, so they can't disagree.

What lost: deleting spanning events too (the remaining hour is still a real class), and widening the time-grid wording to "days, hours or periods" (one sentence can't carry both delete and shorten).

Why it slipped: the original tests checked where shortened events ended up, but not whether the user was told. A UI test now lowers the count from 7 to 6 and checks both alert lines, that Cancel keeps the sheet, and that Delete removes only the Period 7 event.

## Update, Oct 5 — the home screen widget draws period rows too, and period names step aside instead of hiding

The widget was the last surface still on a clock axis. A period timetable you read as "Period 3, Music" in the app showed up on the home screen as "Music, around noon". The full timetable widget now draws the same period rows as the app grid.

![The full timetable widget with period rows on the vertical axis; the 10:25 now-capsule sits inside Period 1 and the period name has moved above it](/blog/timetable-period-axis/widget-period-rows.png)

| Element | In the widget |
|---|---|
| Vertical axis | Equal-height rows: name plus start and end time |
| Lunch | A light grey row when the lunch row is turned on |
| Now line | Proportional inside a period; during a break it rests on the next period's line |
| Before the first / after the last period | Capsule pinned to the edge, "out of range" |
| Today and Lock Screen widgets | Still real clock time |

The Today and Lock Screen widgets answer "what's now and when is next", so they stay on clock time.

### A period name can't hide behind the capsule

On the clock axis, an hour label that collides with the now-capsule is hidden — the capsule says "10:24", so nothing is lost. On a period axis the capsule still says a time, not a period, and the label sits mid-row, so **the current period's name would be missing for most of the class**. Instead the label moves to the roomier side of the capsule and sheds lines as space runs out: end time, start time, then name only. It hides only when not even one line fits, which starts around fourteen periods.

Two options lost: drawing the capsule over the label (two layers of text, neither readable), and dropping the capsule on period timetables (the widget would lose its "what time is it" number).

![Dark-mode widget with the lunch row on; at 15:45, a break, the now line rests on the top of Period 6](/blog/timetable-period-axis/widget-lunch-row.png)

### Found while porting — the last period was drawn one row up

A widget can't import app code, so the period-to-row mapping had to be written a second time. One line stood out: events past the end of the axis were clamped at **period count × one row**. With the lunch row on there is one more row than there are periods, so last-period events were clamped into the lower half of the previous row. Stored times were fine; only the drawing was wrong. Two changes had landed separately — the clamp while the lunch toggle was briefly missing, the toggle later without revisiting the clamp — and the clamp's test only ran an axis without lunch. The limit is now the row count, with a test on a lunch axis.

### Looking at a widget without a home screen

UI tests can't capture a home screen widget. This time the widget's own source files were compiled into a tiny executable, run headless inside the simulator, and rendered to PNG with `ImageRenderer` — in class, on a break, out of range, with lunch, with 14 and 24 periods. It has not yet been checked on a real home screen.

## Update, Oct 6 — switch the axis after the fact, and the display sheet gets its X back

The vertical axis used to be a one-time choice at creation. Now the display sheet has a pair of **Vertical Axis** tiles at the top; tap one and the timetable switches on the spot. It began as a row of text chips, but that did not read as the same choice you make with pictures when creating a timetable, so the same day it became tiles with the same icons.

![The axis tiles at the top of the display sheet — the same icons as the new-timetable sheet, By Time outlined in blue](/blog/timetable-axis-switch/time-cards.png)

![Right after tapping By Period — the same slot now holds the period rules card, with the first period starting where the events start](/blog/timetable-axis-switch/period-cards.png)

Switching to periods never converts events: they are stored as real times in both modes, so only the axis changes — plus any event the new axis has no room for. (At first that held in both directions. Since Oct 9, going back to the time axis saves each event where the period grid was drawing it — see the last update.)

| Direction | Axis | Events |
|---|---|---|
| Period → time | The real hours the periods covered become the visible range; the period rules are remembered | All kept |
| Time → period | Default rules (50-minute classes, 10-minute breaks) laid over **the span your events cover** | Only events that overlap no period (inside a lunch or break gap) are deleted, after a confirmation |

Laying periods over the visible range would have produced 17 periods for a 6am–midnight grid; using the stock seven periods from 9:00 would have dropped anything in an 8:30 schedule into the gaps. So the periods start at the first event and stop once the last one is covered. The first version still lost data: with only two periods, the default "lunch after period 4" slid to "after period 1", and the second of two back-to-back classes fell into the lunch gap. Four periods or fewer now get no lunch, and the round trip is a test.

A switch is one undo step — a whole-timetable snapshot restores the type, the period list, the lunch row and any deleted events.

**Why the X came back.** The sheet lost its cancel button in September because changes apply live. But shrink the range and you get "2 events will be deleted"; tap Cancel there and you are back in the sheet with no way to tell what to revert. The X now discards everything done since the sheet opened, axis switch included. Swiping down still confirms.

Adding it exposed an older bug. When the sheet auto-opens right after creating a timetable, its content's `onDisappear` fires once spuriously — appear, disappear 7 ms later, appear again — and the "commit only once" flag was left set, so the checkmark silently saved nothing. `onDisappear` means "not visible right now", not "closed"; the flag is now cleared on reappear.

The alert says how many events will go, not which ones. That is next.

## Update, Oct 6 later — a round trip claimed it would delete events

On a real device the same day: a period timetable with lunch after period 6, switched to time and straight back, announced "2 events will be deleted". Coming back, the periods were not restored but rebuilt from the default rules, whose lunch sits after period 4 — so what used to be period 5 became the lunch gap, and two half-period classes there had nowhere to go. The round-trip test existed, but only for a default-rule timetable, which by construction comes back to itself.

Two changes. **Periods are remembered**: switching to time keeps the period list and lunch setting in the save file, and switching back restores them exactly. And **nothing is deleted at the moment of switching**: the periods you land on are a starting point, so the check for events that fit no period runs once, when you confirm the sheet after adjusting the rules. Until then the events stay at their clock times while the periods move underneath.

The "Time → period" row in the table above describes the first version; periods now come from memory when there is one, and deletion waits for the checkmark.

## Update, Oct 6 afternoon — borrow the periods you already set up

A second period timetable meant dialing in all six rules again, even with an identical schedule sitting in the timetable next to it. Custom period names and irregular periods from an imported file could not be rebuilt with the wheels at all.

The period card in the display sheet now ends with "Import Periods from Another Timetable" (moved next to the card title a day later, then back under the card on Oct 8; see the updates below). It opens a picker, and Import brings over that timetable's periods as they are.

| Comes over | Stays put |
|---|---|
| Start and end time of every period | Events |
| Period names | Visible days, first day of week |
| Whether the lunch row shows on the axis | Event text color |

The picker is the one the free-time finder already uses: swipe through preview cards or pick from a title list. The previews are drawn in period rows, so you can see what you are about to borrow. Only period timetables are offered, and with none available the row dims rather than disappears.

The imported periods land in the sheet's draft, exactly where a wheel change would. The grid behind the sheet updates at once, the checkmark saves, and the X discards the import along with everything else. If the borrowed set has fewer periods, the existing confirmation counts the events that would be removed or shortened.

What lost:

- **Save on pick.** It would need a second deletion alert and leave no room to look and back out.
- **Copy the six rules only.** Names and irregular periods would be dropped.
- **Offer it in Settings too.** That sheet has no X, so a wrong import could not be undone.
- **Include time-based timetables.** Their previews are drawn on a clock axis and cannot show the periods you would get.

## Update, Oct 7 — the period card had seven rows; now it has four

The display sheet looked heavy on a period timetable. A time-based timetable shows two rows in that spot; the period version stacked seven rules, a summary line and an import row. Worse than the count, all seven rows carried the same weight, and lunch alone was spread across three of them.

![Display sheet — a Periods card with four rows (first period start, period count, class and break, lunch) and a strip of seven period bars with a lunch gap at the bottom](/blog/timetable-period-axis/period-rules-four-rows.png)

| Row | Values |
|---|---|
| First period start | one pill |
| Periods | one pill |
| Class · Break | two pills — 50m · 10m |
| Lunch | two pills — after P4 · 1h (a single "None" when there is no lunch — since Oct 10 you pick "None" on the first pill, see below) |

Values people think of as a pair share a row. Each pill is its own button and opens only its own wheel under the row. Nothing you could adjust before is gone. The switch that puts lunch on the axis moved under the wheel of the open lunch row here — and moved back a day later; it is a permanent row again (see the last Oct 8 update).

![The lunch row expanded — the 1h pill highlighted, its length wheel open underneath](/blog/timetable-period-axis/period-rules-lunch-panel.png)

**A strip instead of a sentence.** On Oct 3 I wrote that the grid behind the sheet is the preview. On an iPhone the sheet covers nearly all of it. So the card now draws the day above the summary line: one bar per period, small gaps for breaks, a wide gap for lunch, and red bars from the point where the day runs past midnight. It is read-only. The minimap removed on Sep 30 was an editor's scrollbar and went away because hand edits and rules drifted apart; this strip only shows what the rules produce.

**Import moved next to the title** (reversed a day later; see the Oct 8 night update). Yesterday's full-width row under the card is now a small button beside the "Periods" heading.

What lost:

- **Two wheels side by side.** The wheels span the card while the pills sit at the right edge, so nothing tells you which wheel is which.
- **Hiding break and lunch behind "More".** Fewer rows, but people would lose lunch.
- **Big numbers above the card.** That header was removed on Oct 3.

Everything down to the period card now fits one iPhone screen (the event text colour card, moved into this sheet the same day, sits below it). Locales with a long "after period N" phrase shrink the lunch label slightly; I have not looked at those on screen yet.

## Update, Oct 8 — a period is as tall as an hour, lunch as tall as half of one

Period grids now use the same scale as time grids: one period row is as tall as one hour, a half period as tall as 30 minutes. The lunch row on the axis shrank to half a row.

![Locked period grid — the gray lunch row between Period 4 and Period 5 is half as tall as a period row](/blog/timetable-period-axis/lunch-half-row-locked.png)

| | Before | Now |
|---|---|---|
| Unlocked period row (iPhone) | 144pt (2x) | 108pt (1.5x, same as time grids) |
| Lunch row | a full row | half a row |
| Lunch label | name, start, end | name, start, end (name only for a few hours, then a one-line range, then back to three lines — see the later updates) |

This reverses two earlier calls: the 2x unlock zoom from Oct 3 and the full-height lunch row from Sep 30. Switching between the two kinds of timetable and seeing the same hour at two heights turned out to bother more than a small half row, and a row nothing can be placed in was taking a whole class worth of screen.

**What a half lunch row actually breaks.** Snapping moved to half periods on Oct 3, so period lines still land on the snap grid. Two other assumptions did not survive:

- **Period lines sit on the hour.** After a 30-minute lunch, Period 5 starts at :30 in grid coordinates. Bold lines drawn "every hour" would cut periods in half and the edit stripes would flip after lunch. Lines now come from the list of row boundaries, stripes are drawn per period row.
- **The grid ends on the hour.** Seven periods plus lunch is 7.5 hours. About thirty places measured height or clamped drags with `endHour * 60`. Rounding up leaves a rowless half hour under the last period, and an event dropped there collapses to zero length when converted back to real time. Those places now read one end-in-minutes value.

![Unlocked period grid — stripes on the lower half of every period row, including the rows after lunch](/blog/timetable-period-axis/lunch-half-row-unlocked.png)

**Two roads not taken.** Doubling the virtual scale (2 hours per period, 1 for lunch) keeps the end on the hour, but event times clamp to 0–24h, which caps the grid at 12 periods; the app allows 24. And shared images, prints, list previews and widgets still draw lunch as a full row, because they derive paper ratios and wallpaper band heights from a whole number of hours. So the list preview and the grid currently disagree on lunch height.

The mapping is covered by tests and the screens by simulator captures; dragging in the rows after lunch has not been tried by hand yet.

## Update, Oct 8 evening — half periods in the edit sheet, and long-press starts where a tap does

The grid has snapped to half periods for five days, but the edit sheet's wheels still moved a whole period at a time. You couldn't make a 1.5-period class from the sheet, and touching the wheel on one snapped it back to period boundaries.

(The End wheel became a Duration wheel the next day — see the Oct 9 "you pick how long" update. The naming discussion below is the record up to then.)

The wheels now list P1, P1.5, P2, P2.5, and each row carries a single time.

| Wheel | Row | Meaning |
|---|---|---|
| Start | P1  9:00 | from the start of P1 |
| Start | P1.5  9:25 | from the middle of P1 |
| End | P1  9:50 | through the end of P1 |
| End | P1.5  10:25 | through the middle of P2 |

The old rows read "P1 9:00 – 9:50", so picking a start meant reading an end time too. The Start wheel now shows start times only and the End wheel end times only.

**Naming was the hard part.** Naming each half (P1 = first half, P1.5 = second half) turns every ordinary one-period class into "P3 to P3.5". Instead a name means "one period beginning at that spot": P1.5 begins mid-P1 and runs one period. A one-period class is still P3 to P3, and a 75-minute class is P1 to P1.5. The cost is that an event covering only the first half of P1 ends at "P0.5". That's rare enough to accept.

**Long-press creation** changed with it. A tap creates an event at the start of the tapped period (or on the hour in a time timetable), but a long-press in the same cell started at the nearest half-hour line, so 9:40 gave 9:00 one way and 9:30 the other. Long-press now floors to the start of the pressed cell as well, or to the end of the event above if that cuts into the cell. The end still follows your finger. Rounding the anchor up for upward drags lost: the block would jump a cell whenever the drag changed direction.

Names, times and the anchor are covered by tests; turning the wheel and dragging by hand on a device is still to do.

## Update, Oct 8 night — one sheet, one look for "tap a value, get a wheel"

Switching the axis inside the display sheet put the two layouts side by side, and the same action had two looks. On a time-based timetable the start and end values are grey pills, and the open one only turns its text blue. On a period timetable each pill carried an up-down chevron and its whole background turned blue when open.

The period pills now match the time pills: no chevron, grey background at all times, blue text on the open value.

![The period count row open: the pill stays grey and only the 8 is blue, with no chevron. The import row stands on its own under the card](/blog/timetable-period-axis/period-rules-plain-capsule.png)

The up-down chevron is the mark of a row that opens a menu. A wheel is a panel that unfolds under its row, so the chevron made it read as a different kind of control, and only on one axis.

**Import is a full row again.** The small text button beside the "Periods" heading went back to a one-row button card directly under the rules card, with its full label. It still sits outside the rules card: those rows edit values, this one replaces them all.

## Update, Oct 8 late night — the lunch row says when lunch is

When the lunch row shrank to half height earlier today, its label lost the start and end times: three lines don't fit in a half row, and the period above ends when lunch starts. On a real device that reasoning didn't hold. Lunch was the one row on the axis with no time on it, and reading it meant combining two numbers from the neighbouring rows.

The label now has two lines: the name, and a range underneath — "Lunch / 12:50–1:50". (An hour later this became the same three lines as a period — see the midnight update.)

![Locked period grid — the half-height lunch row between Period 4 and Period 5 reads "Lunch" with "12:50–1:50" on one line beneath it](/blog/timetable-period-axis/lunch-half-row-time-range.png)

The arithmetic was right: a half row is 36pt on a locked iPhone grid, and the period label's three lines come to about 37pt. So the range shares one line. AM/PM is dropped — the axis is 44pt wide and "12:50 PM–1:50 PM" doesn't fit even scaled down. The now-capsule on the same axis already drops it for the same reason, so the lunch range uses the same compact form, and the period labels above and below still carry AM/PM. In 24-hour mode it reads "12:50–13:50", a little smaller but inside the band.

Two alternatives lost: smaller text for just the lunch row would mix two type sizes on one axis, and a range with AM/PM has no room. Shared images, prints and list previews still draw lunch as a full row, so their label keeps the three lines.

## Update, Oct 8 later still — a switch inside a collapsed panel comes back as "it's gone"

The "show lunch on the axis" switch is a permanent row of the period card again, directly under the lunch row. With no lunch set it dims; it does not disappear. The card has five rows.

![Display sheet — the lunch switch sits as its own row under the lunch row, with nothing expanded](/blog/timetable-period-axis/lunch-switch-row.png)

A day earlier the switch had moved into the panel that opens under the lunch row, below the wheel. Then came the report: the lunch toggle is gone. The code, the saved value and the grid were all fine. Two changes had overlapped:

- The switch went into the panel, so it did not exist on screen until you tapped a lunch pill. At the time the sheet grew to fit its content, so tapping revealed it.
- Then every sheet moved to the two system heights. At half height an opened wheel lands off screen, so the sheet scrolls to it with `ScrollViewReader`. The scroll target `.id` was added to single-pill rows and missed on two-pill rows. `scrollTo` does nothing, silently, for an id that is not in the tree.

So the switch appeared only after a tap, and then below the fold.

**What may live in a panel.** Adding the missing scroll target would have made it reachable again. That was not the fix. A panel can hold an editor whose current value is already shown on the row — a wheel under a pill that reads "1h". A switch is its own state, separate from lunch length and position, and once collapsed you cannot tell whether it is on. A third control on the lunch row was ruled out too: in Spanish and French two pills already shrink the label.

**Why the tests stayed green.** Three UI tests tap this switch. When it moved, each got one extra line that taps the lunch pill first, and XCUITest's `tap()` scrolls an off-screen element into view on its own, so they kept passing at half height. Nothing asserted that the switch is there when the sheet first opens. That extra tap was the signal: if an existing test needs one more tap to pass, that tap is what the user now pays.

Two checks guard it now: the switch is called exactly once, as a direct row of the card, and the number of expanding panels equals the number of scroll targets. The UI tests look for the switch without touching anything first.

## Update, Oct 8 around midnight — lunch reads like a period, and a blocked drag says so

The one-line range from an hour earlier is gone. Periods showed two lines with AM/PM; lunch alone showed "12:50–1:50". Lunch now uses the same three lines as every period.

![Locked period grid — the half-height lunch row shows "Lunch / 12:50 PM / 1:50 PM" in the same format as the periods around it](/blog/timetable-period-axis/lunch-label-three-lines.png)

Three lines did not fit before because of the 2pt line spacing, not the glyphs: 34.6pt of text in a 36pt row. The lunch row drops the spacing and keeps the font size.

**A drag that stops must say why.** Blocks bulge, the handle squashes and a haptic fires when a drag hits another event or the grid edge. At the lunch row the block just stopped, which read as a bug. Two causes:

- Placement clamped against three walls (neighbour, grid edge, lunch); the resistance check only read the first two. Both now read one wall value.
- Resize measured resistance from the **snapped** value, so nothing showed until the finger crossed half a snap step. That is a few points on the time grid, but tens of points on the period grid (half-period snap) — above period 1 that distance is inside the day header. It now uses the raw finger position, as moves already did.

Moving still hops across lunch once the block's centre passes the row's centre; resistance shows only while it is held back. Position tests had passed all along, because the block always landed in the right place. The resistance value now has unit tests; the in-drag animation is still a device check.

## Update, Oct 9 — blocks that sat on period lines came back a few minutes off

A user switched a time-based timetable to periods and back, and sent two screenshots. On the period axis every block sat on a period line or a half-period line. Back on the time axis the same blocks started at 9:25 and ended at 10:55.

Two earlier decisions met here. The period grid rounds both edges of an event to half-period lines **only when drawing**; the saved value is left alone until the next move or resize rewrites it. And switching the axis did not convert events. Inside the period grid that works: the screen is always tidy, and saved values catch up as blocks are touched. Leave without touching anything and there is no next write, and the time grid has no lines to round to. A draw-time rounding rule only holds on the screen that owns the grid.

Now, leaving the period axis saves each event at the place it was being drawn. It is the two existing mappings back to back — real to virtual with half-period rounding, then virtual to real — so 9:25–10:55, drawn from the middle of Period 1 to the end of Period 2, becomes 9:25–10:50.

| When | Saved times |
|---|---|
| Time → periods | unchanged |
| While on the period axis | only blocks you move or resize |
| Periods → time | all set to where they were drawn |
| Undo, or the sheet's X | everything back, original times included |

Rounding on the way *in* lost because the periods at that moment are a provisional set laid over the events, and the user goes on to adjust class and break lengths in the same sheet. Rounding at the checkmark gains nothing while you stay on periods. Rounding in the time grid is not possible; it has no periods.

One case is excluded on purpose: events that overlap no period at all, such as an imported 9 pm event. The grid pulls those to the last half row so they stay on screen. That is a drawing clamp, not a position anyone chose, and saving it would move a 9 pm event into Period 7.

The round-trip test that already existed used events that were on half-period lines from the start, so it passed either way. The new one runs with times that are off the lines and checks that what comes back matches what the period grid was showing.

## Update, Oct 9 afternoon — lunch is a wall even when the lunch row is off

A user switched a time-based timetable to periods and sent a screenshot: a block starting in period 4 ran straight through the gray lunch row into period 5. A second report came with it. Dragging a long event into a short gap shrinks it to fit, except when one side of the gap is lunch.

**The wall was tied to a display switch.** The lunch wall existed only while "show lunch on the axis" was on. With it off, every caller got "no lunch", so a period 4 block could be stretched into period 5 and the edit sheet's end wheel turned past lunch. Turn the switch on afterwards and the row appears under a block that already crosses it. Switching axes came in through the same hole: a 12:00–14:40 event is period 4 through period 5, and the mapping into the grid rounded edges to half-period lines without looking at lunch.

Whether lunch is drawn is a preference. Whether a class can span lunch is a rule of the period schedule.

**The off side keeps a zero-length wall.** The wall is now read from the period rules. With the row on it is the row; with it off it is the line where period 4 ends and period 5 starts, returned as a range of length zero. Every existing check was "does the block start before the wall ends and end after it starts", which on a zero-length range reads as "does it cross this line". Move, resize, create, duplicate and the edit wheel stop on the off side without a line of change.

| | Lunch row on | Lunch row off |
|---|---|---|
| Wall | The whole lunch row | The line between P4 and P5 |
| Stretch a P4 block down | Stops above the row | Stops at the line |
| Edit sheet end wheel | Up to P4 | Up to P4 |

**Events that already cross are drawn on one side.** The side with the longer share wins; a tie goes to the side before lunch. The saved value stays as it was until the event is next moved or the timetable goes back to the time axis, the same rule as half-period rounding. The widget draws it the same way. Cutting the saved value at the moment of switching lost for the reason it lost earlier that day: the periods right after a switch are provisional. Splitting the event in two would create an event, and switching never creates or deletes one.

One change users will notice: a P4–P5 event made while the row was off now shows as one period.

**The gap measurement needed the wall too.** When a dragged block overlaps another event, the grid measures the free gap around the finger and shrinks the block to it. The gap's walls were neighbouring events and the grid edges only, so a two-period gap between an event and lunch read as a wide gap reaching past lunch. The block kept its length, landed across lunch, and the push-out step shoved it onto the neighbour. The finger's side of lunch is now a wall of the gap.

**Why it was missed.** Every lunch wall test ran on an axis with the row on. And the shrink-to-gap code sits in the overlap branch, not the blocked branch, so it was not on the list checked whenever a wall was added. The gap calculation is now its own function with tests, including the zero-length wall. It was not verified by hand-dragging on a device this time.

## Update, Oct 9 afternoon, continued — you pick how long the class is, not where it ends

On period timetables the edit sheet's second row changed from End to Duration. You choose how many periods the class takes; the app works out the end time.

| Row | Pill | A wheel row |
|---|---|---|
| Start | P3 | P3  11:00 |
| Duration | 1.5 periods | 1.5 periods  12:25 |

The duration wheel steps by half a period from 0.5, and each row shows the time that length ends at.

**The hardest name from yesterday is gone.** An End value of "P1.5" meant "ends in the middle of period 2", and an event using only the first half of period 1 ended at "P0.5". Consistent, but it needed explaining. As a length, 1.5 periods means one thing. Keeping the End wheel with the length as a caption lost because the input stays the same; showing unreachable lengths greyed out lost because it creates a way to block the checkmark.

**Only what fits.** The longest length is the timetable's period count, but the wheel stops at the last period and before lunch. The change just above (the wall is read from the period rules, not the display switch) means it stops there with the lunch row off too.

**The end time is fitted when the sheet opens.** Until now an untouched wheel never changed a time, so an imported 9:00–9:30 event survived opening and closing. With a duration input, a pill reading "0.5 periods" over a stored 9:30 is a mismatch, so opening the sheet moves the end, and only the end, to the half-period line the grid was already drawing. That alone does not count as an edit: swiping the sheet away asks nothing and saves nothing. Fitting every event at file load lost because events you never opened would change.

**Plurals differ at 1.5.** English and Spanish say "1.5 periods"; French and Portuguese keep the singular below 2. Three string keys: exactly 1, the halves below 2, and 2 and up.

The limits and the fitting are covered by tests. Turning the wheel on a device is still to do.

## Update, Oct 9 late afternoon — the screen said period 5, the alarm was set before lunch

A report came in: an event starting right when lunch ends, with alarms 30 and 10 minutes before, and neither rang. An on-time alarm didn't ring either. Alarms in a period timetable now ring at the period time shown on screen, and the saved value is that time too.

### Nothing failed, so nothing noticed

Registration worked. Permission, scheduling, and the check that re-reads the system alarm list all passed. Only the time was wrong.

Events are saved as clock times and the grid draws them in period rows. Since then, "draw it differently" was added three times: edges rounded to half-period lines, events crossing lunch drawn on the longer side only, events starting inside a break drawn at the next period's start. Each time the saved value was left alone "until the next move or resize".

So an event saved as 12:25–15:40 is drawn from 13:50, the start of period 5. The edit sheet reads the same drawing rule and says "Period 5 · 13:50". The alarm read the saved value and scheduled a weekly `Alarm.Schedule.Relative`: on-time at 12:25, 30 minutes before at 11:55. Set during lunch, both are already past, and a weekly repeat quietly moves to next week.

| | Screen and edit sheet | Alarm |
|---|---|---|
| Reads | where the grid draws it | the saved value |
| Start | 13:50 (period 5) | 12:25 |
| 10-minute alarm | expected 13:40 | registered 12:15 |

An alarm at the wrong time is not a failure. No alert, no log line, no broken invariant. Every alarm test used time-based events.

### Fix the reader, or fix the data

The first fix was the reader: alarms are now given events at the times the grid draws them. One line, and the save file is untouched.

That fixes one consumer. The next-class widget, the watch, Siri and calendar export read the saved value too, and every future reader would need the same conversion. The user's version was shorter: in a period timetable, shouldn't the event's times be period times?

So the rule changed. In a period timetable, **the saved value is the shown time**. It is fitted in four places.

| When | What |
|---|---|
| Launch, restore from backup | period timetables are fitted once and saved if anything moved |
| File import | the incoming timetable is fitted |
| Adding or editing an event | even an alarm-only edit saves period times |
| Confirming the display sheet | events that just came over from a time timetable get period times here |

One exception stays. A timetable just switched from time to periods keeps its original times while the display sheet is open, because during that window the events are the reference and the period rules move under them. Confirming fits them, in the same undo step. The reader fix stays in place for that window.

Events that don't overlap any row of the axis, such as a 9 pm event from an imported file, are left alone. The grid pulls those to the last half-row to draw them, which is not where the user saw them. A test also holds that fitting twice changes nothing.

### Where it stands

Unit tests compare alarm times to on-screen times using events that cross lunch or start in a break. We have not yet confirmed a real alarm ringing on a device, and we did not see the reporter's saved data directly; if it happens again on the fixed build, the registration log is the next place to look.

## Update, Oct 9 evening — shrinking the day dragged lunch along; now it clears lunch

Take a seven-period day with lunch after period 4 and the lunch row on, then cut it to two periods. The rules card quietly changed lunch to "after period 1", but the grid showed no lunch row at all. Go up to three periods and lunch moved again, to "after period 2". Nobody touched the lunch setting, and it changed twice.

Now, cutting the period count to the lunch position or below sets lunch to None. Raising the count again does not bring it back; you pick lunch again if you want it.

Two things were going on. The lunch position was only clamped **on read**: the stored value stayed 4, and the screen showed `min(4, count − 1)`, so the visible position followed the count around. And the grid axis does not know the rules — it re-reads lunch from the saved period times as "the largest gap that is longer than a break", where a break is the most common gap. With two periods there is one gap, so that 60-minute gap *is* the most common gap, nothing is longer than itself, and there is no lunch. The card said lunch, the axis said none.

Teaching the axis to treat a single gap as lunch lost: there is no way to tell a break from lunch with one sample, and the position would still wander. Restoring lunch when the count goes back up lost too: a wheel passes through values you never chose. When lunch does survive a change, its visible position is now pinned, so adding periods leaves it where it was.

The tests had checked the rules and the axis separately, never the round trip across different period counts. They do now. One gap was left at this point: turning lunch on by hand in a two-period day still drew no lunch row. Fixing that meant storing the lunch position instead of inferring it, which happened that night (next section).

## Update, Oct 9 night — the lunch position is stored, not re-read

The gap left above closed the same day. A two-period day with lunch now draws its lunch row on the grid and on the widget, and so does a day whose lunch is as short as its breaks.

The fix was to stop inferring. The file used to hold only each period's start and end, and every reader guessed lunch from gap lengths. The guess failed with one gap, failed when lunch was no longer than a break, and — worst — the rules card made the same guess on reopening, so the lunch you had just picked came back as "60-minute break, no lunch".

Lunch is now a mark on the period itself: "lunch follows this one". A single number on the timetable looked simpler, but the period list already travels through the live preview, save, undo, importing from another timetable, the remembered periods of an axis switch, and the widget. A separate number needs a twin on each of those paths and gets lost on the one you forget — which is exactly how the lunch-row switch went missing twice. A mark on the period goes wherever the period goes.

Old files are left alone. A file with no marks reads as "unknown" and is still inferred; one mark anywhere and the marks are trusted. Nothing is back-filled on launch, and since this only adds a field the save version did not change. Marks a shared file could carry but the app cannot produce — on the last period, or on a zero-minute gap — are ignored.

## Update, Oct 10 — "None" lived on the second pill, and people tap the first one

A request came in: let period timetables have no lunch. They already could. The option was just somewhere nobody looked.

The lunch row has two pills: position ("after P4") and length ("1h"). "None" was the top value of the **length** wheel, because that is how it is stored: a lunch of zero minutes. People tap the left pill first, see "after P1" through "after P6", and conclude lunch has to go somewhere.

| | Before | Now |
|---|---|---|
| First pill (position) | after P1 … after P6 | **None**, after P1 … after P6 |
| Second pill (length) | **None**, 5 min … 3 h | 5 min … 3 h |
| Row with no lunch | one length pill reading "None" | one position pill reading "None" |

![The position wheel open with "None" at the top; the length pill is gone and the day strip has no lunch gap](/blog/timetable-period-axis/lunch-position-none.png)

The first pill decides whether there is a lunch; the second only sets its value, and disappears when there is none. The card keeps its height because only the number of pills in the row changes.

![After picking "after P3" again: the length pill is back at one hour, and its wheel has no "None"](/blog/timetable-period-axis/lunch-length-no-none.png)

Two alternatives lost. "None" on both wheels is findable from either side, but then two controls switch the same thing off and each has to decide what to show after the other did it. A separate lunch switch adds a row and sits right above the "show lunch on the axis" switch, where the two would be confused.

One detail: a wheel treats every value it passes as picked. Spin the position wheel past "None" and a 45-minute lunch is briefly switched off, which in storage means its length is gone. The sheet now remembers the length from just before lunch was switched off and restores it when a position is picked again, for as long as the sheet is open. Shrinking the period count still clears lunch for good, as described yesterday.

The save format is unchanged. Checked in the simulator, not yet on a device.

## Update, Oct 11 — a duplicated class skipped half a row, and lunch left the defaults

Duplicate a class that runs from period 3 to the middle of period 4, and the copy did not land right below. It left the second half of period 4 empty and started at period 5.

That timetable had lunch after period 4 with the lunch row hidden. Lunch is a wall either way. The duplicate rule had one answer for a wall: if the copy touches it at all, move the whole copy below it. The copy's start, one period down, was still above the wall. Only its last half period crossed, and that was enough to send it past lunch.

The rule was borrowed from dragging, where your finger has actually crossed the wall. A button press crosses nothing, so the rule is now split.

| Where the copy starts, one period down | Where it lands |
|---|---|
| At least half a period is left before lunch | It starts there and ends at lunch (it may get shorter) |
| It touches lunch or sits inside the lunch row | It skips lunch and keeps its length |

The first row matches what already happens at the end of the grid. Starting the copy where the original ends would avoid overlap, but then the offset would depend on the class length.

The same day, lunch came out of the default rules. New period timetables used to start with lunch after period 4 and the lunch row hidden, which made an invisible wall the default. Now the default is seven periods from 9:00 to 15:50 with no lunch, and the lunch-row switch starts on. Pick a lunch position and the row appears on the axis right away.

Existing timetables keep their saved periods, and the save format is unchanged. Covered by unit tests, not yet checked on screen.

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
- Sep 30, evening — section headings, row icons, whole-row taps, and numbered preview markers
- Oct 1 — import period settings, exact-minute choices, collapsible impact comparison, midnight recovery, and preserving original periods
- Oct 3 — half-period snapping, unlocked period rows at 2x, 1-minute save floor for period timetables (reversing that morning's one-period minimum)
- Oct 3, evening — period rules card inside the display sheet (live, editor/X/dedicated alert removed), lost lunch-row toggle recovered, container-identifier pitfall guarded by a source scan
- Oct 3, night — block edges quantised to half-period lines at the point of entry (old 30-minute clamp values, odd-length rounding, magnet-snap spread); edit stripes per half period
- Oct 3, late night — events spanning a removed period are counted in the confirmation ("shortened"), period-specific alert wording, Continue when nothing is deleted
- Oct 5 — the full timetable widget draws period rows (period names step aside from the now-capsule); fixed last-period events drawn one row up when the lunch row is on
- Oct 6 — axis switching from the display sheet (periods laid over the span the events cover, only gap-only events deleted after confirmation, one undo step); the X returns as discard-all; fixed a commit flag stuck by a spurious `onDisappear` on first presentation
- Oct 6, morning — the axis choice went from text chips to icon tiles (same icons and selection style as the new-timetable sheet)
- Oct 6, later — axis round trips restore the remembered period rules; switching to periods no longer deletes, the checkmark asks once
- Oct 6, afternoon — import another period timetable's periods (times, names, lunch row) from the display sheet; reuses the free-time picker, lands in the draft (checkmark saves, X discards)
- Oct 7 — period rules card from seven rows to four (class · break and lunch timing · length as paired pills), lunch-row switch inside the lunch panel, a day strip above the summary, import moved beside the card title
- Oct 8 — a period row matches one hour on time grids (unlock zoom 2x → 1.5x), lunch row at half height with a name-only label; lines from row boundaries, stripes per period row, grid end in minutes
- Oct 8, evening — edit-sheet period wheels step by half periods (start times on the Start wheel, end times on the End wheel); long-press creation floors to the hour / period start, like a tap
- Oct 8, night — period rule pills match the time pills (no chevron, no blue background when open); import back to a button row under the card
- Oct 8, late night — the half-height lunch row's label gets a one-line start–end range ("12:50–1:50", no AM/PM), reversing the name-only label from earlier that day
- Oct 8, later still — the lunch-on-axis switch back from the lunch panel to a permanent row (five rows); scroll targets on paired-pill panels too; a test that panels and scroll targets match in number
- Oct 8, around midnight — lunch label back to the same three lines as periods (zero line spacing in that row) · blocked-drag feedback at the lunch row and above period 1 (missing wall, resize strength from the raw finger value)
- Oct 9 — switching from periods back to time saves events where the period grid drew them (period and half-period lines); events outside the axis and the other direction are left alone
- Oct 9, afternoon — lunch is a wall with the lunch row off too (a zero-length range) · events crossing lunch are drawn on the longer side · shrink-to-gap works when one side of the gap is lunch
- Oct 9, afternoon (continued) — the edit sheet's second row is Duration, not End: from 0.5 periods up to what fits from the start (last period, before lunch), end time derived · the end time is fitted to a half-period line on open without counting as an edit — reverses the Oct 8 End wheel
- Oct 9, late afternoon — period-timetable alarms were registered from the saved value (before lunch) instead of the time on screen and never rang. Alarms now use the drawn time · saved values in period timetables are fitted to period times (launch, import, add/edit, display-sheet confirm) — reverses "draw only, leave the saved value" and the Sep 29 "don't touch the wheel, nothing changes"
- Oct 9, evening — cutting the period count to the lunch position or below clears lunch (it used to slide forward while the axis drew no lunch row) · a surviving lunch keeps its visible position · round-trip test between rules and axis
- Oct 9, night — the lunch position is stored as a mark on each period (gap-length inference only for files without marks) · lunch rows for two-period days and break-length lunches on grid and widget · save version unchanged
- Oct 10 — lunch "None" moved from the length wheel to the top of the position wheel (length now starts at 5 min) · the length pill is hidden when there is no lunch · switching lunch off and on in the position wheel restores the previous length
- Oct 11 — a duplicate whose tail crosses lunch now ends at lunch instead of skipping it (partly reversing Oct 9) · lunch removed from the default rules (9:00–15:50), with the lunch-row switch on by default
