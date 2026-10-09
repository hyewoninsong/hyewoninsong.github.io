---
title: "The text only blinked when the sheet was half open"
date: 2026-10-09T03:50:00+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "Tapping a class-period value made its text blink once before turning blue. One numeric-text transition caused it, and two careful measurements with the sheet fully open showed no difference at all."
---

In a period-based timetable, tapping a value such as class length opens a wheel under the row and turns the value blue. The text blinked once on its way to blue. It now changes colour smoothly, the same as the start and end time rows in a time-based timetable.

## Same design, one side blinked

Both cards use the same grey capsule and the same inline wheel. Side by side, the code differed by one modifier: only the period text had `.contentTransition(.numericText())`.

## Removing the line changed nothing, twice

I recorded the simulator, split the video at 60fps, and measured the text per frame. With or without the modifier, the text moved from black to blue in one direction over about 25 frames. That held on iOS 26 and again on iOS 27.

The second run was the careful one. It raised the sheet to full height and waited for everything to settle before the tap. That care removed the bug.

## The blink needs a scroll under it

The report that fixed the condition was short: fine at full height, broken at half height.

At half height the wheel opens below the fold, so the sheet scrolls to reveal it one tick after the tap. The colour change rides the tap's `withAnimation`; the scroll rides a second one. The capsule moves about 100pt while its colour changes.

With `.numericText()` on the text, that overlap replays the colour change as a glyph replacement. The old glyphs fade out and a blurred double comes in before the crisp blue.

![Four consecutive frames with the modifier: the value becomes a blurred double, then crisp blue](/blog/timetable-numeric-text-blink/frames-with-transition.png)

![Four consecutive frames without the modifier: the value stays crisp while only the colour moves](/blog/timetable-numeric-text-blink/frames-without-transition.png)

The capsule ground is about 238 in luminance. I tracked how bright the darkest text pixel got.

| Condition | Peak of the darkest pixel | What you see |
|---|---|---|
| Modifier on, class length | 194, one frame with no text | fades for about 0.12s |
| Modifier on, first period start | 185 | same |
| Modifier off | 124–126 | crisp, colour only |
| Time-based start row | 124 | same as modifier off |

## One line out, nothing lost

The value text no longer has the numeric transition. Wheel changes never ran inside an animation, so the modifier had never rolled a digit there. The rule going forward: text whose colour changes on tap or selection gets no numeric-text transition.

## Why it slipped through

Two changes landed a day apart. The capsule was restyled to match the time row, and only the background was compared. The same day the sheet started opening at half height, which introduced the overlapping scroll. Checks were still screenshots, and a 0.12s transition does not show in a still.

Then the measurement was tidied until the bug had nowhere to live. When a transition bug does not reproduce, keep the reporter's exact screen state before cleaning up the test. A test now blocks the modifier from coming back; confirmation on a real device comes with the next build.
