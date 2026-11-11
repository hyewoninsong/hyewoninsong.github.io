---
title: "The title and the tabs said the same thing twice — the title is gone, and the device decides where the tabs go"
date: 2026-11-12T00:10:00+09:00
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
