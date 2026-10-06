---
title: "Switch the list to titles and Duplicate was gone"
date: 2026-10-06T19:50:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The title-only view of the timetable list had no duplicate button — the action only lived in a long-press menu. Each row now has its own, and two other placements lost."
---

The timetable list has two views: preview cards you swipe through, and a plain list of titles. The card view floats a duplicate button on the current card. Switch to titles and there was no button. Duplicate still existed — inside the menu you get by long-pressing a row — but a user said "there's no duplicate button in list view," and they were right. An action with no visible entry point is a missing action.

## One duplicate button per row

Every row in the title list now ends with a duplicate icon, after the selection checkmark. Tapping it opens the same "Duplicate Timetable" name alert the card view uses, pre-filled with "Copy." At the 20-timetable limit the button stays put but dims and stops responding. In edit mode the reorder handle takes that spot, so the button steps out. The long-press menu keeps its Duplicate item.

![Each row in the title list ends with a duplicate icon; the selected row shows its checkmark first](/blog/timetable-list-row-duplicate/list-row-duplicate.png)

## Why not the card view's floating button

The obvious move was to float the card view's duplicate button over the title list too. It doesn't work. That button duplicates "the card you're looking at." The title list has no such card. It could only duplicate the checked timetable — the one already open — and to aim at another row you'd tap it, which opens that timetable and closes the sheet. There is no way to change the target.

The second option was a swipe action. That doesn't solve the problem: a swipe is as invisible as a long press, so "there's no duplicate button" stays true. The list also deliberately has no per-row delete control — deletion is one bottom button plus a confirm alert in edit mode — and opening a swipe grammar just for duplicate would cut against that.

So each row gets its own button. The target is the row itself, and it's visible.

## One button almost swallowed the row

Two buttons in one SwiftUI `List` row need care. Tapping anywhere in the row fires every button with the automatic style. The row's own button opens the timetable; left alone, tapping to open would also pop the duplicate alert. `.buttonStyle(.borderless)` on the duplicate button limits it to its own frame.

The button also had to sit beside the row button, not inside its label. The row merges icon, name, and checkmark into one accessibility element, and a button inside that merge disappears from the accessibility tree — VoiceOver can't reach it and neither can a UI test. This app has hit that twice, so this time it was a sibling from the start.

Four simulator captures confirmed it: the button on each row, the alert on tap, the button gone in edit mode, and a row tap closing the sheet with no alert. The last one is the proof for `.borderless`.

The captures also caught a sizing mistake. The button started at 44pt tall, which made normal rows 12pt taller than edit-mode rows, so the list jumped every time edit mode toggled. Matching the row's 28pt kind icon made both modes pixel-identical; the row itself supplies the vertical touch area.

## Where it stands

The test for whether the title list is missing something the card view has is simple: is there a visible entry point. Menus and swipes don't count. Rename still exists in neither view. That's next.

## 2026-10-06 — Switching views keeps your place

Switching between the two views used to lose your place. Swipe a dozen cards in, switch to titles, and the list started at the top. Switch back and you got whichever card you had last swiped to, not the timetable that is actually open.

Each direction now has a target.

| Direction | Scrolls to |
|---|---|
| Cards → titles | The row of the card you were previewing |
| Titles → cards | The selected timetable (the checked row) |

The targets differ because "what I'm looking at" means different things. The card view has a centered card. The title list has only the check. In edit mode the check marks the delete target, so that one stays centered when you return to cards. An automatic scroll must never change what gets deleted.

Titles → cards worked first try: set the centered card just before the view value changes, and the new pager is built already there.

The other direction looked correct and did nothing. `scrollTo` ran on appear with the right id. Deferring it one runloop, or 0.3 seconds, changed nothing. Logging showed the list appearing twice:

```
19:35:53.030  list appeared, target set    ← read and cleared
19:35:53.041  list appeared, target nil    ← 11ms later, the one that stays
19:35:53.345  scroll fired                 ← on the first, already-detached list
```

The cause was the search field. Search exists only in the title list, and `.searchable` has no off switch, so it is attached with an `if`. Switching views flips that branch, which rebuilds everything under it. The title list is attached once, then immediately replaced. The first instance consumed the one-shot target and the survivor had nothing.

The fix is about who owns the value's lifetime. The list scrolls on every appear while a target exists and never clears it. The side that switched views clears it half a second later. The scroll runs without animation, because the switch itself is animated and the list would otherwise slide down from the top.

Verified with eighteen timetables in both directions. Under a modifier that is attached and detached by a conditional, "once, on appear" may not be once.

## History

- 2026-10-03 — A duplicate button on every title row
- 2026-10-06 — Keeping scroll position across the view switch
