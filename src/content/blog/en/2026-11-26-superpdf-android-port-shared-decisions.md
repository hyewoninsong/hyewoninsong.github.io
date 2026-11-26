---
title: "Porting a PDF reader to Android, with one copy of every product decision"
date: 2026-11-26T13:15:00+09:00
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

No pen, crop, text boxes, map editing, generated contents or server import yet. iOS handwriting is stored in an Apple-only format Android cannot read, so for now it is kept untouched and handed back on export. A shared ink format comes before an Android pen.

## History

- 2026-11-26 — first Android port, decision ledger, on-device tests
