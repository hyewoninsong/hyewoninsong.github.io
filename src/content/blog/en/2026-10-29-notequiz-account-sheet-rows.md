---
title: "We dropped the account cards for Settings-style rows — the gesture won over the look"
date: 2026-10-29T20:41:25+09:00
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
