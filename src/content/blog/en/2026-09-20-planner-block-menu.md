---
title: "A checkbox and a context menu on planner blocks"
date: 2026-09-22T01:30:00+09:00
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
| Tap the selected block again | Context menu: edit, move earlier ▸, push back ▸, swap ▸, yesterday, tomorrow, drawer, remove from schedule (reworked three times, see the 2026-09-21 sections below; the last of them gave the rows a naming rule, so these read *Pull Earlier* / *Push Later* now) |
| Hold 0.2 s then drag, or drag a selected block | Move, unchanged (drag one of the chips on the selected block's right side and everything before or after comes along; tap it for the sheet — last section, 2026-09-22) |

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

One rule fixed all three. **Group by outcome, make every top-level silhouette different, and where the subject is what differs, put the items in a submenu with no icons and only the subject.** (The last clause gets reversed in the final section — at five rows, words alone stopped separating them.)

| Group | Items | Icons |
|---|---|---|
| Edit | Edit… | pencil |
| Move within today | Clear overlap (*gone — see below*) · Push back ▸ · Pull later blocks up (*gone — last section*) · Swap ▸ | two rectangles · ↓ · ↑ · ↕ |
| Take out of today | Move to tomorrow · Put in drawer | ↳ · tray |
| Remove | Remove from schedule (*now *Remove from Schedule* — last section*) | trash |

![Eight top-level rows, eight different shapes. One down arrow for pushing, one up arrow for pulling; push and swap open submenus behind the chevron](/blog/planner-block-menu/menu-regrouped.png)

At the time *Push back ▸* held exactly two items, "From this block…" and "Later blocks only…", the names the sheet already used for its modes, so nothing got renamed between the menu and the sheet. *Swap ▸* holds "With previous" and "With next". The submenus carried no icons on purpose: trying to tell these apart by icon was the problem.

*Push back clear of overlap* became *Clear overlap* and stayed outside the push submenu — not for long, as the next section tells. Its purpose is removing an overlap, not pushing, and it is the only move that runs without a sheet, so it keeps its one-tap spot. Its icon is the same metaphor the canvas uses for overlap hatching, two overlapping rectangles. The disabled subtitle stays.

Two alternatives lost. Keeping the structure and only leading each title with its subject does not add a tap, but leaves three identical arrows in a row. Swapping the three push icons for more distinct symbols fails because the difference between them is who moves, and no symbol says that. The submenus cost push and swap one extra tap; in return the top level drops from ten rows to eight, and the most common action, clearing an overlap, is still one tap.

## 2026-09-21 — Clearing an overlap moved out of the menu and into the first row of the sheet

*Clear overlap* did not last a day. Two things kept getting in the way. **You only learned the distance after tapping**: every other push in that menu opens a sheet that states the minutes and how many blocks will hit 24:00, while this one ran and left you to check. And **it went alone**: later blocks stay put, so clearing one overlap tends to create another one below, and you tap again. "You will tap it two or three times" was written down as an accepted cost when it was designed; in use it was the first thing you noticed.

What you usually want when you see an overlap is "this one and everything after it, back". That is exactly what *Push back ▸ From this block…* does, and that sheet already has a place to ask. So the item is gone and the calculation moved into the sheet. When the blocks being pushed overlap something that stays put, the top preset is **Until clear of overlap**, and it is the default. When nothing overlaps, that row is **not there at all** — a greyed-out row in the default slot is something you have to read every time you open the sheet.

![The push sheet opened on an overlapping block. The top row reads 25 minutes — the end of the block sitting on top of it. Below are the usual 15, 30 and 60](/blog/planner-block-menu/push-sheet-escape-row.png)

The number is the same as before: flush against the end of what it overlaps, never rounded to the grid. Three things changed. Later blocks come along, keeping their spacing, so overlaps among the blocks being moved are left out of the calculation. You read the outcome before committing. And **the end of the day is no longer a reason to disable anything** — the sheet already says "N blocks will stop at 24:00 and stay overlapped" *before* you tap. What the previous section tried to do with a menu subtitle, the sheet was doing all along.

![The menu without Clear overlap: moving within today is push, pull and swap](/blog/planner-block-menu/menu-seven-rows.png)

The pure calculation changed shape too, so the number is not computed in two places. It used to answer "where should this go" (a new start minute); it now answers "how many minutes are needed", taking the blocks that move and the blocks that stay. It does not clamp a value that runs past midnight — clamping is exactly how a move that cannot clear the overlap got called a success last time.

Something was lost: "shift this one and leave the rest" is gone. That is a drag now, or picking the minutes yourself in the sheet, and the tap count went from one to three. (It came back as *This one only…* in the last section.) In exchange all three taps show you the result. Two paths to the same goal that can only be told apart by reading the small print — one moves this block, one moves everything after — cost more than the two extra taps.

## 2026-09-21 — Two directions, five scopes, and icons drawn by hand

The "move within today" group had always leaned one way. Pushing back had a submenu and a sheet, so you could choose how many minutes. Pulling forward was a single row, *Pull later blocks up*, which ran immediately at a fixed distance — up to the end of the block in front. There was no way to pull one block up by thirty minutes, and no way, in either direction, to touch the blocks **before** the one you picked. When a morning meeting ran late, nothing in the menu applied.

So the group was rebuilt as **two directions × five scopes**.

![The top level is move earlier ▸, push back ▸ and swap ▸; the group below holds yesterday and tomorrow side by side](/blog/planner-block-menu/shift-menu-top.png)

The top level now names only the direction: `↑ Move earlier ▸` and `↓ Push back ▸`. Both open the **same five rows**: this one only; this one and all earlier; all earlier, not this one; this one and all later; all later, not this one. Whichever row you take, you land in the same sheet, and the direction becomes its title, its confirm button and the sign of the move. The sheet now asks one thing: how far.

### "Later" stopped meaning "overlapping me"

The old definition got in the way first. *Later blocks only* used to treat "later" as **starts after me, plus anything overlapping me** — a rule added so that dropping a block on top of one that starts a few minutes earlier still pushes it.

With five scopes that definition cannot hold: if an overlapping block is both "earlier" and "later", two rows grab the same block. So a scope is now decided purely by **position in the day's blocks sorted by (start, end)**. Overlap plays no part.

The case the old rule protected did not disappear, it got shorter: select the block you covered and use *Push back ▸ This one only…*. Naming the block you mean beats reaching it through a third one.

### The icons are drawn, not picked

Leaving icons out of submenus was the decision of the section above. With two rows, "From this block" versus "Later blocks only" separated on two words. With five, every row reads "this one … all … " in nearly the same shape, and you have to finish the sentence to know which is which.

SF Symbols has no silhouette that separates "from this row up" from "everything above this row". So the icons are drawn with `UIGraphicsImageRenderer`: a 20pt square holding **five horizontal bars**, early at the top, late at the bottom. The middle bar is the block you picked, and it is the only full-width one. Bars that move are solid; bars that stay are faint.

```
This one only          · · ▮ · ·
This one and earlier   ▬ ▬ ▮ · ·
Earlier, not this one  ▬ ▬ · · ·
This one and later     · · ▮ ▬ ▬
Later, not this one    · · · ▬ ▬
```

![Each of the five rows carries a five-bar icon. Solid bars are what moves; the wide middle bar is the block you picked. The last row is greyed out because nothing sits after this block](/blog/planner-block-menu/shift-scope-submenu.png)

They are template images, so the menu tints them — a disabled row dims its icon too. A scope with no targets stays in place, disabled, rather than disappearing: rows that come and go make the same menu a different height on every block.

### Pulling needed a first row of its own

*Until clear of overlap* (the section above) carries over unchanged, just mirrored: pushing goes past the **end** of what it overlaps, pulling goes past the **start**.

The open question was the default when nothing overlaps and you are pulling. The job the old *Pull later blocks up* did — close the gap to the block in front — became a row, *Until it meets the block before*. The first implementation got this wrong: with nothing in front, it treated 00:00 as the wall, so opening the sheet on an afternoon block defaulted to something like "2 h 55 min". "Meet the block before" had quietly become "send it to the top of the day". Now, with no block in front, the row does not appear at all and the default is 15 minutes.

![The pull sheet opened on a block with an 08:00 block above it. The top row is the 2 h 55 min that closes the gap, and the confirm button reads "Move"](/blog/planner-block-menu/pull-sheet.png)

The date group was one-sided too — *Move to tomorrow* with no *Move to yesterday*. Yesterday now sits above tomorrow; side by side, the two arrows explain each other. (**Both rows are gone in the next section** — pairing them up did not fix what was actually wrong.)

### What it costs

*Pull later blocks up* was one tap and is now three (direction, scope, confirm). The labels are long enough to widen the menu and wrap. In exchange all three taps show the result, and the same three taps reach the other nine combinations. Cutting the scopes to three (this one / earlier / later) was considered, but "everything after me, not me" and "me and everything after" are genuinely different jobs — clearing an overlap versus postponing the rest of the day.


## 2026-09-21 — The two date rows are gone, and moves are shown instead of announced

Adding *Move to yesterday* in the section above lasted less than a day. The two arrows do explain each other, but they also do the same thing: add or subtract a day and leave **the time untouched**, then clear the selection. Three things happen at once. The block vanishes from the screen you are looking at, it lands on that day at that time on top of whatever is already there, and you do not see it. Having two directions did not change the fact that neither shows you where the block went.

The drawer was already doing the same job better. Park a block and it waits with its length, note and alarms intact; move to the day you want and take it out **in the middle of the screen you are looking at**. The moment you pick a slot is when you take it out, not when you put it away. So both rows are gone, and *Take off today* is a single row: *Put in drawer*. The toolbar's *Move all unfinished to tomorrow* stays — its target is the whole day, so no individual block lands in a surprise slot, and it asks for confirmation first.

When "tomorrow, same time" really was what you wanted, it is now two steps: park, then take it out on tomorrow's page. Those two steps show you the slot, which is the bet.

### Show the move, do not announce it

Reschedules chosen from the menu used to change the model and stop there. Blocks teleported to their new slots in one frame. *Swap* was the worst case: two blocks change at once, so on screen you cannot tell a swap from both blocks disappearing and reappearing.

Now the canvas blocks and the minimap bars slide to their new slots over 0.3 seconds, ease-in-out. Dragging is the exception — a dragged block has to follow the finger exactly, so its curve is turned off.

One thing went wrong here. The obvious value to drive the animation was the rectangle already being handed to each block, but that rectangle's width comes from a `GeometryReader` measurement, which jumps from 0 to the real width on the first layout pass. `.animation(_:value:)` fires on *any* change of its value, so that jump is a trigger too — every time a day page appears, every block grows from zero width. Counting on "the first render is exempt" does not help: the view has already been drawn, and the same value jumps again on rotation or in Split View.

The value now comes from **what the model says** — the block's start and end minute. If the width changed in the same update, it is interpolated along with everything else, so nothing that matters is lost and only the measurement jitter drops out.

### Undo was happening off-screen

(This one lasted a day — the last section below takes the screen movement back out.)

Undo can revert a block on another day, or one you have scrolled past. The button responds, the screen does not. A single haptic is the whole signal, so you start wondering whether the tap registered and press again.

Each history entry now carries **the id of the block it touched**. After undoing, the planner moves to that block's day, scrolls so the block is visible, and selects it. A grouped move takes the **earliest** block as its representative — seeing the head of the group is what tells you the whole run moved.

Sometimes there is nowhere to go: the undo deleted the block (undoing a placement), parked it, it belongs to another profile, or the entry only ever touched a todo's name or colour. Those clear the selection, as before.

Picking the most recently modified block instead was considered, but undo closures do not touch the modified timestamp consistently — the one that only changes a date does not. Capturing the id when the entry is recorded is exact.

### The drawer rows dropped the date and time

Drawer rows used to print the original date, time range and length on one line. But the date and time are decided again when you take the block out. What you need from a parked block is **what it is and how long it takes**, plus whatever the note says. So a row is now name, length and note (up to three lines).

## 2026-09-21 — With no grammar for row names, a matched pair read as two different actions

Six passes over this menu, and each row got its name whenever it was added. Opened in English, it does not read as if one person wrote it.

| Row | What is off |
|---|---|
| `Move Earlier` / `Push Back` | The **pair** of direction rows, yet different verbs (Move / Push) and different axes (time *Earlier* / space *Back*) |
| `Swap` | A bare verb — it never says what gets swapped |
| `Put in drawer` · `Remove from schedule` | The first three are Title Case; these two are not |

`Move Earlier` and `Push Back` were the worst of it. They open the same five scopes in opposite directions, so they should read as inverses of each other. In English they read as two unrelated actions. A section above says paired icons lie when they are not inverses; the words were doing the same thing.

So the row names got a rule: **`[verb] + [object or direction]`**, Title Case in English, one gerund form in Korean, **a matched pair keeps the verb family and changes only the direction word**, and the suffix says what comes next — `…` for a sheet, `▸` for a submenu, nothing when the row acts in place.

![The two directions now read as a Pull / Push pair, and every row follows the same capitalization](/blog/planner-block-menu/menu-english-grammar.png)

Collapsing everything onto one verb (`Move Earlier` / `Move Later` / `Move to Drawer`) was the obvious alternative. It is grammatical, but three of six rows then open with the same word and the menu stops scanning. Naming them after the internal types (`ShiftSheet`, `ShiftScope`) would give `Shift Earlier` / `Shift Later` — tidy in the codebase, technical on screen. What a person reads should not be pinned to an identifier.

### Renaming the key alone left Korean devices on the old wording

The string catalog key changed with the row. The source, the English value and the UI test all carried the new wording, and the smoke test still failed with *the menu did not open*.

The menu had opened. Only the last row of the accessibility dump was stale — because a `.xcstrings` entry stores **a value for the source language too**. Rename the key and that inner value keeps the old text, and a Korean device reads the value, not the key. The key itself is only a fallback for a key that is missing, so this is the exact mirror of the familiar "an untranslated key ships as Korean" trap: here the key is present, so no fallback runs.

The two parity tests in place did not care. One checks that all five languages exist, the other that format specifiers match. There is now a third invariant: in every entry, the source-language value must equal its key, character for character.

The other lesson is about failure messages. *The menu did not open* is the name of the line the assertion sits on, not what happened. Reading the accessibility dump in the result bundle first would have taken five minutes.
## 2026-09-21 — Undo stays put, and the hatch waits for the landing

Of the two changes in *The two date rows are gone, and moves are shown instead of announced*, one lasted a day — and the other dragged a neighbouring drawing in with it.

### Moving the screen lost the place you were in

Jumping to the day and position of the block you just undid only holds up for a single press. Undo is usually pressed **several times in a row**, and across three presses the date pages past and the vertical scroll lands somewhere different each time. You can see what came back, but not where you were. And undo is nearly always pressed right where you just did something — the off-screen case was rarer than the fix assumed.

So undo and redo now change values only. The day you were on and the scroll position stay; the selection is cleared, so a block that undo deleted cannot leave its menu behind. The plumbing added the day before — the block id each history entry carried, the representative block for a grouped move, the value type that turned it into a day and a start minute — came out with it. Values nobody reads get refilled by the next person who finds them.

### The hatch arrived before the blocks did

The report: "when the blocks animate during a swap, the overlapping area is hatched **before** they get there, and it looks wrong."

It was, and the cause was the sliding added the day before. SwiftUI's implicit animation interpolates **drawing only**. The model is already at its final value on the frame the button is pressed; only frames and offsets pass through intermediate values over the next 0.3 seconds. The overlap hatch is computed from that model value, so it is drawn while the blocks are still apart — a result rendered as a prediction.

There is no way to read the interpolated position: it lives inside SwiftUI. So the drawing is what waits. One type owns when the overlap ranges update:

- when a block that already existed changes range (it is about to slide), the update waits out the slide and then fades in;
- a drag, which follows the finger with no animation, and blocks that appear or disappear update immediately.

The ranges are held **relative to the block's own start**. Held as absolute times, an old hatch detaches from the block and sits in the wrong place; held relative, it rides along with the block — and when two overlapping blocks are pushed by the same amount, so the overlap never changes, nothing happens at all.

Hiding the hatch during the move and restoring it on arrival was the obvious alternative, and it produces a 0.3-second flicker in exactly that case. Carrying the old value is better than hiding it.

The timeline canvas and the minimap each hold one of these and follow the same rule. Settled screenshots cannot catch timing like this, so the rule was pulled out as a plain type and pinned with unit tests: the old value holds while the block slides, it updates after the landing, and a drag updates at once.

## 2026-09-22 — Ten rows and a sheet, replaced by dragging one chip (which must not sit on an edge)

Eight rounds of menu work made the move group precise, and just as deep. Pushing this block and everything after it back by thirty minutes took six taps: select, tap again for the menu, *Push Later ▸*, *This and all later…*, *30 min* in the sheet, *Push*. Four of the six are places where you read and choose. The feedback was short: too deep, too much reading, why not icons or a gesture.

A move decides three things: which way, how far, and what comes along. The menu asks all three in words. The drag that already existed answers the first two with one finger; the only thing it could not do was *what comes along*. A drag always moved one block, and there was no gesture for several, so the menu had to carry everything.

So the selected block now carries two small chips. Drag one and this block plus **everything after it** slides the same distance; drag the other and **everything before it** comes along. Release and it applies — no sheet. Direction is the finger, distance is the finger plus snapping, and scope is which chip you grabbed. Six taps became one tap and one drag.

The first build put the chips on the block's top-right and bottom-right **corners** — top means before, bottom means after, position is meaning. The first screenshot drew an immediate objection: "that looks like a resize handle; moving on it would feel wrong." It would. The resize handles already live on the block's top and bottom edges, and anything straddling those edges reads as "pull this edge". Two kinds of handle on one edge cannot be told apart until you drag. So the chips moved off the edges to the **middle of the block's right side**, side by side: left chip for everything before, right chip for everything after. Away from the edges they read as buttons on the block, and since the finger decides the direction anyway, the chip never needed to encode up or down.

![The selected middle block shows two chips side by side at mid-height on the right. The three bars in a chip: the wide one is this block, the short pair are the blocks that come along](/blog/planner-block-menu/group-chips-selected.png)

![After dragging the right chip: the grabbed block moved an hour later and the block after it moved the same amount. The block before stayed put](/blog/planner-block-menu/group-chips-after-drag.png)

Something that looks like a button should answer a tap. Tapping a chip opens the move sheet for that scope, and the sheet gained a *Pull Earlier / Push Later* segment at the top. Drag for roughly, tap and pick for exactly thirty minutes — both start from the same spot. The segment defaults to whichever direction clears an overlap sooner: back if the block rides the tail of the one before, forward if it sits on the head of the one after, back when nothing overlaps.

![The sheet a chip opens: the direction segment on top, the same distance list below](/blog/planner-block-menu/group-chip-sheet.png)

A chip appears only when there is something in that direction. The first block of the day has no left chip; the last has no right chip, so the chip itself says "there is something this way". The glyph speaks the same language as the submenu icons: bars are blocks, the wide bar is the one you grabbed, the short ones follow.

The sheet's two smart presets became magnets. Only the grabbed block snaps — to the grid and to the edges of blocks that stay put — and the rest take the same offset. *Until it meets the block before* is now the grabbed block's start catching on the previous block's end, and *Until clear of overlap* is it catching on the end of whatever it overlaps. Blocks that travel together keep their spacing, so they are not magnet candidates for each other.

The wall is different from the sheet's. The sheet's push pins each block that would cross midnight to 24:00 individually and leaves them overlapping. In a live drag that would show the group crumpling against the wall in real time. So the group's own ends are the wall: if any block would leave the day, the whole group stops, and the blocked distance feeds the same resistance haptic and squash a single-block drag already had.

Several alternatives lost. Up and down arrow buttons on the selected block, one snap unit per tap, take six taps for thirty minutes at a five-minute snap, and a scope toggle is a mode you have to read. Ripple editing from the time ruler — grab the gap between blocks and everything below moves — has a clean mental model but starts without a selection, so it is harder to find than a chip. A two-finger drag is hardest to find and cannot tell before from after. The scrollbar lane on the right is 22 pt wide and already owned by scrub and jump, and cutting a gutter between the blocks and the lane would let a bracket show what travels together, at the price of every block losing eight percent of its width. Five chips, one per menu scope, do not fit in a row, and the two "excluding this one" scopes are rare enough to stay in the menu.

The menu went from ten rows to three. *Pull Earlier ▸* and *Push Later ▸* folded into one *Move ▸* with *This One Only*, *All Earlier*, *All Later* under it; the two "including this one" scopes went to the chips and the direction went into the sheet. The reschedule event now records whether a move came from a drag or a sheet. A tutorial step for the chips is still to do.

## History

- 2026-09-20 — Checkbox and context menu grammar; `require(toFail:)` fixed the `UIButton` menu hijacking drags
- 2026-09-21 — Added *Push back clear of overlap*: one block, flush against what it overlaps
- 2026-09-21 — Dropped the half-move at the end of the day; disabled items now say why
- 2026-09-21 — Regrouped the menu by outcome, moved push and swap into submenus, gave every top-level row a distinct icon
- 2026-09-21 — Removed *Clear overlap* from the menu; the push sheet's first row, *Until clear of overlap*, does that job now
- 2026-09-21 — Rebuilt moving as two directions × five scopes, drew the submenu icons by hand, and added *Move to yesterday*
- 2026-09-21 — Removed *Move to yesterday* and *Move to tomorrow* so the drawer is the only way off a day; reschedules and undo now show the move
- 2026-09-21 — Gave the rows one naming grammar (`Pull Earlier` ↔ `Push Later`), and caught the catalog trap where renaming a key leaves only Korean devices on the old wording
- 2026-09-21 — Took undo's screen movement back out, and made the overlap hatch wait until the blocks land
- 2026-09-22 — Two group chips at mid-height on the selected block (first on the corners, moved once they read as resize handles) turn "move everything before or after" from six taps into one tap and one drag; tapping a chip opens the sheet, and the menu shrank to *Move ▸* with three rows
