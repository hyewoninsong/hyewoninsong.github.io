---
title: "The title and the tabs said the same thing twice — the title is gone, and the device decides where the tabs go"
date: 2026-11-12T08:48:51+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The list sheet lost its title. The Timetables | Calendars control moves into the top row only on the foldable; everywhere else it stays in a thinner row under the buttons. A first attempt that split by language was thrown away."
---

The list sheet had a title, "Timetables", and right under it a segmented control: `Timetables | Calendars`. Pick the other segment and the title changed to "Calendars". The same information, twice.

## No title, and the device decides where the control goes

The title text is gone everywhere. Where the control sits depends on the device.

On the foldable, the folded screen is short, but close and view-style move to a vertical strip on the side, leaving only Edit in the top row. The control moves up beside it and a whole row is saved.

![Foldable list sheet: the segmented control shares the top row with Edit; the other buttons sit in a side strip](/blog/timetable-list-segment-title/duo-top-row.png)

On a regular iPhone the screen is tall and the top row is full of buttons. The control stays right under them, with its top padding removed.

![Regular iPhone list sheet: the control sits in a full-width row directly under the buttons, no title](/blog/timetable-list-segment-title/phone-row-below.png)

## The first version split by language. It was the wrong axis.

At first the control went into the title slot on every device. Korean looked clean. French did not.

![French list sheet with the control truncated to Emplois… | Calendr…](/blog/timetable-list-segment-title/fr-truncated.png)

A regular iPhone leaves 150–190pt in the title slot, and a segmented control gives both segments the width of the longer word. Most of the app's 18 languages did not fit, English included.

So the next version measured text and moved the control up only where it fit. It worked, but the same phone now had two layouts depending on language, and few languages qualified. Whether the top row is free is not a property of the language. It is a property of the device's toolbar layout — and splitting there means everyone on the same device sees the same screen.

## Detecting the side strip

The check does not ask for a device name. It reads the sheet's horizontal safe-area insets: a strip is a wide inset on one side only. A landscape iPhone has insets too, but on both sides. The text-width check survives as a guard: on the foldable, a language too long to sit beside Edit — French, today — keeps the control in the row below.

## Where it stands

Verified on the simulator's folded posture and a regular iPhone. The unfolded posture, iPad and real devices are still unchecked.

## 2026-11-12 — The side strip folds buttons when the keyboard comes up. We left it alone.

On the foldable, tapping `+` in the list asks for a name, and the keyboard rises. At that moment everything below Close and the view toggle collapses into a single `…`: Edit, Search, Import and `+` all disappear.

![Foldable list sheet: six buttons in the side strip normally; with the New Timetable alert and keyboard up, everything below Close and the view toggle is folded into …](/blog/timetable-list-segment-title/duo-keyboard-collapse.png)

A view-hierarchy dump before and after the keyboard showed the strip itself doing it. It pulls the bottom group up above the keyboard (from 612pt to just above the keyboard's top edge at 389pt), and whatever no longer fits in the shortened strip goes into `…`. The strip's safe area does not change; it tracks the keyboard on its own.

What we tried: `ignoresSafeArea(.keyboard)` on the stack, swapping the search item for a plain button, moving the bottom items to `topBarTrailing` behind a flexible spacer, and removing the bottom group alone. None worked — with `.searchable` attached, the system puts a search item back at the bottom and lifts it above the keyboard. Removing the bottom group **and** `.searchable` while the alert is up did work: the top three buttons stayed put.

![Left: the strip folded into … as shipped. Right: the workaround with the bottom group and search removed — Close, view toggle and Edit stay in place](/blog/timetable-list-segment-title/duo-keyboard-workaround.png)

We did not ship it. Tearing down toolbar items and search for a few seconds of keyboard is a hack over a system-owned layout, and iOS 27.1's vertical-bar APIs offer no switch for this. The fold is the device's behavior; we leave it.

The lesson: on a side-strip device, capture the keyboard-up state too.

## History

- 2026-11-11 — Removed the list title; the device's toolbar layout decides where the tabs go
- 2026-11-12 — The strip folds buttons under the keyboard; found a workaround, kept the system behavior
