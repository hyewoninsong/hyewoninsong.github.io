---
title: "The title and the tabs said the same thing twice — so the tabs became the title"
date: 2026-11-11T23:50:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The list sheet lost its title text and the Timetables | Calendars segmented control moved into the title slot. One row saved where the words are short; where they are long, the control stays put."
---

The list sheet had a title, "Timetables", and right under it a segmented control: `Timetables | Calendars`. Pick the other segment and the title changed to "Calendars". The same information, twice, at the cost of a row.

## The segmented control is the title now

The title text is gone and the control sits in the navigation bar's title slot, next to close, view style and Edit. The cards move up by one row.

![Korean list sheet with the segmented control in the title slot and no title text](/blog/timetable-list-segment-title/ko-title-slot.png)

In SwiftUI this is a `Picker` in `ToolbarItem(placement: .principal)`. The `navigationTitle` value stays, unseen, because VoiceOver still reads it as the screen's name.

## It fit in Korean. It did not fit in French.

![French list sheet with the control truncated to Emplois… | Calendr…](/blog/timetable-list-segment-title/fr-truncated.png)

The title slot has 150–190pt left after the bar buttons. A segmented control gives both segments the width of the longer word, so the Korean labels need 116pt and "Emplois du temps | Calendriers" needs about 280pt. The longer "Modifier" button takes even more of the bar. Out of 18 languages, most did not fit, English included.

The control is now the only text that says which list you are in. Two truncated words cannot do that job.

## Where it does not fit, it does not move

The title text is gone in every language. The control moves up only where it fits; elsewhere it stays in its own row below the bar.

![French list sheet with the control in a full-width row below the bar, nothing truncated](/blog/timetable-list-segment-title/fr-row-below.png)

What lost:

- **Move it everywhere and let it truncate.** See above.
- **Shorten the long labels.** They are the app's vocabulary; one screen should not rename things to save space.
- **`ViewThatFits` on the real remaining width.** That width changes with state: Edit turns into an X in edit mode, and an empty list has no buttons at all. A borderline language would see the control jump rows on every tap.

Instead the decision is made once, from measured text widths, against the bar at its most crowded. If it fits there it fits in every other state, so the control never changes rows within a language. A unit test pins the expected side for several languages, so a copy change that crosses the line shows up as a failing test.

## Where it stands

Languages with short words saved a row; the rest only lost the redundant title. On the foldable, where bar buttons move to a side strip, the top row has far more room than the check assumes — long languages could move up there too. iPad and real devices are still unchecked.
