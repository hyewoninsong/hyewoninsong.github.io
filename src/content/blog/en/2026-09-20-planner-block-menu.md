---
title: "A checkbox and a context menu on planner blocks"
date: 2026-09-21
app: "daily-planner"
tags: ["devlog", "swiftui", "gesture"]
summary: "Tapping a block used to open an edit sheet. Now a checkbox completes it and a second tap opens a menu in place. Getting there meant three rounds with UIButton menus that hijack drags — and clearing an overlap left the menu for the first row of the push sheet."
---

The day planner we are building places pre-registered todos as blocks on a vertical timeline. Tapping the circle at the left of a block now completes it, and tapping a selected block once more opens a menu right under the finger. Before, a tap opened the edit sheet, which is the wrong weight for an app whose whole point is fixing the day quickly.

## One-tap jobs were opening a sheet

Three things happen to a block all the time: done, move to tomorrow, take it off the schedule. Each is a single action, yet each meant opening the sheet or reaching the floating buttons at the bottom-right corner. Completing took two taps, and the corner is the farthest point from the block.

Todo apps mostly agree on the answer: a context menu where the block is. The new grammar:

| Gesture | Result |
|---|---|
| Tap the checkbox at the left | Toggle done, regardless of selection |
| Tap an unselected block | Select it |
| Tap the selected block again | Context menu: edit, push back, pull up, swap, tomorrow, drawer, remove from schedule (reworked twice, see the 2026-09-21 sections below) |
| Hold 0.2 s then drag, or drag a selected block | Move, unchanged |

![A block completed from the checkbox. Strikethrough and the faded color are the done look; the checkbox is the control that flips it](/blog/planner-block-menu/checkbox-done.png)

The three floating circles at the bottom-right (done, delete, more) are gone. The reschedule tools that lived under "more" moved into the menu, and the edit sheet became one of its items.

![Tapping the selected block again opens the menu under the finger](/blog/planner-block-menu/menu-open.png)

## Why a tap menu instead of a long-press menu

The iOS default is long-press. On this timeline, a 0.2-second long press already starts a drag, and `UIContextMenuInteraction` steals that press, so the rule was never to attach one. The tap was the slot left over, and a selected block has already been tapped once, so a second tap reads naturally as "what can I do with this".

An action sheet is easy to present programmatically but slides up from the bottom, which is not "right here". `UIEditMenuInteraction` can be presented at a point but renders as the horizontal copy/paste bar and pages eight items. That left a `UIButton` with `showsMenuAsPrimaryAction`.

## UIButton menus fooled me three times

First, an invisible button that took no touches, presented with `performPrimaryAction()`. The menu appears, but always at the top-left of the screen. It ignores the anchor entirely, whatever frame the button has.

Second, let the button take the tap. Now the menu appears under the finger. But holding for about 0.2 seconds opens it too: pull-down menus open on hold. A resize that started by holding the handle briefly turned into a menu, and dragging on from there executes whatever item is under the finger when it lifts. The last item was "remove from schedule". The smoke test passed anyway, because it held, dragged, and never checked that the block had moved.

Third, try to disable only the hold-to-open recognizer among the five the button installs (tap, touch-down, press, two relationship recognizers). Keep only the tap and the menu stops appearing; drop only the press and the hold stays. The hold timer belongs to the touch-down recognizer the tap presentation needs. Hiding the button when a drag starts is too late.

Instrumenting the recognizers showed what was going on: our long press returned true from `shouldBegin` and never reached `began`. The button's relationship recognizer was suppressing it at the same 0.2-second mark.

The fix inverts the relationship. Every recognizer the button installs is made to require our long press to fail:

```swift
for recognizer in menuButton.gestureRecognizers ?? [] {
    recognizer.require(toFail: layerLongPress)
}
```

A short tap lets the long press fail, then the button's tap fires and the menu opens under the finger. Holding past 0.2 seconds starts the drag and every button recognizer fails. The selected block now starts the same drag from a long press as an unselected one (body moves, handles resize), so the grammar is the same everywhere.

The smoke test now asserts "hold 0.5 s, drag, block moved 160 pt, no menu". A gesture test that performs the gesture without measuring its result will wave this class of regression through.

## What is left

VoiceOver can activate the block title to select it and reach the menu, but it cannot hit the checkbox band. The title carries a done/not-done value for now; a proper accessibility action for completion is next.

## 2026-09-21 — Moving one block clear of what it overlaps

The planner never blocks overlaps. When a meeting runs long you drop a block on top of another and sort it out later. But every cleanup item moved several blocks at once: *push back from here* (me and everything after), *push later blocks back* (everything after me), *pull later blocks up* (everything after). There was no "move just this one until it stops overlapping" — and the first two open a sheet asking how many minutes. Minutes are not what you know; the end of the block underneath is.

So the menu's push group started with **Push back clear of overlap** (later renamed *Clear overlap*, and later still removed from the menu altogether — last section; the item no longer exists). It runs immediately, moves only the selected block, and lands it flush against the latest end among the blocks it currently overlaps. With nothing overlapping, the item is disabled — opening the menu tells you whether this block is overlapped at all.

Two things it deliberately does not do. It does not look for a free slot: if another block sits at the destination, it lands on top of it. Dodging makes the distance unpredictable — on a full day one tap would fly to the evening. Tap again and it steps past the new overlap. And it does not round to the snap grid: the target is the other block's end, not a 15-minute line, and rounding would leave an odd gap exactly where you want to see the overlap gone.

Only the end of the day blocks it: if clearing the overlap would require going past 24:00, the item is disabled. (The first version instead moved "as far as it could" — that lasted one day; see below.) One undo puts it back.

## 2026-09-21 — A half-move locked its own button

A report came in the next day. On a late-evening block, *Push back clear of overlap* moved the block a little, fired the success haptic, and left the overlap hatching exactly where it was. Opening the menu again showed the item greyed out, with nothing on screen saying why.

The cause was one line added the day before in the name of safety:

```swift
return min(target, max(0, dayMinutes - block.duration))   // pin to the end of the day
```

It clamps a target past 24:00 to "as far as it can go". But this action succeeds or fails on whether the overlap is gone, not on distance covered. A 21:00–23:00 block overlapping 21:30–23:30 has a target of 23:30, and two hours do not fit after it. The clamped move lands the block at 22:00–24:00 — where 23:30 is still inside it. The overlap survives; the block is now pinned to the end of the day.

And that spot is a trap. Once the block sits at `24:00 − duration`, "is there anything later to move to" is false forever. One half-success froze the button permanently.

Two changes. **A partial run that misses the point is not a success:** the pure calculation stopped clamping and now returns the real target, the store decides whether the block fits inside the day, and if it does not, nothing moves. **A disabled control owes you its reason on the same screen:** the verdict went from one `nil` to three cases (`.ready`, `.noOverlap`, `.dayEndBlocks`), and the last one puts a subtitle on the menu item — "No room left before 24:00". `UIAction.subtitle` renders on disabled items; a toast fired after the tap never reaches an item you cannot tap.

The tests had the same gap. "Nothing overlaps" and "cannot move at all" were covered; the case in between — moving halfway — was not. Two tests hold it now.

## 2026-09-21 — At ten rows, the icons started lying

Each reschedule tool had been added one at a time, and at ten rows the feedback was "the icons and the wording are confusing". Three causes.

Three down arrows: `arrow.down.square`, `arrow.down.to.line`, `arrow.down.circle`. The square, line and circle carried no meaning, so three rows in a row had the same silhouette. Then `arrow.down.to.line` (push back from here: me and everything after) and `arrow.up.to.line` (pull later blocks up: only what comes after) looked like a pair, and a pair promises inverse operations. These two do not even move the same blocks. And the titles named the mechanism (push, pull, swap) without leading with **who moves**. "Later blocks" appeared in three items with three different subjects, and the menu said "push later blocks back" while the sheet it opened called the same mode "later blocks only".

One rule fixed all three. **Group by outcome, make every top-level silhouette different, and where the subject is what differs, put the items in a submenu with no icons and only the subject.**

| Group | Items | Icons |
|---|---|---|
| Edit | Edit… | pencil |
| Move within today | Clear overlap (*gone now — last section*) · Push back ▸ · Pull later blocks up · Swap ▸ | two rectangles · ↓ · ↑ · ↕ |
| Take out of today | Move to tomorrow · Put in drawer | ↳ · tray |
| Remove | Remove from schedule | trash |

![Eight top-level rows, eight different shapes. One down arrow for pushing, one up arrow for pulling; push and swap open submenus behind the chevron](/blog/planner-block-menu/menu-regrouped.png)

*Push back ▸* holds exactly two items, "From this block…" and "Later blocks only…", the names the sheet already uses for its modes, so nothing gets renamed between the menu and the sheet. *Swap ▸* holds "With previous" and "With next". The submenus carry no icons on purpose: trying to tell these apart by icon was the problem.

*Push back clear of overlap* became *Clear overlap* and stayed outside the push submenu — not for long, as the next section tells. Its purpose is removing an overlap, not pushing, and it is the only move that runs without a sheet, so it keeps its one-tap spot. Its icon is the same metaphor the canvas uses for overlap hatching, two overlapping rectangles. The disabled subtitle stays.

Two alternatives lost. Keeping the structure and only leading each title with its subject does not add a tap, but leaves three identical arrows in a row. Swapping the three push icons for more distinct symbols fails because the difference between them is who moves, and no symbol says that. The submenus cost push and swap one extra tap; in return the top level drops from ten rows to eight, and the most common action, clearing an overlap, is still one tap.

## 2026-09-21 — Clearing an overlap moved out of the menu and into the first row of the sheet

*Clear overlap* did not last a day. Two things kept getting in the way. **You only learned the distance after tapping**: every other push in that menu opens a sheet that states the minutes and how many blocks will hit 24:00, while this one ran and left you to check. And **it went alone**: later blocks stay put, so clearing one overlap tends to create another one below, and you tap again. "You will tap it two or three times" was written down as an accepted cost when it was designed; in use it was the first thing you noticed.

What you usually want when you see an overlap is "this one and everything after it, back". That is exactly what *Push back ▸ From this block…* does, and that sheet already has a place to ask. So the item is gone and the calculation moved into the sheet. When the blocks being pushed overlap something that stays put, the top preset is **Until clear of overlap**, and it is the default. When nothing overlaps, that row is **not there at all** — a greyed-out row in the default slot is something you have to read every time you open the sheet.

![The push sheet opened on an overlapping block. The top row reads 25 minutes — the end of the block sitting on top of it. Below are the usual 15, 30 and 60](/blog/planner-block-menu/push-sheet-escape-row.png)

The number is the same as before: flush against the end of what it overlaps, never rounded to the grid. Three things changed. Later blocks come along, keeping their spacing, so overlaps among the blocks being moved are left out of the calculation. You read the outcome before committing. And **the end of the day is no longer a reason to disable anything** — the sheet already says "N blocks will stop at 24:00 and stay overlapped" *before* you tap. What the previous section tried to do with a menu subtitle, the sheet was doing all along.

![The menu without Clear overlap: moving within today is push, pull and swap](/blog/planner-block-menu/menu-seven-rows.png)

The pure calculation changed shape too, so the number is not computed in two places. It used to answer "where should this go" (a new start minute); it now answers "how many minutes are needed", taking the blocks that move and the blocks that stay. It does not clamp a value that runs past midnight — clamping is exactly how a move that cannot clear the overlap got called a success last time.

Something was lost: "shift this one and leave the rest" is gone. That is a drag now, or picking the minutes yourself in the sheet, and the tap count went from one to three. In exchange all three taps show you the result. Two paths to the same goal that can only be told apart by reading the small print — one moves this block, one moves everything after — cost more than the two extra taps.

## History

- 2026-09-20 — Checkbox and context menu grammar; `require(toFail:)` fixed the `UIButton` menu hijacking drags
- 2026-09-21 — Added *Push back clear of overlap*: one block, flush against what it overlaps
- 2026-09-21 — Dropped the half-move at the end of the day; disabled items now say why
- 2026-09-21 — Regrouped the menu by outcome, moved push and swap into submenus, gave every top-level row a distinct icon
- 2026-09-21 — Removed *Clear overlap* from the menu; the push sheet's first row, *Until clear of overlap*, does that job now
