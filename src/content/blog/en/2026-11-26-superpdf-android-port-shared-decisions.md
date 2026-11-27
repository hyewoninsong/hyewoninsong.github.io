---
title: "Porting a PDF reader to Android, with one copy of every product decision"
date: 2026-11-27T01:56:40+09:00
app: "superpdf"
tags: ["devlog", "android", "design"]
summary: "SuperPDF is getting an Android edition. The two apps share decisions, a file format and test cases, not code. Plus: 288 passing JVM tests, and a crash on the first highlight on a phone."
---

SuperPDF lets you underline while you read a PDF, then re-read only what you underlined. It has been iPhone and iPad only. The Android edition now has a shelf, paged and scrolling reading, five mark styles, on-device text recognition for scans, and a map that collects marks in book order.

## Two apps, one place where behaviour is decided

The iOS app has 180 decision records: "a long press takes the pressed word first", "deleting a book offers a six-second undo instead of asking". With a second app, where do those live?

- Two repositories. No shared code.
- Decisions about what a user feels are written in the iOS repository only.
- The Android repository keeps a ledger: one row per decision, saying ported, partial, pending or not applicable.
- Only Android-specific choices (libraries, storage) are written on the Android side.

The first ledger reads 24 ported, 25 partial, 14 not applicable, 117 pending. The debt sits in one file.

![The tooltip over a selected mark: colour, style, note, copy, delete in one row](/blog/superpdf-android-port-shared-decisions/mark-tooltip.png)

## Why not copies

**Copying each record to Android** drifts: when iOS reverses a rule, the copy keeps asserting the old one. A ledger row has no body to drift.

**One repository for both apps** gives a true single copy, but every build and release path of the shipping iOS app would have to move.

**One codebase for the UI** does not fit an app that leans this hard on each platform's PDF rendering, ink and text recognition.

What the apps share instead is a file format. iOS already exports annotations as a single file; Android stores each book on disk in exactly that shape. One contract to keep, and export is just writing the document.

![A sepia two-page spread above the map of marks in book order](/blog/superpdf-android-port-shared-decisions/half-view-map.png)

## 288 green tests, then a crash on the first highlight

Rules with no UI were ported to Kotlin together with their iOS test cases: table-of-contents parsers, where a mark lands in the map, how numbers are spoken. All 288 unit tests passed on the desktop JVM. On the emulator, drawing the first mark killed the app.

Swift regexes treat `\s` and `\d` as Unicode. To match that in Kotlin we used `(?U)` and `Pattern.UNICODE_CHARACTER_CLASS`, which the desktop JVM needs. Android's regex engine is ICU: it is always Unicode-aware, and it throws when asked to be. The inline flag is a `PatternSyntaxException`, the constant an `IllegalArgumentException`. Thrown from a singleton's initialiser, that is a crash on the first user action touching it.

Two fixes. Every ported pattern goes through one helper that passes the flag on the JVM and omits it on Android. And the same unit tests now also run on a device, by pointing the instrumented test source set at the unit test folder. On a device, 75 of the 288 failed, all from that one flag. "Pure logic, so JVM tests are enough" was wrong: regex, text boundaries and date parsing differ between a phone and a laptop.

## Where it stands

Crop, text boxes, map editing, generated contents and server import have landed since. Still missing: a pen, neural voices, PDF compression and tablet layouts. iOS handwriting is stored in an Apple-only format Android cannot read, so for now it is kept untouched and handed back on export. A shared ink format comes before an Android pen.

## 2026-11-27 — One manual pass through the screens found three bugs in code that passed its tests

With some twenty features in, we finally drove sixteen user flows end to end on an emulator. 473 unit tests were green. Two flows failed on the first pass and two more defects showed up along the way.

**Scrolling the map did not move the book.** In the half view the book and the map scroll together. Book to map worked; map to book did nothing.

![The map has scrolled to marks on pages 3 and 5 while the book still sits at the top of page 1](/blog/superpdf-android-port-shared-decisions/sync-before.png)

The position mapping was ported with its iOS tests and was right. The wiring was wrong. The map reads the book's scroll state, but the book registers that state after the first composition, so the map first sees nothing. It recomposes a moment later, but the coroutine collecting scroll changes does not restart, and the function it calls kept the empty value it first saw. Empty meant "a paged book", which only moves when the page number changes. No crash, no warning. The fix reads the value at the moment of use.

![After the same gesture, the book has followed the map to the last pages](/blog/superpdf-android-port-shared-decisions/sync-after.png)

**Switching view mode went back a page.** In vertical scroll, page 4 could fill the screen while the indicator said 3: we used the list's first visible item, and a few pixels of page 3 at the top are enough to be first. The current page is now the one covering the centre of the screen.

**Dragging the divider turned page 5 into page 3.** A wide book pane shows a two-page spread, a tall one a single page. A pager counts groups, not pages, and it kept group 2 (pages 5–6) across the change, where it meant page 3. The pager state is now rebuilt when the group size changes.

What the three share: a component's index was trusted as "the page the reader is on", and one direction was checked and the other assumed. Both are now on the checklist: test two-way features in each direction, and check the page after anything that reshapes the pane.

The ledger got a cleanup too. Of 87 "not yet" rows, more than half were old screens a later decision had replaced, or rules already ported. It now reads 55 ported, 55 partial, 32 to go.

## History

- 2026-11-26 — first Android port, decision ledger, on-device tests
- 2026-11-27 — sixteen user flows run on an emulator, three bugs fixed, ledger cleaned up
