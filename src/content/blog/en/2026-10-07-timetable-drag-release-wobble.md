---
title: "On release, the dragged block twitched back toward where it came from"
date: 2026-10-07T17:25:10+09:00
app: "timetable"
tags: ["devlog", "swiftui", "gesture"]
summary: "Dropping a class made the block nudge toward its old slot before settling. The save and the state cleanup sat on adjacent lines, but the view received them 7 ms apart."
---

Drag a class to a new time in the timetable and it now stays exactly where you drop it. Before the fix, the block moved slightly back toward its old slot at the moment of release and then returned. The final position was always right, so it went unnoticed except on a fast drag-and-release.

## The block stays where it is dropped

Moves, resizes and multi-selection drags all go through the same commit path, so all three are fixed.

## Two adjacent lines, two separate evaluations

While dragging, the block's position comes from a temporary value held by the grid view. On release the code writes that value to the store and clears the temporary value, in the same function.

The temporary value is the grid view's own `@State`, so clearing it re-evaluates that view immediately. The stored timetable only arrives once the parent view is re-evaluated. SwiftUI evaluated the grid once with its own state updated and the parent's inputs still stale.

In that one evaluation the block is drawn at its pre-drag time. Its position carries `.animation(.spring, value: startTime)`, which treats any value it sees as a destination. The spring departs toward the old slot, and 7 ms later the new timetable arrives and turns it around.

## Logs, not screenshots

A temporary log on every block render, plus a UI test that drags fast and releases at once, moving a class from 530 to 540 minutes:

| Moment | Drawn at | Stored | Temporary value |
|---|---|---|---|
| Dragging | 540 | 530 | 540 |
| Just after release | **530** | 530 | none |
| 7 ms later | 540 | 540 | none |

Reading the code never found the middle row. The log did.

## Hold the dropped position until the store catches up

The fix keeps the dropped position in a separate slot before calling save. The block reads that slot ahead of the stored timetable, and the slot is cleared when the stored schedules actually change. A drag that did not change the position is not held, because nothing would ever clear it.

Three alternatives lost:

- **Moving the save out of the async block.** The split comes from child-versus-parent evaluation order, not from the async hop.
- **Clearing the temporary value one tick later.** Taps and new drags in that gap would see stale editing state, and one tick is not a guarantee.
- **Disabling animation at release.** That removes the spring that finishes the remaining distance on a quick drop.

After the fix the middle row reads "drawn at 540, stored 530".

## Where it stands

Verified with simulator logs, not yet on a device. Other places that display "temporary value, else stored value" still need the same review.
