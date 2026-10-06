---
title: "The keyboard covered the notes field it opened"
date: 2026-10-06T20:46:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "We fixed it with a floating composer, then took that back the same day. Now the notes field itself scrolls above the keyboard and follows as it grows."
---

In SuperTimetable, tapping a schedule's notes field now scrolls the whole field above the keyboard, and it keeps following as the note grows. The field sits at the bottom of the edit sheet, and the keyboard used to rise straight over it. Our first fix moved typing into a floating composer; a few hours later we took that out — see the second dated section.

## First try: the card shows, the composer types (removed)

| Where | What it does |
|---|---|
| Notes card in the sheet | Shows the note (4–8 lines). Tap to open the composer |
| Composer above the keyboard | Starts at one line, grows to six. Round blue button saves |
| Outside the composer | Tap to put the text into the card and close |

The composer is a chat-style input: a fully rounded card, 12pt clear of the keyboard and the screen edges so it reads as floating rather than part of the keyboard. It borrows the shape from our planner app, which already takes block notes this way.

![Typing three lines — the composer sits above the keyboard and every line is visible.](/blog/timetable-memo-composer/composer-typing.png)

However the composer closes — save button, outside tap, or the sheet going away — the text lands in the schedule's draft. Saving or discarding the schedule is still up to the sheet's checkmark and X.

![After closing: the notes card holds the three lines.](/blog/timetable-memo-composer/memo-card-after.png)

## Move the input, not the field

The obvious fix was to scroll the field above the keyboard on focus (`ScrollViewReader.scrollTo`). But the field grows line by line, so the scroll target keeps moving, and on iPad the editor is a popover that shrinks when the keyboard appears. Shrinking the sheet instead would shove the day and time cards around. Pinning the input to the keyboard makes all of that moot: wherever the keyboard is, the composer is right above it.

## 2026-09-29 evening — the field itself moves up

The feedback on the composer was short: don't float a separate box, just bring the field above the keyboard. Typing into something other than the card read like a second screen on top of the sheet.

What was actually wrong: the scroll view shrank by exactly the keyboard height, and the system did scroll — but only enough to show the caret's line, and it didn't follow as lines were added. Five lines in, the fourth was under the keyboard.

![Before: five lines typed, the fourth and fifth hidden by the keyboard.](/blog/timetable-memo-composer/memo-covered-before.png)

Now we scroll ourselves: on focus, on scroll-view height change (keyboard up/down) and on field height change (new line), `ScrollViewReader.scrollTo(_, anchor: .bottom)` puts the field's bottom 12pt above the keyboard.

![After: five lines, the whole field sits 12pt above the keyboard.](/blog/timetable-memo-composer/memo-inline-typing.png)

## Why the 12pt gap was ignored

We first hung the scroll target off the field — an `overlay` with `.offset`, then `alignmentGuide`, then a `padding(12).id(…).padding(-12)` pair. The field always landed flush on the keyboard, and changing the gap to 40 or 100 moved nothing. `scrollTo` was firing; it just aligned the field's own frame. Making the target a **sibling** view — a 12pt clear view right after the field, with the pair pulled back by `padding(.bottom, -12)` — worked immediately: gap 100 moved the field exactly 100pt.

The lesson is about testing: a 12pt gap is easy to believe in. Push it to an extreme value first and see if anything moves.

## Where it stands

Verified on the iPhone simulator with an existing schedule; the 2026-10-06 motion fix was measured from a simulator recording, not on device. New schedules have enough bottom room (20pt inset vs. 12pt gap); the iPad inspector uses the same view but hasn't been checked on device yet.

## 2026-10-06 — it got there, but it teleported

The field did end up above the keyboard. It just had no path: the keyboard slid up while the field was already in place on the next frame, even though the `scrollTo` sat inside `withAnimation`.

A jump and a glide end on the same picture, so screenshots can't tell them apart. We painted the field magenta, recorded the simulator, and listed the field's top edge per frame at 60fps.

| What triggers the scroll | Top edge on the way up |
|---|---|
| Scroll view height change only | 561 → 419 in one frame |
| All three signals (before) | Varied per run — one-frame jump, or a fast move followed by a 0.6s crawl |
| Keyboard notification only (after) | 558 536 521 506 494 482 470 461 455 449 443 437 434 428 425 422 419 over 0.35s |

The scroll view's height change arrives about 20ms before `keyboardWillShow`, already at its final value, and an offset set at that moment is committed without animation. Moving the same call to the run-loop turn after `keyboardWillShow` was enough. We did not confirm why at the framework level.

The rules now: while the keyboard is rising, only `keyboardWillShow` scrolls, using the duration in the notification (0.38s) for a decelerating curve. Focus moves and line growth scroll only after the keyboard has finished rising; overlapping triggers restart the curve. Dismissal is left alone — the system already eases the content back over 0.3s.

## History

- 2026-09-29 afternoon — notes typed in a composer floating above the keyboard
- 2026-09-29 evening — composer removed; the notes field scrolls above the keyboard, with a sibling scroll target
- 2026-10-06 — the field no longer jumps; it rises with the keyboard, scrolled from `keyboardWillShow` only
