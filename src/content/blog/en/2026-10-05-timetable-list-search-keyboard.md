---
title: "Opening the keyboard to search squashed the timetable card"
date: 2026-10-05T18:55:00+09:00
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

Same placement argument, different result depending on where the modifier sits. We confirmed this by moving it within one build on an iOS 27.2 simulator; we did not find out why. It is the same family as the keyboard issue: modifiers that feed the navigation bar go on the outermost view inside the stack. Filtering worked either way, so only a capture showed it.

## History

- 2026-10-05, midday: the card no longer shrinks when the search keyboard appears.
- 2026-10-05, evening: search removed from card view, kept in the title list.
