---
title: "A checkbox and a context menu on planner blocks"
date: 2026-09-23T12:30:00+09:00
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
| Tap the selected block again | Context menu: edit, move earlier ▸, push back ▸, swap ▸, yesterday, tomorrow, drawer, remove from schedule (reworked three times, see the 2026-09-21 sections below; the last of them gave the rows a naming rule, so these read *Pull Earlier* / *Push Later* now. The menu itself goes away in the first 2026-09-22 section, and tapping again opens an **edit popover** in the last one) |
| Hold 0.2 s then drag, or drag a selected block | Move, unchanged (with a group chip on, everything before or after comes along; release over the drawer button to park — last section, 2026-09-22, where the context menu itself goes away) |

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

## 2026-09-22 — The context menu is gone: four gestures on a block are enough

Eight rounds of menu work made the move group precise, and just as deep. Pushing this block and everything after it back by thirty minutes took six taps: select, tap again for the menu, *Push Later ▸*, *This and all later…*, *30 min* in the sheet, *Push*. Four of the six are places where you read and choose. The feedback was short: too deep, too much reading, why not icons or a gesture.

A move decides three things: which way, how far, and what comes along. The menu asks all three in words. The drag that already existed answers the first two with one finger; the only thing it could not do was *what comes along*.

### The chip moved three times

The first build put **drag handles** on the block's top-right and bottom-right corners: grab the bottom one and everything after comes along. The first screenshot drew an immediate objection — "that looks like a resize handle; moving on it would feel wrong." It would. The resize handles already live on those edges.

The second build moved the chips to the middle of the right side, side by side, drag to move and tap for a sheet. Off the edges they no longer read as handles, but now they had lost the top/bottom meaning. "Top and bottom is better. Put them back where they were, but instead of press-and-drag, **tapping selects this block plus everything on that side**, visibly grouped. Drag in that state and they all move. A toggle, so it can be turned off."

That was the answer. My objection to toggles had been that you have to read which mode is on; when every grouped block wears a ring, the state is on screen. And a tap is a different grammar from a drag, so the chip can sit on the same edge as the resize handle without confusion. Seeing what will travel before you drag comes for free.

![The middle block is selected and its bottom chip is on: the chip is filled and the block after it has a thin ring. Dragging the body now moves both](/blog/planner-block-menu/group-chips-selected.png)

![After the drag: the grabbed block and the one after it moved the same amount; the block before stayed put](/blog/planner-block-menu/group-chips-after-drag.png)

### And then the menu had nothing left to do

With moving handled by the chips, the menu held edit, swap, drawer and remove. One more step: "Swap can go. Keep the drawer button at the bottom right at all times and drag blocks onto it. Edit opens when you tap the selected block again. Then the context menu is not needed."

| Menu row | Where it went |
|---|---|
| Edit… | **Tap the selected block again** |
| Move ▸ (ten rows) | Top/bottom chip toggle + body drag |
| Swap Places ▸ | Removed — dragging already does that |
| Move to Drawer | The drawer button is **always** there; drop a block on it. A group goes in whole |
| Remove from Schedule | The editor already ends with *Delete this block* (it comes back as a **trash button in the bottom-right corner** in the last section) |

So a block has four gestures: checkbox = done, tap = select, tap again = edit, drag = move (grouped if a chip is on, into the drawer if released over the button). Nothing to read. The context menu, the transparent `UIButton` that presented it and its `require(toFail:)` acrobatics, the move sheet and swap all left the codebase — most of what the earlier sections of this post fought is gone.

![Right after dropping a block on the drawer button: it leaves the timeline, the button shows 1, and a short "moved to the drawer" note appears](/blog/planner-block-menu/drawer-drop.png)

Details. In a group drag only the grabbed block snaps, to the grid and to the edges of blocks that stay put; the rest take the same offset, so the sheet's *until it meets the block before* and *until clear of overlap* are now magnets. The drawer button sits inside the bottom auto-scroll zone, so hovering over it used to scroll the page; while the finger is within the button's radius, auto-scroll pauses. Grouping applies only to moving and the drawer — applying it to edit or delete would remove five blocks without a confirmation.

### A rule I invented broke on first use

I made the group rigid: the wall was the group's own ends, so if any block would leave the day the whole group stopped. That way you never watch a group crumple against midnight. It felt clean.

It broke immediately. "Turn both chips on, try to move everything down, and all you get is the blocked effect." Reproducing it showed the design working as written. With both chips on the group is the whole day, so the wall becomes **the end of the last block of that day**. An evening block ending at 22:00 leaves two hours of travel; 23:30 leaves thirty minutes; 24:00 leaves none. A drag where the finger moves and nothing follows, with only a resistance haptic, does not read as a rule. It reads as broken.

The wall is now the grabbed block's day, nothing more. The block you hold always follows your finger, and only companions that would leave the day stop at 24:00, keeping their length (companions get one more wall later — see the last section). That is exactly what the old sheet did when it said "N blocks will stop at 24:00 and stay overlapped" — the hatch says the same thing now. Overlap is a normal state in this app, so there was no reason to hide it. A side effect: the preview and the save now run through the same function, so what you saw is what gets stored.

The price of avoiding a crumple was a drag that would not follow the finger. Which of those is worse is not something the person building it gets to decide alone.

### The tests split down the middle

Five of the eight drawer UI tests failed, alternating. Neighbouring tests with identical setup passed, and the failing set changed every run, so it looked like machine-load flakiness. The failures all read "no row in the drawer sheet", which naturally means "the drop did not work" — so I fixed the drop hit test. Five still failed.

The answer was in the accessibility dump XCUITest attaches when a query fails. The drawer button was there, labelled **"drawer · 1"**. The park had worked; the *next* tap had not. The button's frame was 48pt instead of 44 — it was still growing. After a park the button springs once and a "moved to the drawer" note sits above it for 1.8 seconds, and the test waited 1.2 before tapping. That 1.2 < 1.8 was the whole bug. The thing to wait for was not a duration but the note being gone.

That left one failure, and only on **today's page**. Today scrolls so that "now" sits a third of the way down, which puts the block mid-screen; from there to the bottom-right drawer button the horizontal travel exceeds the vertical. On any other day 08:00 is at the top, so the drag is steeply vertical. The moment horizontal wins, the **date pager takes the gesture** and the day flips, so the drop happens on a page that does not hold that block and silently does nothing. When the target sits in a screen corner, the path is always diagonal — I had forgotten that. The pager is now locked while a block is being dragged.

What was lost: delete is one tap longer (tap again → sheet → *Delete this block* → confirm; the last section cuts it back to two), while the drawer became one gesture, so the quick way to clear a block is the drawer. There is no sheet for an exact "30 minutes"; the five-minute snap and the time pill do that job. The tutorial's *Block menu* step became *Open the editor*; steps for grouping and the drawer are still to come.

## 2026-09-22 — "These move together" is a line, not a border

A group chip drew a 1.5pt border around every block that would come along. The person using it said it plainly: "there's only a thin border — it doesn't read as connected."

Fair. A border states *this block is in a state*; it cannot state *this block is tied to that one*. With the anchor near the top of the screen and its companions near the bottom, the only thing joining them was memory.

So I drew a thread. It leaves the lit chip, runs down the same vertical line, and ends at a **link button** that now sits inside the right edge of every companion — filled when connected, outline only when cut, the same on/off grammar as the chip.

![The thread leaves the lower chip of the selected block and lands on the link button inside the block below. Drag the body and thread and buttons follow](/blog/planner-block-menu/group-link-connected.png)

### Drawing it behind the blocks made it disappear

The first version put the thread *behind* the blocks, so it only showed in the gaps. Elegant — until the day is packed, and there are no gaps. The case where the connection is hardest to read is exactly the case where the line vanishes. It goes on top now, with the same contrast as the selection ring (a background-coloured halo under a primary line), so it reads over any block colour.

That first version also ran the thread down to the bottom edge of the last block, where it crossed the whole block and petered out near the drawer button with nothing to mark *where* it connected. A thread has to show the point it attaches to. I added knots — and a knot, it turned out, was already the shape of a button.

### If the knot is a button, you can drop one block

The group had a hole in it: push everything later, except the dinner that cannot move. A chip is "this block and everything after" or nothing. When the old menu's *exclude* scope was removed, I called that case rare. It is not rare.

Making the knot a button filled the hole for free. Tap it and that block leaves the thread — a gap opens in the line, the companion border goes, and it drops out of the group drag. Tap again and it rejoins.

![The companion's link button after tapping it: the thread is gone and the button is an outline. Dragging the anchor now leaves this block where it is](/blog/planner-block-menu/group-link-unlinked.png)

One decision was hiding in there. If the anchor moved 30 minutes down while a block was cut loose, where does that block go when it rejoins — back to the old spacing, or wherever it is now?

Wherever it is now. Restoring the old gap would silently undo an arrangement the person just made, and — more to the point — **nothing has to be stored**. A group drag moves everyone by the same amount (until a companion meets something — last section), so a rejoined block simply takes the next move from where it stands. Having no data structure for remembered offsets also makes the rule a single sentence: connected means it moves with you.

### The 0.2 seconds where the button did nothing

The tap recognizer only fires after the long press fails (`require(toFail:)` — the same structure fought over earlier in this post). Press a link button for longer than 0.2s and the long press wins, so the tap never arrives. A button-shaped thing that does nothing when you press it slowly is broken.

A long press that starts on a link button now swallows the drag and, if the finger lifts on the same button, counts as a tap. Movement in between is discarded — this control is not draggable. The hit order is settled too: group chip → link button → resize band → body.

The costs: the thread crosses the right side of the blocks in between (haloed, but a line is a line), and 34pt of a block's right edge is reserved once it carries a button, so titles truncate that much earlier.

## 2026-09-22 — Holding a roster instead of a direction

A day of using the thread surfaced three complaints with one root: the app was storing
*which direction is on*, not *what is connected*.

A group was a chip direction (`this block and everything after`) plus a list of hand-cut
exceptions, so the set of blocks that move together was recomputed **from the current order
every time a drag began**. Convenient — and it meant the group's membership changed whenever
the group moved.

### The group quietly picked up whatever it passed

Turn on the downward chip, drag the group up past an earlier block, and that block is now
"after" — so **the next drag takes it along**. Nothing was pressed, and the group grew.

Connections are now a **roster of ids**. Pressing a chip puts the ids of whatever stands in
that direction *at that moment* into the roster, and the roster does not change after that,
wherever the group goes. Nothing joins on its own; nothing leaves except by hand.

Holding one thing two ways — a direction plus exceptions — always invents a third state.
Holding it once does not.

### Pick an anchor, connect anything

Link buttons only appeared on blocks in the chip's direction, so "move this meeting and that
walk together" meant turning on a whole direction and then cutting five things loose. The goal
was to connect two; the hands were disconnecting five.

Selecting a block now puts a link button on **every other block that day**. Press only what you
want.

![Selecting the team meeting puts a link button on the morning workout, the reading block and the walk. Nothing is connected yet, so the buttons and both chips are outlines](/blog/planner-block-menu/link-buttons-everywhere.png)

The direction chips stay. "This block and everything after" is still the most common thing
anyone wants, so a chip is the shortcut that presses that direction's buttons all at once —
a bundle of buttons, not a mode.

### A half-connected chip was drawing a full circle

The old chip had two states. Turn on a direction, cut one block loose, and the chip still read
as filled — claiming "everything that way" while meaning some of it. I had drawn a thread to
show the state and left the chip lying about it.

| Chip | Meaning | Tap |
|---|---|---|
| Thin outline | none of it is connected | connect all of it |
| **Ring thickened that far round** | some of it is connected | connect all of it |
| Filled circle | all of that direction is connected | disconnect all of it |

The first attempt got this wrong. Partial was a **dashed** ring: a thread with a block cut out
of it has a gap, so a gapped thread and a dashed ring say the same thing, and there is no new
symbol to learn. The reply was immediate — a dashed ring for *some* next to a solid ring for
*none* does not read.

The metaphor was right and **the ink was backwards**. A dash carries less ink than a solid line,
so the state with fewer connections looked heavier, and reading the three states meant flipping
the order in your head every time. A metaphor does not beat what the eye reads first.

So the three went onto one axis: the ring thickens clockwise from twelve o'clock by the fraction
that is connected. The ink now grows monotonically — and it says **how many of how many** as a
bonus. One of two is half a turn.

![The lower chip's ring is thick for half its circumference — only the reading block of the two below is connected. The thread runs from the chip to its filled button, and the walk's button is still an outline](/blog/planner-block-menu/chip-partial-arc.png)

A half-filled circle was tried: the chip holds a glyph of bars saying which way the group goes,
and half of it would sit on white while half sits on black, which makes the glyph unreadable —
which is why the state rides on the *ring*. A faded fill was tried too: "faint" disappears
against arbitrary block colours, which is why chips and rings are drawn as background-coloured
halos in the first place. A plain thick ring, with no fraction, gets the ink order right but
has to be learned; for the same money, an arc that states the proportion is worth more.

One rule for the tap: **all of it means disconnect, anything else means connect.** The other
direction is never touched.

### With buttons everywhere, they covered the resize handle

A link button's hit rect is 38pt — deliberately smaller than the chip's 44pt so it loses to the
chip on short neighbours. Once buttons appeared on every block, the rect of the block directly
below always covered the selected block's **bottom resize band**. On a packed day, grabbing the
bottom edge to change a duration toggled a link instead.

The fix is to clip the rect to its own block (`rect.intersection(blockFrame)`). A button is only
live inside the block it belongs to; the overhang goes back to its rightful owner. The minimum
30-minute block is 38pt tall, so almost nothing is lost.

### The scrollbar only spoke after the drop

A group drag moves blocks that are not on screen. Grab an evening block and the morning moves
too, but the viewport holds one block. The only place the whole day is visible is the minimap
scrollbar on the right — and its bars were drawn from the model, so they slid to their new
places **after** the drop, exactly one moment too late to help decide where to drop.

The bars now draw the same live ranges as the canvas blocks. Only the bar being dragged has its
animation off (it has to track the finger); the rest keep the 0.3s curve. The overlap hatch
follows the rule it already had — hold the old value while things slide, live during a drag.

The point is that nothing is computed twice. The canvas already held "where each block is headed"
keyed by id, and the minimap now gets that same dictionary. Two copies of one calculation always
drift eventually.

### What it costs

Select a block and every other block that day reserves its right edge for a button, so titles
truncate earlier. And tapping the right-hand middle of another block links it rather than
selecting it — correct by the rules, surprising to a finger that meant to select.

## 2026-09-22 — Companions were walking straight through other blocks

Drag a group down and every companion moved by the same number of minutes. The only walls were
the two ends of the day, so companions passed straight over whatever was standing in their way.
Let go and there are three or four hatched overlaps on screen — overlaps nobody chose, laid down
by the group on its way past. Even in an app where overlap is legal, an overlap you did not make
by hand is one you have to undo by hand.

What this wanted was not pushing. It was queuing.

| Who | What happens |
|---|---|
| A companion that meets a block | Stops flush against its edge (the section below makes a **settled companion** a wall too) |
| A companion that has met nothing yet | Keeps going |
| A block it **already overlapped** when the drag started | Not a wall — it passes, and stops at the next one |
| The block under your finger | Nothing stops it. Its only walls are the ends of the day |

The two exceptions matter as much as the rule. If a companion that starts overlapped treats that
neighbour as a wall, the block snaps *backwards* the moment you touch it — and dragging is how you
resolve an overlap in the first place. And the block in your hand has to be exactly where your
finger is, because that block is how you check the rule with your eyes.

The options that lost: **pushing** what you meet moves blocks you never touched, which breaks the
rule from the section above that only linked blocks move. **Stopping the whole group** when one
member is blocked is a mistake this post already made once, at the end of the day, and already
reverted.

### Uneven travel broke the save

The group drag stored its result as "add one delta to everything." The screen was now placing each
block separately, so adding the same minutes again on release pushed the blocked companion straight
through its wall. Preview and commit sharing one calculation is a rule this app keeps relearning;
this time it broke because the *shape* of the result changed. The drag's own placement is what gets
stored now, and the delta only carries direction and telemetry.

The cost: gaps inside a group shrink when one companion stops and another does not. That matches
the rule that reconnecting takes the current position as the baseline — this app does not remember
relative positions.

### Only the anchor's chip disappeared mid-drag

Chips were hidden while dragging, on the theory that a crowded spot under the finger is messy. But
the thread starts at that chip. Grab a group and the chip vanished, so the thread came out of empty
space, and dropping made the chip reappear with a blink. The one thing you most want to see while
things move — which block is the anchor — was the thing being hidden.

What to hide during a drag is what your finger covers (the in-block time text moved out to a pill
beside the axis for exactly that reason). A control that explains what is happening right now is the
opposite case. The chips stay.

## 2026-09-22 — What you do to a block belongs in the corner, not inside the editor

Even with four gestures on a block, deleting one still lived inside the edit sheet: tap again,
scroll, find *Delete this block*, confirm. Four taps. And the only way into the drawer was a drag,
so a 9 a.m. block had to be hauled across to the bottom-right corner.

So the bottom-right corner now depends on selection.

| State | Bottom-right |
|---|---|
| Nothing selected | One drawer button — tap to take something **out** |
| A block selected | A red trash and *Put in Drawer*. With a group linked, **both apply to the whole group** |

The two never share a button, because while you hold a block there is nothing to take out. The
only question in hand is what to do with this one.

The drop target is unchanged. Dragging a block selects it, so *Put in Drawer* is always the one
showing mid-drag, and both states sit at the same right edge, so the drop coordinate never moves.
One cost: with a block selected you cannot open the drawer from the corner. The toolbar's
*Tidy ▸ Drawer* is the way in then.

### The editing panel was covering what it edited

With delete gone, the sheet held a note field and a pile of things a finger already does better.
Time is a five-minute snap drag. Dates only move through the drawer. Done is the check band on the
left. A full-screen sheet was coming up for one note field.

It is a popover under the block now — 340 wide, two things in it: the todo's name and a note field.

![Tapping a selected block opens a panel beneath it. The title row is a door to the todo editor; the one editable thing is the note. The corner shows the trash and Put in Drawer](/blog/planner-block-menu/block-edit-popover.png)

The first build had the color dot and an editable title in that panel. Wrong picture: title and
color belong to the **todo**, not the block, so editing them there changes every other day's block
too. In a panel labelled "edit this block" the blast radius is invisible. The title row is a link
into the todo editor now — it shows what this is and takes you where to change it.

The losses are real. Alarms can no longer differ per block; a new block takes the default from
Settings and that is that. Typing exact start and end times is gone, as are repeat placement and
duplicate-to-tomorrow. Repeat was a literal copy rather than a rule, and with no door left to it,
it came out of the code too.

### Five blocks went in together and came out one at a time

Dropping a linked group on the drawer button parked all five. The drawer then listed five separate
rows. Undoing meant five taps and relinking. What went in as one came out as five — and the gaps
went with it, since taking one out centers it on screen, so 9:00–10:00 and 11:00–11:30 landed on
top of each other.

The drawer now stores a **bundle mark**. Parking several at once stamps one id on all of them;
taking them out clears it — a bundle only lives inside the drawer. The list shows one row per
bundle: stacked color dots, "Reading and 2 more", the span from first start to last end, a count
badge. Tapping it brings them all back with the gaps they went in with (pushed inside the day if
the span overflows), and a swipe-delete takes the whole bundle.

This is a different thing from the timeline's links, which are a roster frozen at the moment you
press and released when selection changes. A drawer bundle has to stay frozen until it comes out,
so it is stored. Grouping by timestamp was the other option — two unrelated blocks parked in the
same second would fuse. A timestamp is not an identity.

### A popover on a view placed with `.offset` opens at the top-left

Attached to the block, the popover pointed at empty space near the midnight line while the block
sat in the middle of the screen.

Blocks here are placed with `.frame` plus `.offset`. `.offset` is a draw-time transform: it does
not move the layout frame. Every block of the day is stacked at (0,0) as far as layout is
concerned and only spreads out on screen. A popover anchors to that layout frame, not to what you
see. `.contextMenu` and `matchedGeometryEffect` misfire behind `.offset` for the same reason.

The fix is an invisible anchor that owns its place through layout. `.position`, unlike `.offset`,
sets the child's layout position. Order matters: attach the popover **before** `.position`, because
the view `.position` returns fills the whole proposal, which would make the anchor the entire
parent.

Width fooled me too. `frame(idealWidth:maxWidth:)` at 340 produced a popover about 190 wide — the
contents are all flexible text, so an upper bound lets it shrink to the text. A pinned
`frame(width:)` was the answer. Neither shows up in code review; both show up in a simulator
screenshot.

### The test messages hid the failures they were reporting

Once the corner split by selection, "the drawer button does not exist" became a normal state. The
UI tests read that button's label inside their failure messages. With the button gone, building the
message threw first, so the real reason was replaced by "No matches found". They go through a
helper now that returns "no drawer button (a block is selected)" instead.

## 2026-09-22 — The handle was much bigger than it looked

"I grabbed it to move it and it resized" kept coming up. The reason was plain once we looked:
the handle drawn at the block's bottom edge was **half the block's width**, while the area that
actually accepted a resize was the **full width**, plus **20pt outside** the edge. What you saw
and what you could grab were different things.

On a 30-minute block it was worse — the band was a third of the block's height plus that 20pt,
so most of a 40pt block was handle. And the 20pt outside sat on top of the **block below**: on a
packed day, grabbing the top of one block stretched the one above it.

So the hit rectangle moved **inside** the block, to the **middle third** of its width, with a
height of one third clamped to 14–33pt and nothing outside the edge. The drawn capsule shrank to
that same third, so **what you see is what you grab**. One function returns the rectangle, and
both the drawing and the hit test read it. Resizing now means aiming for the middle — miss it and
you simply move the block, which is a cheap mistake.

### What the 20pt of slack had been hiding

Narrowing the band exposed something else. Pressing the handle and dragging **immediately** did
nothing but scroll; holding past 0.2 seconds and then dragging worked fine.

A pan recognizer only asks whether it may begin **after** the finger passes the ~10pt threshold,
so its coordinate is already moved. We reconstruct the start as `location - translation` and test
that against the band. But the scroll view holds the touch briefly before handing it over, and
that first stretch is missing from `translation` — the reconstructed point sits 10–15pt past where
the finger actually landed. The 20pt outside had been absorbing that error; without it, the point
fell clean outside a 14pt band.

The fix is 12pt of vertical slack applied **only** when judging a reconstructed start — never to
the drawing, never to the long-press path, which knows the real starting point. Every narrow hit
area now comes with a question: is this band thicker than the pan threshold?

### The same test passed quietly again

We missed the regression at first because the smoke test's resize step dragged and then only
**attached a screenshot** — no assertion. The gesture could fail completely, the screenshot would
show an unchanged block, and the test stayed green. At the top of this post, back on 2026-09-20,
the same step let a `UIButton` menu hijack drags for the same reason. Twice is enough: the step
now asserts that the selected block's own time label reads 11:00. A screenshot is evidence for a
human to read later, not a verdict.
## 2026-09-22 — We queued companions behind blocks, but not behind each other

The section two above made companions stop at whatever they meet. Hatched overlaps still showed up on
release — this time *inside* the group.

Link a 10:00 block to a 12:00 block and drag both down. A standing block at 13:00 stops the 12:00
one flush against it. The 10:00 one keeps coming and lands at 12:00 — exactly on top of the
companion that just stopped. Same at the end of the day: the leading companion pins to 24:00 and
the next one climbs on top of it. Neither pair overlapped when the drag started. Queuing outside
the group and not inside it meant the bigger the group, the more cleanup came back.

### The premise the exemption rested on was already gone

Collision math excluded companions from each other's wall list. That shortcut had a reason: the
group moves by the same number of minutes, so the gaps between members never change, and gaps that
never change cannot collide. True — right up until that section made blocked companions stop.

That change is exactly what broke the premise. The moment travel becomes uneven, the gaps change.
The save path that re-added one delta got fixed then (end of that section); the exemption buried in
the collision math did not.

**A shortcut of the form "because A, we can skip B" has to be deleted when A is deleted.** All that
survives in the code is the absence of B. A was something someone said out loud once, and grep does
not find it. When you break an invariant, the dangerous sites are not the ones that *use* it — they
are the ones that skipped work *trusting* it.

### Settle from the front

The fix is an ordering. Walk the wall calculation from the front of the direction of travel (latest
block first when dragging down, earliest first when dragging up) and add each companion's settled
range to the wall list for the ones behind it. What counts as a wall is unchanged: a neighbour you
already overlapped at the start is not one, and neither is the block under your finger.

If nothing is blocked, the result is identical to the minute — unchanged gaps never reach the new
walls. Only the shape *after* something stops is different. As a bonus, companions now stack flush
behind the wall, which turns a group drag into "snap several blocks to the end of that one."

The cost is the one from that section: gaps inside the group shrink. This app does not remember
relative positions, so that stays.

### Watching the test fail first

The new UI regression ran once against the old engine so the failure — two blocks at the same height
on screen — was something we saw before it was something we fixed. Five cases cover the queueing on
the pure-calculation side.

## 2026-09-23 — Typing a note squeezed the popover flat

Tapping the note field in the edit popover brings up the keyboard. The popover did not step out
of its way: it got **squeezed into what was left**, and the title row and *Done* disappeared.

Sheets get a keyboard safe area and move themselves. Popovers do not — `UIPopoverPresentationController`
compresses its content when the available area shrinks. The same root showed up without a keyboard:
the plate hangs **below** its anchor (a block is nearly screen-wide, so there is no room beside it),
so a block late in the day pushed the plate off the bottom of the screen, *Done* included.

![Without any keyboard, the plate for a 3pm block runs off the bottom of the screen — the Done row is gone](/blog/planner-block-menu/popover-cut-off.png)

### Re-presenting is not an option

Three fixes looked possible: flip the direction so the plate sits above the block, dismiss and
re-present it somewhere better, or move the anchor.

The first two are closed. A popover **keeps the direction it picked when it appeared** — changing
`arrowEdge` afterwards does nothing, and the keyboard arrives *after* the popover. Re-presenting is
worse: toggling `isPresented` or swapping the source's `.id` **drops focus from the note field**, so
the keyboard goes down with it. The repositioning the keyboard triggered would turn the keyboard off.

That leaves the anchor. It is no longer pinned to the block: it rises until the whole plate fits.
The floor is the top of the keyboard, or the bottom of the viewport when there is no keyboard. When
the plate would cross that line, the anchor becomes a thin band at "floor − plate height", and the
timeline scrolls the block being edited toward the top to make room — so the arrow usually still
lands on its block.

![While typing, the title row, the note and Done all stay above the keyboard, with the arrow still on the block](/blog/planner-block-menu/popover-above-keyboard.png)

Having fought for that space, the plate turned out to be mostly empty. Its height is fixed by what
fits above the keyboard, so the note field should be spending it, not the gaps. Row spacing dropped
from the sheet's 36pt to 16pt and the note took the difference: it opens four lines tall and grows
to seven. The plate's total height barely moved, so none of the keyboard math changed.

### Do not feed a measured height back in

The plate reports its own height rather than carrying a hardcoded constant — and at first that
pushed the plate to the very top of the screen, covering the block. It was a feedback loop: while
the plate sat cut off, a 220pt plate measured **310pt**, and that number lifted the anchor by the
same amount. A size taken after UIKit has kneaded the content into leftover space is not the real
one. Only heights measured with the keyboard down count now (the largest of them), and once the
no-keyboard floor stopped the plate from being clipped at all, the measurement became honest.

The regression test raises a real keyboard and measures: every row of the plate above the keyboard's
top edge, before and after typing.

```swift
let keyboardTop = app.keyboards.firstMatch.frame.minY
XCTAssertLessThan(app.buttons["sheet.done"].frame.maxY, keyboardTop)
```

## 2026-09-23 — Three hours of block, one line of note

Having given the popover's space to the note, the note was still a single line **on the timeline
itself**. One line regardless of block height: a three-hour block sat more than half empty while its
note was cut off with an ellipsis, and a note with line breaks showed only its first line. Notes
accept 500 characters, and the one place a block shows them was not using the room it had.

Now the block's height decides. The padding and one title line come off the top, what is left is
divided by the height of one note line, and that number (rounded down) is the line limit — zero means
the note is not drawn at all, because with room for a single line the title comes first. An hour-long
block fits about four lines; a 30-minute one still shows the title alone.

![A 9:00–12:00 block showing a three-line note with its line breaks intact](/blog/planner-block-menu/note-fills-block.png)

### Do not approximate line height as 1.19×

It is tempting to take "leftover height ÷ line height" with line height estimated as font size × 1.19.
That clips the last line in half the day an accessibility text size or the font changes — and only in
certain height ranges. Asking the font that actually draws the text
(`UIFont.systemFont(ofSize:).lineHeight`) is exact and free.

Letting the text overflow and clipping the block was the other option, but a half-cut last line with
no ellipsis reads as a note that simply ended there.

If the code that counts lines and the code that draws them drift apart, the last line goes missing
quietly — so the block's text padding, spacing and font sizes moved out of inline numbers into one
set of constants. The test measures what matters: that the counted lines actually fit, padding plus
title plus lines × line height staying inside the block, from 38pt up to 400pt.

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
- 2026-09-22 — Group chips (tap to toggle, then drag the body), tap-again-to-edit and drag-onto-the-drawer replaced the context menu, the move sheet and swap. Four gestures on a block; the group wall went back from "the whole group" to "the held block's day"
- 2026-09-22 — Groups now show as a thread with a link button on every companion, so one block can be cut loose and rejoined; rejoining takes its current place as the baseline
- 2026-09-22 — Connections became a roster of ids, so a moving group no longer picks up what it passes; link buttons appear on every block that day, and the direction chip has three states (thin outline / ring thickened by the fraction connected / filled). Minimap bars follow the drag live
- 2026-09-22 — Group companions now stop at the first block they meet (anything they already overlapped, and the block you hold, pass through). Uneven travel means the save uses the preview placement, and the anchor keeps its chips through the drag
- 2026-09-22 — The bottom-right corner splits by selection (trash + Put in Drawer / drawer), and editing shrank to a note-sized popover with a link into the todo editor. The drawer remembers what went in together. Caught the popover-anchor trap on views placed with `.offset`
- 2026-09-22 — The resize handle's hit area moved inside the block, to the middle third, matching the drawn capsule; a judgement-only slack covers the error in the reconstructed pan start
- 2026-09-22 — Made companions walls for each other so a group stops laying down overlaps of its own. The "we all move together so we cannot collide" exemption outlived the section that broke its premise
- 2026-09-23 — The edit popover now stands where the whole plate fits. Keyboards do not move popovers aside, they squeeze them, and re-presenting drops the text focus — the anchor is the only thing left to move
- 2026-09-23 — Block notes now use as many lines as the block's height allows (padding and title off the top, divided by line height; zero means title only), with line height asked of the font instead of approximated
