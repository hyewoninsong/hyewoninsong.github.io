---
title: "A pass over the whole app, clearing four small points of friction"
date: 2026-11-04T16:00:16+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "An empty timetable that said nothing, a delete that asked for confirmation while promising undo, a name you could only change from the grid, and sheets that ignored large text."
---

The big features are in and the app speaks 18 languages. This time, instead of adding anything, I walked through the app as a first-time user and as someone who uses the largest text size, and picked the spots where you would pause. The test was simple: is the next action visible without an explanation?

## An empty timetable said nothing

A new timetable opens as an unlocked, empty grid. Nothing on it says that tapping an empty cell creates a schedule.

![An empty grid with a single gray line in the middle: tap an empty cell to add a schedule](/blog/timetable-ux-pass-2026-11/empty-grid-hint.png)

Now, only while the timetable has no schedules, one line sits in the middle of the grid. Unlocked, it says to tap an empty cell. Locked, it says to tap the lock to start editing. On iPad the gesture is a double tap, so the wording changes. Text only, touches pass through, and it disappears with the first schedule.

Seeding sample timetables was tried earlier and dropped: the first screen was still empty and the list filled with names the user never chose. Icons on the coach card were dropped for the same reason. One line of text is enough.

In the same spirit, the "tap the lock to edit" tooltip used to show once in a lifetime, for four seconds. Now, if you tap blocks on a locked grid three times without unlocking, it shows once more. Once per session, and no permanent dimming or banner. Locked is the default state, so a permanent indicator would be noise.

## The delete asked for confirmation while promising undo

The edit sheet's delete button showed an alert whose message said the action can be reversed with Undo. Asking for confirmation on a reversible action is odd on iOS; Photos and Mail delete reversible things immediately.

It turned out the sheet was the only entry with an alert. The toolbar trash, the iPad delete key and the VoiceOver action already deleted directly. The sheet now does the same and closes. Undo grouping is unchanged. The alerts for deleting a whole timetable and for shrinking the visible range stay, because those are not reversible or affect many schedules at once.

## The name could only be changed from the grid

Edit mode in the timetable list had duplicate, reorder and delete, but not rename. Organizing four timetables meant opening each one. A pencil button now sits in the edit-mode bottom bar, next to duplicate and delete. A long-press menu on the card was rejected because the list had already decided that actions on one target live in that bar.

## Sheets ignored the large text setting

The grid uses fixed sizes on purpose: text scales with column width, and a block that overflows at large text makes the timetable unreadable. That rule had leaked into the edit and settings sheets, which are text-only surfaces.

![The edit sheet at the largest accessibility size, capped so nothing clips](/blog/timetable-ux-pass-2026-11/edit-sheet-large-text.png)

The edit, list, settings, color, print and share sheets now follow Dynamic Type, each with a cap at its root. Sheets with fixed-width rows such as the day chips stop at xxxLarge; row-only sheets such as settings go one accessibility step further. The grid, exported images, widgets and the intro screens stay fixed.

## Also cleared

The spec said iPad had no lock and that multi-select move existed; neither matched the code. The multi-select code had no way to be turned on and was deleted, along with an unused card view.

Three proposals were left out on purpose: undo for timetable deletion, new timetables inheriting the current settings, and alarm snooze. All worth doing, but not about making the next action visible.

## 2026-11-04 — The same pass, on Android

Three of the four fixes moved to Android and one did not. What differed from the iOS version is what is worth writing down.

**The empty-grid hint has one wording.** On iPad the hint differs because creation is a double tap. On Android both the phone and the wide-screen shell create a schedule with a single tap on an empty cell, so there is no iPad wording to port. The line sits in the visible grid window, not inside the scrolling content, where it would slide away as soon as you scroll.

**"Once per session" for the lock tooltip is not saved state.** Three taps on a locked block still bring the tooltip back once. The "already shown in this process" flag is a process-level static, not screen state: saved state would survive a process restart and keep the tooltip from showing after a relaunch. The tap count is not persisted and resets on unlock.

**The delete confirmation came out of three places.** On iOS the edit sheet was the only entry with an alert. On Android the edit sheet, the wide-screen inspector, and the grid's delete button plus hardware Delete key all went through one. All three now delete directly, one store call per undo step. Five strings went away in 18 languages. Deleting a timetable, range changes that cut schedules, and bulk deletion still ask.

**Rename in the list cost some width.** The bottom bar becomes `[Duplicate] [Rename] Search [Delete]`. Because that bar morphs like a liquid, one more button meant a second leading slot in the morph geometry. At 320dp the search field is left with 152dp.

**The Dynamic Type caps were not ported.** Android text is in `sp` and already follows the system size, and font scale 2.0 is covered by an environment test case. A cap would only cut text for people who need it large.

## History

- 2026-11-03 — empty-grid hint, lock tooltip re-show, delete without alert, rename in list, Dynamic Type in sheets
- 2026-11-04 — Android port: one hint wording, static flag, three delete paths, four-button bar, Dynamic Type caps skipped
