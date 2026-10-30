---
title: "We dropped the account cards for Settings-style rows — the gesture won over the look"
date: 2026-10-30T11:41:41+09:00
app: "notequiz"
tags: ["devlog", "design", "android"]
summary: "The account sheet is now one grouped list of rows, and in edit mode the (−) slides the row open to reveal Delete instead of asking right away. A decision iOS reversed within a day, now on Android too."
---

Accounts now sit as rows in one grouped list instead of a stack of cards. In edit mode, tapping the red (−) no longer jumps to a confirmation: the row slides left and reveals **Delete**, the way Settings does.

## A card per account became a row in one group

![Two accounts and Add account as rows in one group; the active account has a filled avatar and a check](/blog/notequiz-account-sheet-rows/account-rows.png)

- The account rows and **Add account** share one group, and "Each account keeps its own records" is its footer.
- The avatar shrank from 52 to 40, and the active account no longer wears a ring: just a filled avatar and a check.

| In edit mode | Before | Now |
|---|---|---|
| Tap (−) | "Delete this account?" at once | Row slides, Delete appears, tapping it asks |
| Tap an open row | — | The row closes (no rename) |
| Reorder handle | Needed a long press on iOS | Lifts on touch |

![The (−) has slid an account row left, revealing a red Delete at its end](/blog/notequiz-account-sheet-rows/minus-reveals-delete.png)

Deleting an account deletes its records, so the confirmation after **Delete** stays.

## Cards and system gestures can't share a list

On iOS the morning version kept the cards by drawing its own (−) and handle, because the system controls follow cell margins and slipped outside the card on a folding iPhone. The cost showed up right away: the handle needed a long press, and the (−) couldn't slide the row. The feedback was short: just make it behave like the system.

We weighed three options. Keeping cards with hand-drawn controls left both rejected gestures in place. System rows only while editing would reshape the whole list on every Edit tap. System rows all the time loses a little of the "pick a person" weight, but every control lines up on every device. We picked the third, and the avatar and the "since" date still carry the person.

## Same decision, different build on Android

Android has no system edit row, so the sheet draws the grammar itself. One card holds rows that draw no surface of their own. The (−) slides the row by the Delete button's width, and the card clips what slides past its edge.

Two things differ from iOS:

- **Delete is as wide as its word.** A fixed 80dp can't hold French *Supprimer* or Portuguese *Excluir* at 17sp, so the button is measured first and the row slides by that width. 80dp is only the minimum.
- **TalkBack keeps Move up / Move down.** iOS dropped them because its system handle already speaks reordering. Android has no such handle, and without these actions TalkBack users couldn't reorder accounts at all.

![In French, Delete widens to fit Supprimer on one line](/blog/notequiz-account-sheet-rows/delete-french.png)

## Where it stands

Deleting from edit mode now takes the same three steps as iOS. Instrumented tests and the manual QA checklist check that the (−) doesn't ask right away, that tapping an open row doesn't open rename, and that long translations don't clip.

## 2026-10-30 — Tapping Edit made the sheet shake

On Android, tapping **Edit** on the account sheet made the top bar look like it twitched. A screen recording stepped at 60 fps showed two causes.

The sheet itself: edit mode removes the **Add account** row, and a half-height sheet is anchored to the bottom, so it dropped about 55 dp in a single frame — right while the Edit capsule was shrinking into a round X. The button: two size animations were stacked, the outer one chasing the inner one's size and restarting every frame.

Now one 0.2 s progress drives the button's width and its cross-fade, and the Add row folds on the same 0.2 s, so the sheet glides down while the button changes.

![Left, the account sheet at rest; right, in edit mode — the sheet has come down by the folded row](/blog/notequiz-account-sheet-rows/edit-mode-glide-dark.png)

Neither showed in the code: the row was a one-line `if`, and each animation looked fine on its own. The frames made the one-frame drop obvious.

Two more fixes from the same pass:

- **Dark sheets had no edge.** The sheet used the screen's near-black ground under a 32 % scrim. Inside sheets, dark mode now lifts both the ground and the cards one step and dims the screen behind at 50 %, as iOS elevates its sheets. Light mode already read clearly and is unchanged. Along the way the titles turned black — Material can't find a text colour for a background outside the theme, so we pass it explicitly — and the account rows stayed a shade darker because their colour was read before entering the sheet.
- **The Easy/Hard toggle looked boxy.** Its 8 dp track and 4 dp segment sat among capsule buttons. Both are capsules now, as on iOS, and the stats clef toggle follows.

![The note range sheet in dark mode: lifted above the screen behind it, with a capsule Easy/Hard toggle](/blog/notequiz-account-sheet-rows/range-sheet-dark-capsule.png)

## History

- 2026-10-29 — Account cards became grouped rows; (−) slides the row open to reveal Delete
- 2026-10-30 — Edit no longer drops the sheet in one frame; dark sheets lift; capsule toggle
