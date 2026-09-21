---
title: "Adding delete to an app that never deleted"
date: 2026-09-21T20:30:00+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "data"]
summary: "Todos in the day planner could only be archived, never deleted. Watching typo todos pile up in the archive flipped the rule — one warning, no undo."
---

In the day planner, a todo could never be deleted. Anything you were done with went to the **archive**, and its history stayed. That rule is now reversed: todos can be deleted permanently, from both the active and the archived list. Before they go, the app says exactly what goes with them.

## The archive was holding two different things

Renaming or recoloring a todo in this app updates every past block. Deleting one therefore erases everything built on it — blocks, contribution graph, stats. That is why delete did not exist.

But some todos have nothing to keep. Typos, test entries, ones created under the wrong profile. They sit in the archive forever, and once the archive mixes "later" with "garbage", nobody uses it.

## Two places, one warning

Delete lives in two places: the red `Delete` under a row swipe, and the trash button in edit mode for a multi-selection.

![Swiping a row reveals delete and archive. The full-swipe action is still archive](/blog/planner-delete-todos/swipe-actions.png)

The full-swipe slot stays with archive on purpose. Whatever fires when a thumb slips should be the reversible one.

The warning names the todo and the **number of blocks** that disappear with it: "12 blocks and all history will be gone. This cannot be undone — archive it instead if you just want it out of the way." The cost shows up as a number, not an adjective. Twelve blocks and zero blocks are not the same decision.

![The delete warning leads with the target and how many blocks go with it](/blog/planner-delete-todos/delete-alert.png)

## It does not go on the undo stack

The app has an undo stack covering every write, and putting deletion on it looked natural. It is not there. If the dialog says "cannot be undone" and the undo button brings it back, one of them is lying. Folding hundreds of inverse operations into a single entry — on a stack capped at 50 — is its own cost.

Deleting without a confirmation and relying on undo was the other option. That is exactly how **blocks** are deleted here: no dialog, undo catches it. A todo is a different order of magnitude. One block is five minutes; one todo is half a year of records.

A trash that empties after 30 days was considered too. It adds a third state and an expiry schedule to a problem one dialog solves.

## The dialog read a model that was already gone

The first version held the target `Todo` itself. Confirm, delete, dismiss — except SwiftUI evaluates the title and message once more on the way out, and those read `todo.title` on an object already removed from the context.

The fix is to hold a **value** instead of a model:

```swift
private struct DeleteRequest: Identifiable {
    let id = UUID()
    let ids: [UUID]      // re-fetched after the confirmation
    let title: String
    let message: String
}
```

Freezing the name and the count into strings when the question is asked means there is still something to render after the objects are gone. For the same reason the confirmation re-fetches its targets by id.

The undo stack was left alone. Its entries capture id snapshots rather than model references, so an older entry pointing at a deleted todo resolves to nil and falls through. That much was true; reading "falls through" as "is safe" was the mistake — see the 2026-09-21 section below.

## 2026-09-21 — an undo that quietly does nothing is a broken undo

The paragraph above said a stale entry "resolves to nil and does nothing." True — but nobody asked why that was fine. It wasn't.

Every inverse operation looks like this:

```swift
ctx.block(id: id)?.parkedAt = nil     // optional chaining passes when the block is gone
```

Deleting a todo cascades to every block it owns. At that moment every stack entry touching that todo — moved, completed, sent to the drawer, block deleted — points at nothing. The button stays enabled, because the stack is not empty. Tapping it consumes one step and changes nothing on screen. Five dead entries means five taps before one lands. What the user reads is simply: undo is broken.

Worse, the dead entry moves to the redo stack. The redo of an "add todo" entry restores from a snapshot — so a permanently deleted todo could come back with one tap of the right arrow, right after a dialog promised it could not be undone.

The fix removes the optional chaining. An inverse now reports **whether it changed anything**:

```swift
extension ModelContext {
    func apply(block id: UUID, _ body: (TodoBlock) -> Void) -> Bool {
        guard let block = block(id: id) else { return false }
        body(block)
        block.updatedAt = .now
        return true
    }
}
```

The stack keeps popping until an entry applies, and drops the ones that don't — they never reach the other stack either. An enabled undo button now always undoes something, dead entries clean themselves up unseen, and a deleted todo stays deleted.

One more trap showed up in grouped actions. "Applied if any step applied" was folded as `entries.reduce(false) { $0 || $1.undo(ctx) }` — and `||` short-circuits, so once the first step succeeds the rest never run at all. Loop, don't fold.

The investigation started from a report that undo did nothing for the drawer. The drawer path turned out to be fine — six UI tests across park/unpark, undo/redo, today and other days all pass. The symptom was real, its cause was somewhere else entirely.

One drawer-side gap did remain: undo sending a block back to the drawer gave no signal beyond the block disappearing. It now reuses the same "moved to the drawer" cue that parking shows. Not saying where something went reads as nothing happening.

## What is left

Profiles still cannot be deleted; deleting one means deleting every todo inside it, which deserves its own decision. If anyone reports losing something by accident, the next step is an export-before-delete, not a trash can.

## History

- 2026-09-21 — permanent delete for todos (two entry points, one warning, no undo)
- 2026-09-21 — that delete's leftovers in the undo stack are now skipped
