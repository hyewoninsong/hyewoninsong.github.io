---
title: "A class-period axis for the timetable — real times underneath, period rows on screen"
date: 2026-10-06T10:40:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "When you create a timetable you now pick time-based or period-based. Period timetables stack equal-height rows for Period 1, 2, … and events snap to them as you drag."
---

School timetables are read as "Period 2", not "10:00". New timetables now start with a choice: **by time** or **by period**. Pick periods and the left axis becomes class-period rows.

## You set the periods; the rows stack at equal height

A new period timetable opens the display sheet, where a period-rules card takes the place of the time range (since Oct 3 — before that a "Periods" row led to a separate editor; see the last update). The default is seven 50-minute periods with 10-minute breaks and an hour for lunch. You don't set periods one by one: pick when the first period starts, the class, break and lunch lengths, and how many periods — they fill in (see the Sep 30 update; the per-period drag editor described in earlier updates is gone).

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

**Unlocking zooms period rows too**, 72pt to 108pt on iPhone (144pt since Oct 3), while snapping stays on the period grid.

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

**Lunch on the axis.** With the new toggle on, the grid gets a gray "Lunch" row between periods, and nothing can go in it. Creating there does nothing; dragging down from P4 stops at the lunch row (below, the finger is far lower but the block ends at 12:50); moving snaps to the nearer period; resizing stops at the edge; the edit sheet's end-period wheel won't cross lunch.

![Grid with a gray "Lunch 12:50–13:50" row between P4 and P5; a new block dragged down from Wednesday P4 stops above it](/blog/timetable-period-axis/period-lunch-row-clamp.png)

The lunch row is a full row, not a half one — snapping and zoom work in whole rows, and a half row would knock every later period off the grid. Drawing a thin band on the boundary instead would have needed every vertical coordinate rewritten. Lunch position isn't stored separately; it's read from the periods, the same way the editor reads its rules, so there's one source of truth. Events that already span lunch are left alone rather than silently cut.

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

To make a half row easy to grab, unlocking now doubles the period row (144pt on iPhone, up from 1.5x at 108pt). A half row is now as tall as a full row when locked. The locked view stays at 72pt, so the day still fits on one screen.

A half period is a fraction, not a fixed time. If Period 2 runs 10:00–10:50, half of it ends at 10:25. Dragging from the top of Period 1 to the middle of Period 2 opens a new event from 09:00 to 10:25.

![New event sheet after dragging to the middle of Period 2 — 09:00 · P1 to 10:25 · P2](/blog/timetable-period-axis/half-period-new-event.png)

Earlier that same day we went the other way. A resize could shrink a block to half a period, because the time grid's 30-minute minimum leaked into the period grid, where 30 virtual minutes is half a period. We raised the minimum to one period. Then the 1.5-period case came up. The half period was useful after all; it was just inconsistent, with whole-period snapping and a half-period minimum. Now both are half a period.

What lost: asking users to define 75-minute periods (breaks timetables that mix both lengths), minute-level dragging (drops the reason to pick periods), and pointing them to time-based timetables (drops the period axis they wanted).

One more fix: saving used to stretch any event to at least 30 minutes. Half of a 50-minute period is 25, so it would spill into the break. Period timetables now use a 1-minute floor, matching the edit sheet. The edit sheet's period wheels still pick whole periods; a 1.5-period class stays as it is unless you turn them.

## Update, Oct 3 evening — the period rules live in the display sheet; the editor is gone

A time-based timetable edits days and hours in one display sheet. A period timetable had the same sheet with a single "Periods 7 · 09:00–16:40 ›" row, which closed the sheet, waited half a second and opened a separate editor with ✓ and X. One layer versus two, live versus draft. The request was simply to make them the same.

Now the period sheet has a **rules card** where the time card would be: first period start, class length, break, lunch, lunch timing, period count, and a summary line underneath — "09:00 – 16:40 · 7 periods · 7h 40m". Turn a wheel and the axis behind the sheet changes immediately, exactly like the hour wheels on a time timetable.

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

Events are never converted: they are stored as real times in both modes, so only the axis changes — plus any event the new axis has no room for.

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
