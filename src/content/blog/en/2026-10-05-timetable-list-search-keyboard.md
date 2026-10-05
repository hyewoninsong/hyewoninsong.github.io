---
title: "Opening the keyboard to search squashed the timetable card"
date: 2026-10-05T14:15:12+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Tapping the search field in the timetable list redrew each card at half height. The modifier meant to prevent that was already in the code, attached in a place where it never did anything."
---

Tapping the search field in the timetable list now brings up the keyboard and nothing else. The card keeps its size; the keyboard covers its lower part.

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

In card view the "New Timetable" button is hidden while the keyboard is up. And any screen that gains a text field now gets one capture with the keyboard showing.
