---
title: "\"What would make this better to use?\" — thirteen small frictions in the read, underline, re-read loop"
date: 2026-11-06T05:42:17+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "No big feature: we walked the read, underline, re-read loop and fixed thirteen snags, grouped as finding again, undoing, explaining and fitting the hand. Plus the iPad keyboard and Dynamic Type traps we hit."
---

The answer to "what would make this better to use" was not a feature but a list of snags along one loop: open a book, underline, come back later and re-read only the underlines. We fixed thirteen of them, one PR each.

## Finding things again

- **Home cards** show `42 / 320 pages · 5 underlines` and a thin progress bar. They read stored values only and never open the PDF.
- **Home search** now finds underlines, memos and node titles across every book. Tap a result and that page opens with the underline selected. Usually you remember the sentence, not the book.
- **Map edit mode** shows a `p.N` chip on the selected node that jumps to the page.

## Undoing mistakes

iPhone has no ⌘Z, so deleting an underline had no visible way back.

![The toast right after deleting a node (captured before the copy glossary renamed its button from "실행 취소" to "되돌리기", now "Undo")](/blog/superpdf-friction-pass/undo-toast.png)

- Deleting an underline or a node shows a 6-second "Deleted · Undo" toast (it started at 4 seconds — see the 2026-11-06 section). If anything else was edited in between, the button hides, so it can never undo the wrong thing.
- Map edits (move, delete, rename) are now undoable too, reversing an earlier decision. The old reason was avoiding SwiftData's automatic undo, not that map edits were risky. Registering explicit reverse operations by ID, as the underline ledger does, avoids that, and both now share one undo stack.
- Import shows "Importing 2 / 5" and one alert listing each failed file with its reason. Files that are not PDFs, are corrupt or are password-protected are rejected up front.

## Explaining what is hidden

![The text-recognition progress chip, readable in dark mode](/blog/superpdf-friction-pass/ocr-chip-dark.png)

- Scanned books showed `OCR 12/240` in tiny grey text. It is now a "Recognizing text 12 / 240" chip that explains itself on tap. Its background is opaque because Liquid Glass turned grey over a white page in dark mode and the text vanished.
- TipKit tips teach the hidden gestures (tap to hide buttons, long-press to underline, drag handles), and a "How to read" page lists them all.
- Empty states now say what to do, with a primary button.

## Fitting the hand

Tap areas grew to 44pt without changing visual size. Icons follow Dynamic Type, capped inside fixed frames so the two-row toolbar does not overflow. iPad keyboards get arrow and Space page turning and ⌥⌘1/2/3 tool keys. One glossary now governs copy: book, PDF, underline, page, undo.

## Three traps

**Bare arrow-key shortcuts never reached the app on iPad.** `.keyboardShortcut(.rightArrow, modifiers: [])` in a menu is processed after the focus system and scroll views claim arrow keys. Space and ⌥⌘2 worked. The fix is a `UIKeyCommand` with `wantsPriorityOverSystemBehavior`, which SwiftUI cannot express, so a small view controller behind the reading board owns those keys.

**A `Menu` label icon ignored our Dynamic Type cap.** At accessibility sizes the "…" button alone was huge, because a `Menu` label uses the system font and skipped the capped helper. Audit every sibling when you introduce a cap.

**A copy sweep must skip strings that stored data is compared against.** A placeholder node title is compared character by character with what is saved to decide whether OCR should fill it in. Rewording it would have orphaned existing nodes. We left it alone and added a test that fails if retired terms reappear.

## 2026-11-06 — second pass: line up the siblings and the gaps show

A week later we asked the same question, but instead of walking the loop we **lined up every place that performs the same action**: deleting one book next to deleting several, "Delete server" in the edit sheet next to the long-press "Delete" in the list, the home toast next to the in-book toast. Whatever one side had and the other lacked was the fix list. Thirty-four items, nine PRs.

### Delete is one of two things: undoable with a toast, or confirmed

Deleting a server from its edit sheet asked "Delete 'name'?"; long-pressing the same server in Settings deleted it instantly, keychain password included. The generated table of contents had a small red "Clear" that wiped the whole thing in one tap. Same object, different fate depending on the door you came through.

One rule now: **an undoable delete (book, underline) skips confirmation and shows an undo toast; a non-undoable delete (server, whole generated TOC) asks, with the same wording from every entry point.** The button says "Delete" everywhere, renaming says "Rename".

Two alternatives lost. Confirming every delete would put a dialog in front of removing one underline, undoing what the toast solved. Giving servers an undo toast would mean restoring a deleted keychain item within six seconds, which costs more than asking once.

### Every toast gets the same six seconds

The first pass set the underline-delete toast to four seconds; the book-delete toast was later built with six, and they stayed different for a month. Four seconds is too short to reach "Undo" with VoiceOver, and differing timers are unpredictable. Both now read one constant, and copy that mentions the time is built from it. The in-book toasts also gained the haptic the home toast had and a VoiceOver announcement neither had.

### The rest

- Haptics missing on multi-delete, the tooltip trash can, undo/redo, voice selection and the server connection check.
- Four icon-only buttons (clear search, cancel node edit, add PDF, voice preview) had 12–24pt tap areas; now 44pt with the visual size unchanged. The first fix used `.frame(44, 44)` and grew the header; we went back to the negative-padding helper from the first pass.
- Copy: Korean particles after a quoted name were wrong, so the noun type now follows the name; "please" forms unified; in-progress strings end with "…".
- Stale guidance: a tip taught long-pressing color chips that no longer exist, and the empty bookmarks screen pointed at a button that had moved to the navigation bar.
- Server sheet: a green "Connected" survived editing the password; it now clears on any change. The sheet also says why Save is disabled, has show/hide for password and token, a keyboard "Done" for the port field, and shows total download size when "download now" is on.
- VoiceOver: PDF list rows were not buttons, text-box colors read as hex, the book card's overflow menu was hidden, and setting titles truncated even in the stacked layout.

The audit claimed the home toast already announced itself to VoiceOver; it did not. Sibling comparison only works after you check what the sibling actually does.

## Still open (2026-11-06)

Book cards in dark mode share the shelf's black and lose their edges — needs a look, not a guess. Export sheets say "Cancel" in text while server and settings sheets use an × circle. Server folders with hundreds of PDFs need search.

## History

- 2026-10-30 — thirteen frictions
- 2026-11-06 — thirty-four more by sibling comparison, nine PRs — delete is toast or confirm, toasts share six seconds
