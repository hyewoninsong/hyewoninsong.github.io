---
title: "Switch the list to titles and Duplicate was gone"
date: 2026-10-09T17:47:47+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The title-only view of the timetable list had no duplicate button — the action only lived in a long-press menu. Each row now has its own, and two other placements lost."
---

The timetable list has two views: preview cards you swipe through, and a plain list of titles. The card view floats a duplicate button on the current card. Switch to titles and there was no button. Duplicate still existed — inside the menu you get by long-pressing a row — but a user said "there's no duplicate button in list view," and they were right. An action with no visible entry point is a missing action.

## One duplicate button per row

This button was removed three days later; the current design is in the last 2026-10-06 section. What follows is the decision as it stood.

Every row in the title list then ended with a duplicate icon, after the selection checkmark. Tapping it opens the same "Duplicate Timetable" name alert the card view uses, pre-filled with "Copy." At the 20-timetable limit the button stays put but dims and stops responding. In edit mode the reorder handle takes that spot, so the button steps out. The long-press menu keeps its Duplicate item.

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

The targets differ because "what I'm looking at" means different things. The card view has a centered card. The title list has only the check. In edit mode the check marks the duplicate/delete target, so that one stays centered when you return to cards. An automatic scroll must never change what gets deleted.

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

## 2026-10-06 — The per-row buttons came off; both views share one button bar

Three days later the decision above was reversed. With several timetables, every row ended in a duplicate icon, and the user's reaction was "there are too many duplicate buttons on the right." Making the action visible had filled the screen with it. And duplicate was not the only mismatch: the two views did the same jobs in different places, and there was no way to load a received timetable file from inside the list.

Both views now follow one frame. Normally you pick and create. Operations happen in edit mode, on one target.

| | Normal | Edit |
|---|---|---|
| Bottom bar | Import from file · New timetable | Duplicate · Delete |
| Target | none (tap opens) | centered card, or the checked row |
| Reorder | — | arrows on the card, or drag the row |

![Card view, normal: an import button and New Timetable at the bottom, nothing floating on the card](/blog/timetable-list-row-duplicate/bar-normal-cards.png)

![Card view, edit: the bottom bar becomes Duplicate and Delete; only the reorder arrows sit on the card](/blog/timetable-list-row-duplicate/bar-edit-cards.png)

![Title list, normal: no per-row duplicate icons, same bottom bar as the card view](/blog/timetable-list-row-duplicate/bar-normal-titles.png)

The floating button on the card, the per-row button, and the long-press menu are all gone. Delete is irreversible, so it stays a separate button rather than sharing a group with Duplicate.

The earlier objection to a single button in the title list was that you couldn't change its target, because tapping a row closes the sheet. Edit mode already had the answer: there, a tap moves the check instead. Delete was using that check as its target, so Duplicate now does too. Entering edit mode starts the check on the open timetable, so the two buttons are never both locked with no hint why.

Three options lost. Keeping Duplicate in normal mode leaves the row of icons, or needs a separate "pick a row to duplicate" step — built once, then dropped, because edit mode's check already is that step. Moving only the title list's Duplicate into edit mode was rejected first for making the views differ; moving both removed the objection. Putting file import inside the New Timetable sheet is tidier but one level deeper, and that sheet is about choosing a timetable type.

The cost: duplicating from the card view takes one more tap.

File import is a new entry point, not a new path. It calls the same function as opening a timetable file from the Files app, so the read-failure alert and the count limit come with it. One difference: a file opened from outside asks whether it is a friend's timetable or yours; a file picked from the list goes straight into your timetables, because picking it there is the answer.

The test from above still holds — is there a visible entry point. What changed is that the entry point is one bar acting on a chosen target, not a button on every row.

## 2026-10-07 — The bottom bar is two round buttons and a search field

A day later the bar changed shape. The positions stayed: create things normally, act on one target in edit mode.

| | Left | Centre | Right |
|---|---|---|---|
| Normal | Import from file | Search | New timetable `+` |
| Edit | Duplicate | Search | Delete |

The normal row was reordered a day later — search now comes first. See the 2026-10-08 section below.

![Card view, normal: import on the left, a search field in the centre, a round + on the right. The view toggle and Edit sit apart at the top](/blog/timetable-list-row-duplicate/bottom-toolbar-normal.png)

![Card view, edit: Duplicate, search, a red Delete; the top-right button is now an X](/blog/timetable-list-row-duplicate/bottom-toolbar-edit.png)

The full-width New Timetable button became a round `+`, and Duplicate and Delete lost their labels. The space that freed up went to search. Search used to live only in the title list, at the top; it was kept out of the card view because the top looked crowded. At the bottom that objection is gone, so both views share the field.

Leaving edit mode is now an X instead of a checkmark. Reorder, duplicate and delete all apply immediately, so there is nothing to confirm. The sheet's own close button hides meanwhile, so there is never a choice between two X's.

The bar is the system bottom toolbar, not a hand-drawn row: `ToolbarItem(placement: .bottomBar)` at each end and `DefaultToolbarItem(kind: .search, placement: .bottomBar)` between them. The glass, the disabled look, rising above the keyboard and collapsing the side buttons while searching all come free.

![Searching in the card view: the field rides above the keyboard, the side buttons collapse, the navigation bar stays](/blog/timetable-list-row-duplicate/bottom-toolbar-search.png)

One default was changed. Searching normally hides the navigation bar, which makes the card jump and takes the view toggle away; `.searchPresentationToolbarBehavior(.avoidHidingContent)` keeps it. Splitting the two top-right buttons is a `ToolbarSpacer(.fixed)` between them.

Search used to be ignored in edit mode, because drag-to-reorder reports positions in the full list and a filtered list would move the wrong timetable. With the field always visible, typing into it and seeing nothing happen reads as broken. So search now always applies, and only reordering locks while a filter is active. If the chosen target is filtered out, the target moves to the first remaining result, so nothing off-screen gets deleted.

Checked on an iPhone simulator in both views; not yet on iPad.

## 2026-10-08 — Search leads the normal bar; the two create buttons sit together

The normal row changed order a day later. The edit row did not.

| | First | Second | Third |
|---|---|---|---|
| Normal | Search | Import from file | New timetable `+` |
| Edit | Duplicate | Search | Delete |

![Card view, normal: the bottom bar reads search field, import, round + from the left, with the two buttons side by side on the right](/blog/timetable-list-row-duplicate/bar-search-first-normal.png)

Both normal buttons add a timetable; they now sit together on the right and the search field starts at the left edge. In edit mode the field moves back to the middle, between Duplicate and Delete, as before.

In code, the whole item order now branches on edit mode instead of swapping buttons inside fixed end items: where `DefaultToolbarItem(kind: .search, placement: .bottomBar)` is written is where the field lands. A `ToolbarSpacer(.fixed)` between the two normal buttons keeps them as separate circles. Measured frames match across both views. Still not captured on iPad.


## 2026-10-09 — Switching views fades out, swaps, and fades in

The timetable list can be shown as swipeable preview cards or as a plain list of titles. Until now, tapping the toggle swapped one for the other instantly. Now the old content fades out and the new content rises in.

### Only the content moves

![Four frames of the switch from cards to the title list: the card, the card fading, the list row rising in, the settled list](/blog/2026-10-03-timetable-list-row-duplicate/style-switch-fade-frames.png)

The frames come from a build slowed down ten times. At real speed the whole thing takes under 0.4 seconds.

| Beat | Length | What happens |
|---|---|---|
| Out | 0.12s | Cards (or rows) and the page dots fade |
| Swap | 0.05s | The view style changes while hidden; the toggle icon changes too |
| In | 0.22s | New content grows from 0.97 to full size as it appears |

The title, the close button, and the bottom search bar stay still. Tapping the toggle again during the fade-out cancels the switch and brings the original view back.

### A crossfade had nowhere to live

The usual SwiftUI answer is `withAnimation` plus `.transition(.opacity)`. That needs the old and new views to exist in the same tree for a moment.

Here they never do. The `NavigationStack` is recreated with `.id` whenever the style changes, because the search field's placement is decided when the stack is first built. Two alternatives lost:

- **Crossfading the whole stack** makes the navigation bar and bottom toolbar flicker along with the content.
- **Morphing a card into a row** with `matchedGeometryEffect` needs both sides in one tree, and the card preview is a pre-rendered image with no in-between shape.

So the transition is split into three beats driven by one flag that lives *outside* the stack. Content inside the stack reads the flag for its opacity and scale. When the stack is rebuilt, the flag is still set, so the new content is born hidden and then revealed.

```swift
withAnimation(.easeIn(duration: 0.12)) { isContentHidden = true }
Task { @MainActor in
    try? await Task.sleep(for: .seconds(0.12))
    listStyle = newStyle                      // no animation, while hidden
    try? await Task.sleep(for: .milliseconds(50))
    withAnimation(.easeOut(duration: 0.22)) { isContentHidden = false }
}
```

### What the 50ms gap is for

A view revealed in the same update it was inserted in simply appears opaque; nothing animates. The reveal has to come one beat later. The gap also hides the title list scrolling to the open timetable's row, which happens one run loop after the list appears.

With Reduce Motion on, the scale change is dropped and the fade stays.

### What's left

The timings were chosen in the simulator. They still need to be felt on a real device.

## History

- 2026-10-03 — A duplicate button on every title row
- 2026-10-06 — Keeping scroll position across the view switch
- 2026-10-06 — Per-row duplicate removed; one button bar for both views, plus file import
- 2026-10-07 — Bottom bar becomes two round buttons with search between; leaving edit mode is an X
- 2026-10-08 — Normal bar reordered to search, import, new timetable (edit keeps search in the middle)
- 2026-10-09 — View switch animation (hide, swap, reveal)
