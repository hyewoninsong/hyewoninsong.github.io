---
title: "Opening the keyboard to search squashed the timetable card"
date: 2026-10-07T00:48:49+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Tapping the search field in the timetable list redrew each card at half height. The modifier meant to prevent that was already in the code, attached in a place where it never did anything. That evening the card view lost its search field altogether."
---

Tapping the search field in the timetable list was fixed to bring up the keyboard and nothing else: the card keeps its size and the keyboard covers its lower part. That same evening the card view lost the search field entirely; the last sections cover that.

## The whole screen redrew when the keyboard appeared

The list shows one timetable per card, and the card's height comes from measuring the free vertical space. When the keyboard halved that space, the card redrew at half height, and the page dots and the "New Timetable" button rode up on top of the keyboard.

![Before searching: the card fills the sheet](/blog/timetable-list-search-keyboard/list-idle.png)

![Search field focused: same card size, keyboard over the bottom](/blog/timetable-list-search-keyboard/list-keyboard.png)

The card shifts up by the height of the collapsed title bar. That is the system search behavior and we left it alone.

## The modifier was there, in the wrong place

`.ignoresSafeArea(.keyboard)` was already in the code, attached outside the `NavigationStack`.

```swift
NavigationStack {
    VStack { … }              // still avoids the keyboard
}
.ignoresSafeArea(.keyboard)   // outside the stack, never reaches the content
```

Moving it onto the `VStack` inside the stack, next to `.navigationTitle` and `.searchable`, stopped the card from resizing. That conclusion rests on the screens before and after the move, not on framework internals.

Nobody noticed because the screen had no text input when the modifier was added, so the keyboard never appeared. When search shipped, we captured filtered results but not the screen with the keyboard up.

## The title list still avoids the keyboard

The list has a second view with titles only. There the keyboard is still avoided: otherwise rows under the keyboard cannot be scrolled into view. Rows do not change size, so nothing looks squashed.

The rule we kept: content sized from measured space ignores the keyboard; scrolling lists avoid it.

## What is left

In card view the "New Timetable" button was hidden while the keyboard was up; that went away in the evening along with card-view search. And any screen that gains a text field now gets one capture with the keyboard showing.

## 2026-10-05, evening: card view no longer has search

On a real device the fixed screen showed a different problem. Card view had one row for close, title, view switch and edit, and a second row for the search field. Two header rows over a single card is busy.

The search field now appears only in the title list. Card view is back to one row.

![Card view with a single header row](/blog/timetable-list-search-keyboard/cards-no-search.png)

![Title list with the search field under the title bar](/blog/timetable-list-search-keyboard/titles-search-top.png)

Flipping cards is for glancing at a few timetables; finding one by name belongs to the list. Card view ignores the query, and the query is cleared when you switch back to cards, so an invisible query never filters them.

Three options lost:

- Collapse search into a magnifier button and fold view switch and edit into one menu. Cleanest, but edit costs an extra tap.
- Add only a magnifier button. One row fewer, three buttons on the right.
- Keep the field hidden in the title list until you pull down. A hidden field goes unnoticed.

## The search field landed at the bottom of the screen

Since only the title list needs it, we attached `.searchable` to that list view. The field then appeared at the bottom of the screen, under the "New Timetable" button.

![Attached to the list view: the search field sits at the bottom](/blog/timetable-list-search-keyboard/titles-search-bottom.png)

```swift
// field goes to the bottom
case .titles: titleList.searchable(text: $query, placement: .navigationBarDrawer)

// field sits under the title bar
VStack { … }
    .navigationTitle("Timetables")
    .modifier(TitleListSearch(isEnabled: style == .titles, text: $query))
```

Same placement argument, different result depending on where the modifier sits. We confirmed this by moving it within one build on an iOS 27.2 simulator; we did not find out why. It is the same family as the keyboard issue: modifiers that feed the navigation bar go on the outermost view inside the stack. That turned out to be half the rule; the next section has the other half. Filtering worked either way, so only a capture showed it.

## 2026-10-07: on the outermost view, attached late, it went to the bottom again

Two days later a report came in: the search field sometimes shows up under the "New Timetable" button. The modifier was still where we had put it.

"Sometimes" was the clue. We measured the field's y position along each way into the screen.

| Path | Search field y | Button y |
|---|---|---|
| Sheet opened in card view, then switched to the title list | 808 | 727 |
| Same sheet after toggling edit mode or the new-timetable sheet | 808 | 727 |
| Sheet opened in the title list | 132 | 779 |
| Switching back and forth after that | 132 | 779 |

Placement is decided when the `NavigationStack` is first created and is not revisited. A stack born in card view has no search; attaching `.searchable` afterwards ignores `placement`. The view mode is persisted, so only people who last closed the sheet in card view hit it.

The fix is one line: rebuild the stack when the view mode changes.

```swift
NavigationStack {
    VStack { … }
        .modifier(TitleListSearch(isEnabled: style == .titles, text: $query))
}
.id(style)
```

Every path now measures 132. A rebuilt stack reruns its `.task`, so the one-time initial scroll moved outside the stack. Query and edit-mode state already lived outside it.

Two options lost: drawing our own search field (reliable position, but we would rebuild the system field's look, cancel button and keyboard handling), and leaving `.searchable` always attached (which brings back the second header row in card view).

We missed it twice for the same reason. The original fix was checked with the sheet opened in the title list. The first check of this fix also passed without touching the bug, because the previous run had left the mode on the title list. A check on a screen with a persisted setting has to put that setting back, reopen the screen, and measure each way in.

We still do not know why. Measured on an iOS 27.2 simulator; scroll position after switching with many timetables is not yet captured.

## History

- 2026-10-05, midday: the card no longer shrinks when the search keyboard appears.
- 2026-10-05, evening: search removed from card view, kept in the title list.
- 2026-10-07: fixed the search field landing at the bottom when the sheet was opened in card view and switched.
