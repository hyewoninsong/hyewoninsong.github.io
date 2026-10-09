---
title: "New timetables start with the type, and Return creates them"
date: 2026-10-09T01:45:00+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "The New Timetable sheet now opens with nothing selected. Pick the vertical axis and the name field appears; Return creates the timetable. Tapping outside only lowers the keyboard — and building that showed that a blocked sheet stays silent when you tap its dimmed backdrop."
---

On Oct 5, creating a timetable in SuperTimetable went in one order: pick the vertical axis (by time or by period), then type a name, and Return created the timetable. On Oct 9 that sheet became a name-only alert and the axis is picked in the Display sheet that opens right after — see the last section. The sections in between are kept as they were written.

## The sheet opens with nothing selected

![New Timetable sheet with both axis tiles gray, no name field, and a line under them saying the choice can be changed later](/blog/timetable-new-sheet-kind-first/no-kind-picked.png)

You see two cards and nothing else. No name field, no keyboard, and the confirm button is disabled. Tap a card and the name field unfolds under it with the cursor in place.

![After picking "by time": the tile has a blue border, the line under it describes that axis, and the name field is focused](/blog/timetable-new-sheet-kind-first/kind-picked-name-focused.png)

| You do | What happens |
|---|---|
| Tap a card | The name field appears and the keyboard comes up |
| Type a name, press Return | The timetable is created and the sheet closes |
| Tap outside the field | Only the keyboard goes down; the sheet and your text stay |
| Then tap confirm | The timetable is created |

Leaving the name empty is fine; it becomes "New Timetable", "New Timetable (2)", and so on.

## Six days ago we chose the opposite

The earlier rule preselected the type of the timetable you were looking at, so most people could type a name and be done. We reversed it.

- **Preselecting** is fast, but at the time the axis could not be changed after creation (since October 6 it can, from the Display sheet). One reason still stands: a card that is already blue reads as "decided", not "choose".
- **Showing the name field from the start** raises the keyboard immediately, so people type before they look at the cards.
- **Return only closing the keyboard** makes a one-line form ask for the same confirmation twice.

One exception: a deep link that says "create a period timetable" still opens with that type selected.

## The dimmed backdrop said nothing

There are two "outsides": empty ground inside the sheet, and the dimmed area above it. This is a short, content-height sheet, so a tap on the dimmed area normally dismisses it, taking the half-typed name with it.

The plan was to disable dismissal while the keyboard is up (`interactiveDismissDisabled`) and lower the keyboard when UIKit reports a blocked attempt through `presentationControllerDidAttemptToDismiss`. The app already had that plumbing in two other sheets.

It did not work for taps. Logging the two gestures separately:

| Gesture | Callback |
|---|---|
| Drag the sheet down | Fires |
| Tap the dimmed area | Does not fire |

On a sheet whose dismissal is blocked, a backdrop tap is dropped silently. The callback is tied to the pull-down gesture only. The two existing uses were near-full-height sheets where only the drag had ever been tested.

Backdrop taps are now caught separately: a `UIGestureRecognizer` on the window that never succeeds and only reports where a touch began. If that point is outside the sheet's frame, the keyboard goes down. The frame is measured with `convert(_:to: nil)`, because SwiftUI's `.global` space inside a sheet is relative to the sheet, not the window.

A UI test now performs all three — ground tap, backdrop tap, drag — and checks each time that the keyboard is gone, the sheet is still there, and the typed text survived.

## What is left

On iPad this is a centered form sheet with different sizing rules. The flow runs the same code, but it has not been captured on an iPad screen yet.

## 2026-10-06 — One tile for the same choice on two screens

The axis can now be changed after creation, from the top of the Display sheet. That gave the app two controls for one choice, and they looked different: large cards with a radio button and a caption in the New Timetable sheet, small icon-and-name tiles in the Display sheet.

![The New Timetable sheet before: two tall cards, each with a large icon, a radio button, a name and a two-line caption](/blog/timetable-new-sheet-kind-first/cards-before.png)

The catch is the order. Creating a timetable opens the Display sheet right away, so you met the card you had just tapped again two seconds later in another shape.

Both sheets now use the same view.

![Top of the Display sheet: the same two tiles as the New Timetable sheet, a one-line caption under them, then the day and period cards](/blog/timetable-new-sheet-kind-first/display-sheet-tiles.png)

| | Before | Now |
|---|---|---|
| Icon | 88pt / 44pt | 56pt in both |
| Selection | radio + blue border / blue border | blue icon + blue border |
| Caption | two lines inside the card / none | one line under the pair, for the selected axis |

The caption moved out of the tile for two reasons. Inside a half-width tile the French and Spanish captions wrapped, so tile height changed per language. And the Display sheet, where people come to switch, had no caption at all. Before anything is picked, that line says the choice can be changed later.

Folding the New Timetable sheet into the Display sheet lost: that sheet's point is the live timetable behind it, and before creation there is none to show.

## Shorter tiles put the name field behind the keyboard

Only the tiles changed, yet after picking an axis the lower half of the name field sat behind the keyboard.

The sheet is sized to its measured content. Picking an axis does two things at once: the name field unfolds (88pt taller) and it takes focus, raising the keyboard. Printing the measured value in the sheet title showed the content height had updated (197 → 285), but the sheet had been lifted above the keyboard at its old height.

| Variant | Result |
|---|---|
| Old tall cards (content 316 → 404) | Fine |
| New tiles (197 → 285) | Field covered |
| New tiles + 53pt bottom padding | Fine |
| New tiles + focus 0.05s later | Fine |
| Animation speed, caption transition off | Still covered |

Focus is now given 0.1s after the pick, so the sheet grows first. Why the taller content never hit this is still unexplained; we treat the old layout as lucky, not correct.

The first capture almost got waved through: a fresh simulator shows a typing-tips panel on its first keyboard, and that looked like the cause. Dismissing it and capturing the unchanged code the same way settled it.

## 2026-10-09 — The type sheet is gone: name only, pick the type after

Four days later this flipped again. The `+` button now shows a small alert with one name field, Cancel and Add. It does not ask for the vertical axis. Add creates a by-time timetable and the Display sheet opens right away; if you want periods, you pick that on the tiles at the top of that sheet.

![The Display sheet that opens right after creating a timetable — By Time is selected on the vertical-axis tiles, and tapping By Period switches in place](/blog/timetable-new-sheet-kind-first/display-sheet-after-create.png)

| | Oct 5 | Now |
|---|---|---|
| Tapping `+` | A sheet with two tiles | An alert asking only for a name |
| Vertical axis | Pick it to reveal the name field | Not asked; created by time |
| Want periods | Choose while creating | Choose in the sheet that opens next |

The Oct 6 section already described the problem: creating a timetable opens the Display sheet, which has the same tiles. Back then we made the two look alike. Once they looked alike, what remained was the same question asked twice, two seconds apart.

Type-first rested on "a heavy decision should not hide behind a light input". The weight is gone: the axis can be changed any time, and a fresh, empty timetable has nothing to lose, so switching does not even ask for confirmation.

What lost:

- **Keep the sheet, preselect By Time** — tried on Sep 29 and dropped; the tiles still show up twice.
- **Do not ask for a name either** — fastest, but the Display sheet has no name field, so renaming means a trip to the list.
- **Put the name into the Display sheet** — that sheet also opens from the day header, so the field would always be there.

The store event card for "new period timetable" is still the exception: same alert, created by period.

Eight UI tests used to tap the period tile in the old sheet. Their fixture schedules are seeded only when a timetable is created as a period timetable, so those tests now enter through the same deep link the event card uses.

## History

- 2026-10-05 — Type first, Return creates. Backdrop taps are caught separately.
- 2026-10-06 — One axis tile shared with the Display sheet; fixed the name field hiding behind the keyboard.
- 2026-10-09 — Type sheet replaced by a name alert; created by time, axis picked in the Display sheet.
