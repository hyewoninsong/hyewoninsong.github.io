---
title: "Opening the keyboard to search squashed the timetable card"
date: 2026-10-09T22:52:39+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Tapping the search field in the timetable list redrew each card at half height. The modifier meant to prevent that was already in the code, attached in a place where it never did anything. Later the field moved to the bottom toolbar, and the duplicate and delete buttons vanished while you searched. Search also reads event titles and notes again."
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

The search field now appears only in the title list. Card view is back to one row. (Reversed two days later: the field moved to the bottom toolbar, shows in both views, and card view filters too. See the last section.)

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

## 2026-10-08: with the field in the bottom toolbar, duplicate and delete vanished while searching

Since then the search field moved into the system bottom toolbar: search, import and new timetable normally; duplicate, search and delete in edit mode. That ended the two-row header in card view, and card view now filters by the query too, reversing the rule above.

But in edit mode, searching left you with nothing to do. Tapping the field made the duplicate and delete buttons disappear; typing to narrow the list to one row and checking it did not bring them back, and neither did the keyboard's search key. The only exit was the X next to the field, which also clears the query and the filtered result with it.

![After submitting: the row is checked, the bottom bar has only the field and an X](/blog/timetable-list-search-edit-actions/search-submitted-buttons-gone.png)

A search field in the system bottom toolbar folds every other item in that bar while it is presented; they leave the accessibility tree. The keyboard's search key dismisses the keyboard but keeps the presentation. Only X ends it, and X behaves like UIKit's search cancel: it clears the text. `.searchPresentationToolbarBehavior(.avoidHidingContent)` was already set, but as the name says it is about the navigation bar.

The fix is to end the presentation ourselves. `.searchable(text:isPresented:)` exposes it, and we set it to false on submit, on a row tap in edit mode, on a card tap, and when the view mode switches. The query is untouched: the filtered list stays, and only the folded buttons come back.

![After tapping the row: the query stays, duplicate and delete are back](/blog/timetable-list-search-edit-actions/row-picked-buttons-back.png)

One more catch: dismissing programmatically left the collapsed field drawing its placeholder instead of the query. The binding still held the text, so the list stayed filtered while the field looked empty. Rebuilding the stack drew it correctly, so only the display was stale. When the presentation ends we append a space to the query and remove it on the next run loop; the field re-reads the binding, and since the filter trims whitespace the list never flickers.

We missed it because, on the day the bottom bar became a system toolbar, we confirmed that the buttons fold during search and never checked when they return. The capture stopped at focus, typing and submit. Search UI checks now include the bottom bar after submit and after picking a result.

Measured on an iOS 27.2 simulator; iPad windows not captured yet.

## 2026-10-09: search reads event titles and notes again, from two characters

List search now matches the events inside a timetable, by title or by note, as well as the timetable's name. You can find which timetable holds "Math" without opening each one.

This is the second time. Search shipped matching all three. Four days later it was cut to names only, because a single character matched nearly every timetable through some event and the name could no longer narrow anything. A day after that the request came back: there is no other place to look an event up.

Restoring it as it was would restore the problem, so it came back with two rules.

| Rule | What it prevents |
|---|---|
| Event titles and notes are searched only when the query has two or more characters | One character matching almost everything |
| Timetables matched by name come first, those matched only by an event after | Event matches burying the timetable you were looking for by name |

A timetable matched through an event says why. One line under its name lists the matching event titles with the matched part in bold, up to three and then "and N more". A note match shows the title of the event that carries the note.

![Card view, searching an event title: the matching event appears on one line under the timetable name](/blog/timetable-list-search-content/cards-caption.png)

![Title list, searching a note: the event that carries the note is shown under the name](/blog/timetable-list-search-content/titles-memo-caption.png)

![One character: no timetable has it in its name, so there are no results](/blog/timetable-list-search-content/one-char-no-result.png)

Tapping a result opens the timetable and scrolls to the first matching event, selected.

Two options lost. Restoring the original with no length floor and no ordering brings back the reason it was cut. A separate event search on another screen adds an entrance and makes people choose which search box to type in.

Results used to keep the original order always. Now they form two groups, name matches then event matches, each in its original order. Reordering is locked while filtering, so the displayed order never fights the stored one.

The floor counts characters, so a one-character word in Korean or Chinese will not match events; we will revisit per language if that hurts. The filter rules are unit tested and the screens were captured on an iOS simulator, not yet on a device.

## History

- 2026-10-05, midday: the card no longer shrinks when the search keyboard appears.
- 2026-10-05, evening: search removed from card view, kept in the title list.
- 2026-10-07: fixed the search field landing at the bottom when the sheet was opened in card view and switched.
- 2026-10-08: the bottom-toolbar search folded duplicate and delete; the presentation now ends on submit and on picking a result.
- 2026-10-09: search matches event titles and notes again, from two characters, with name matches first.
