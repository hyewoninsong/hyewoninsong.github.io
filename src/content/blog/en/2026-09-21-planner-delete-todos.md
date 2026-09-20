---
title: "Adding delete to an app that never deleted"
date: 2026-09-21
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

The undo stack needed no clearing. Its entries capture id snapshots rather than model references, so an older entry pointing at a deleted todo resolves to nil and quietly does nothing — a design choice from months ago paying off here.

## What is left

Profiles still cannot be deleted; deleting one means deleting every todo inside it, which deserves its own decision. If anyone reports losing something by accident, the next step is an export-before-delete, not a trash can.
