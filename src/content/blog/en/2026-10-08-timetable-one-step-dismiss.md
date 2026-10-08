---
title: "Stacked sheets were closing in two beats"
date: 2026-10-08T21:35:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "uikit"]
summary: "Confirming with a popover or a second sheet on top closed the top one, then the bottom one, taking over a second. One dismiss call on the bottom sheet takes both down together."
---

Tap the checkmark in the event editor while the color popover is open, and both now go away together. Before, the popover closed, the editor sat there fully visible for a moment, and only then closed. Nothing was broken, but every save cost more than a second.

## How many transitions it takes is part of the spec

The same shape existed in one more place: the new-timetable sheet that opens over the timetable list. Confirming slid the new sheet down, showed the list again for about half a second, then slid the list down.

![Before: the new-timetable sheet finishes closing, the list is fully visible, then the list closes](/blog/timetable-one-step-dismiss/list-before.png)

After the fix there is no frame where the list stands alone.

![After: the list and the new-timetable sheet go down together](/blog/timetable-one-step-dismiss/list-after.png)

![After: the editor sheet slides down while the color popover fades](/blog/timetable-one-step-dismiss/edit-after.png)

## Separate dismiss calls run one after another

The two sites looked different but had one cause: one call closed the top presentation and another closed the bottom one.

The new-timetable sheet called its callback and then its own `dismiss()`; inside that callback the list called `dismiss()` too. Same run loop tick, yet UIKit finishes the top transition before starting the bottom one.

The editor did it on purpose. A popover consumes outside touches as its own dismissal, so the checkmark never receives the tap. A window-level touch observer forwards it to save, and that save had been deferred to the popover's `onDisappear` so the picked color would land in the event first. The ordering was right; the price was two beats.

Dismiss only the bottom presentation and whatever is on top goes with it, in a single transition.

## Set the value now instead of waiting

| Site | Before | After |
|---|---|---|
| Editor + color popover | Close the popover, save after it disappears | Copy the picked color into the event and save immediately |
| List + new timetable | Child dismisses itself, list dismisses too | Only the list dismisses |

The picked color was already live in the editor's state; only the copy into the event lagged by one `onChange`. Doing that copy right before saving removes the reason to wait. The new-timetable sheet now lets its presenter decide whether it dismisses itself after the callback.

One case keeps two beats: when a style change affects other events, a confirmation sheet has to appear, and a sheet cannot be presented while the popover is up. That is opening the next thing, not closing.

## UI tests cannot see this

XCUITest waits for the app to go idle after each tap, so one transition or two both read as "closed". The end-state screenshot is identical. We recorded the simulator, split the video at the idle gaps, and laid the frames after the tap out on one sheet. If the lower sheet appears fully on its own in any frame, it is two beats. The images above are those sheets.

## Where it stands

Tapping the editor's close button with the popover open still only closes the popover; forwarding that one makes it too easy to discard a choice by accident. New stacked presentations get the recording check before they ship.
