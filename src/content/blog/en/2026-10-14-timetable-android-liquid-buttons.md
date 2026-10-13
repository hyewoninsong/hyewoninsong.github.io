---
title: "On Android, the + button now splits in two instead of being swapped out"
date: 2026-10-14T02:48:10+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "Selecting a class used to make + vanish and two new buttons appear. Now one shape stretches, necks, and pinches off into duplicate and delete. iOS gets this from the system; on Android the outline is drawn by hand."
---

In SuperTimetable for Android, selecting a class turns the `+` at the bottom right into duplicate and delete. It used to shrink away while two separate buttons grew in. Now the `+` stretches sideways, narrows in the middle, and breaks into two circles. Deselect and they flow back into one.

## Swapping and splitting read differently

![Eight frames: + stretches, necks, and pinches off into duplicate and delete](/blog/timetable-android-liquid-buttons/split-frames.png)

On iPhone these buttons are items in the system bottom toolbar, and the glass splits on its own when one item becomes two. The app has no animation code for it. Android has no such toolbar, so the same spot had a replace animation.

A replace connects nothing: a different button appeared where `+` was. A split says the same control changed shape, which is exactly what happens when "make a class" becomes "act on this class".

One value drives it: 0 is `+`, 1 is duplicate and delete. It sets the distance between two circles, moves the fill from red to neutral, and swaps the icons at the halfway point, where both sets are fully transparent.

The spring is the one iOS uses for floating buttons, 0.4 s with 0.7 damping, so it overshoots by a few percent. That overshoot is kept. The halves part slightly too far and return, and on the way back the dip below zero swells the merged `+` once, by about 7%.

## The neck is two circles and two curves

What gets drawn is a single closed outline: two circles joined by a neck made of two cubic curves, closed with arcs around the far sides.

While the circles overlap the neck fills the crevice. As they separate, the attach points slide toward the line between the centers and the neck thins, reaching zero at 75% of the 8 dp gap. Breaking after the circles stop touching matters: break while they touch and it is just two circles moving apart.

The geometry is a pure function, so tests pin it: attach points lie on their circles, the neck never widens as distance grows, and it is nearly closed right before the break.

## What lost

- **Blur plus an alpha threshold.** The classic goo effect. Android 12 and up only, soft edges, and it cannot keep a translucent fill or a crisp border, because every pixel past the threshold becomes opaque.
- **A shader that refracts like glass.** Android 13 and up, a shader on every frame over a scrolling grid, and still not the system material. What was missing was the motion.
- **Two real buttons with a neck drawn between them.** Fine when opaque. With translucent fills the overlap is painted twice and shows as a patch.

## Also: the fills are translucent now

![Translucent lock capsule and duplicate / delete buttons in light and dark, grid lines showing through](/blog/timetable-android-liquid-buttons/translucent-light-dark.png)

The locked-class info card had just become translucent, which left the buttons below it as the only opaque, shadowed surfaces. They now use the same translucent white or black, with a 0.5 dp border instead of a shadow, since a shadow shows through a translucent surface as a grey smudge. `+` stays solid red: it is the one primary action, and translucent red over a busy grid loses contrast with its white glyph.

## Where it stands

The shape was checked from frames recorded on a software-rendered emulator; frame rate on a real device has not been measured yet. The tablet layout keeps these actions in the top bar and is unchanged. Refraction and highlights are not imitated, only the way the shape joins, parts, and bounces.
