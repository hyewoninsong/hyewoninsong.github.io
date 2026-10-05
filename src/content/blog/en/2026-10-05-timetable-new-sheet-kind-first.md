---
title: "New timetables start with the type, and Return creates them"
date: 2026-10-05T13:29:17+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "The New Timetable sheet now opens with nothing selected. Pick the vertical axis and the name field appears; Return creates the timetable. Tapping outside only lowers the keyboard — and building that showed that a blocked sheet stays silent when you tap its dimmed backdrop."
---

Creating a timetable in SuperTimetable now goes in one order: pick the vertical axis (by time or by period), then type a name. Pressing Return creates the timetable instead of just closing the keyboard.

## The sheet opens with nothing selected

![New Timetable sheet with both axis cards gray, no name field, and a dimmed confirm button](/blog/timetable-new-sheet-kind-first/no-kind-picked.png)

You see two cards and nothing else. No name field, no keyboard, and the confirm button is disabled. Tap a card and the name field unfolds under it with the cursor in place.

![After picking "by time": the card has a blue border, the name field is focused, and the keyboard's Return key is a blue checkmark](/blog/timetable-new-sheet-kind-first/kind-picked-name-focused.png)

| You do | What happens |
|---|---|
| Tap a card | The name field appears and the keyboard comes up |
| Type a name, press Return | The timetable is created and the sheet closes |
| Tap outside the field | Only the keyboard goes down; the sheet and your text stay |
| Then tap confirm | The timetable is created |

Leaving the name empty is fine; it becomes "New Timetable", "New Timetable (2)", and so on.

## Six days ago we chose the opposite

The earlier rule preselected the type of the timetable you were looking at, so most people could type a name and be done. We reversed it.

- **Preselecting** is fast, but the axis cannot be changed after creation. A card that is already blue reads as "decided", not "choose".
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
