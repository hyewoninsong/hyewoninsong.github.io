---
title: "The icon shrank, the digits inside it did not"
date: 2026-10-14T10:25:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "On Android, the 1 · 2 · 3 in SuperTimetable's period-axis icon spilled out of the icon. Every coordinate matched iOS. What differed was the unit behind the number 11."
---

SuperTimetable's timetable settings on Android let you pick a clock axis or a period axis, each with a small picture. The period picture has three equal rows numbered 1, 2, 3 — and the digits were overflowing the rows and the icon itself. They now sit inside their rows, in the same proportions as iOS.

## Each digit sits in its own row

![The axis row in timetable settings — the 1 · 2 · 3 of the period icon sit inside their rows](/blog/timetable-android-kind-icon-digits/kind-row-after.png)

The same drawing is used in the timetable list, so that one is fixed too.

## Same coordinates, different unit

The picture is a 64×64 drawing ported from iOS coordinate for coordinate. Both platforms scale the canvas down to the icon size and draw at the same positions. The digit size was copied as well: 11.

| | What `11` means | In a 26-unit icon |
|---|---|---|
| iOS `Canvas` | 11 drawing units; the canvas scale applies to text | about 1/6 of the height |
| Android `11.sp` | 11 screen pixels × density × system font scale | nearly half the height |

On Android `sp` has nothing to do with the drawing. The lines shrank with the icon and the digits stayed at screen size — and grew further with the system font setting.

The fix sizes the digits in drawing units: 11 × the icon's scale, taken as pixels and converted with `toSp()`, which divides density and font scale back out. The text is measured outside the scale transform at its final size, so rounding in the measured width is not magnified.

## Why not just pick a smaller number

- **Tune the `sp` value until it fits** — right at 26, wrong again at 28 in the list, and wrong on any other font scale.
- **Ship the digits as a vector asset** — the picture is tinted and drawn at several sizes by one function; two sources drift.

## Why it got through

Side by side with the iOS code, nothing differs. Unit tests do not draw. In the slightly larger list icon it only looked "a bit big". A test now fails if an `sp` literal returns to this drawing, and ported drawings get compared against the original from an enlarged capture at their smallest size.
