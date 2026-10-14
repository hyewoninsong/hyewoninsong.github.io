---
title: "The ⋯ menu on Android now grows out of its button"
date: 2026-10-14T19:20:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "The menu used to pop in, and its Share submenu replaced the whole list in one frame. Now it springs out of the button and the same panel reshapes into the submenu. The stock menu could not do it, so we draw the panel ourselves."
---

Tapping `⋯` in SuperTimetable for Android made a menu appear at once, and "Share ›" swapped the list for another in a single frame. Nothing was wrong, but it felt blunt. The menu now grows out of the button, and going into the submenu reshapes the same panel. The two top buttons are circles, as on iPhone.

## The menu opens over the button, not under it

![Four frames: a small panel appears where the ⋯ button is, grows, overshoots slightly and settles](/blog/timetable-android-spring-menu/open-frames.png)

The stock Android menu attaches below its button, so you never see where it came from. Ours covers the button and scales from the button's centre, which reads as the button turning into the menu.

It opens on a spring: 0.35 s with damping 0.75, so it passes its size once and comes back. Closing does not bounce; it shrinks toward the button in 0.16 s.

## A submenu is the same panel, not a new one

![Left: the round list and ⋯ buttons. Right: the panel in the same place, now the Share submenu](/blog/timetable-android-spring-menu/circle-and-share.png)

"Share ›" takes a six-row panel to four rows. The panel's size follows the same spring while the old rows slide out and fade and the new ones come in from the other side. Going back reverses the direction. The corner by the button never moves.

## Why not animate inside the stock menu

Its opening animation is fixed inside the library. It is also a small window sized to its content, and the system resizes that window separately from the content, so a right-aligned panel has no guarantee that its width and its position change in the same frame.

So we open one window the size of the screen and place the panel inside it ourselves: position, size and scale change together. A tap outside is taken by that window and only closes the menu.

A second panel beside the first had no room on a phone. Translucent glass buttons need blur, which starts at Android 12; the buttons use the same opaque fill as the bottom ones.

## What is left

The small pickers inside sheets are still stock menus (with the same white, rounded panel), and on tablets only the list and `⋯` buttons are circles. With system animations off, the menu appears without motion.

## 2026-10-14, evening — the circles are back

Later the same day the whole app moved to Android chrome grammar, and the top buttons lost their circles: a bare icon is the Android app-bar convention. Menus went back to Material's grey panel with 4 dp corners. Neither fit. A button floating over the timetable needs a fill to read as a button, and a grey square menu looked blunt among the white cards.

![The ⋯ menu as a white panel with rounded corners, round buttons at the top corners](/blog/timetable-android-spring-menu/white-menu.png)

So the top buttons and sheet-header X are circles again, now 48 dp instead of 44 — the iPhone's 44 pt looked small on Android, and 48 dp is Android's minimum touch size, so top, bottom and sheet headers share one size. Menus are white (a lighter grey in dark mode) with 16 dp corners, and dropdowns inside sheets use the same panel. Cards, switches and alerts keep the Android look.

## Two chips blinked at once

Changing the shown days from "every day" to "Mon–Fri" made both chips blink instead of the choice moving: each chip faded its own grey fill, so for a few frames both were half filled. The edit sheet's day chips had already been fixed with one sliding capsule, but that fix lived inside one screen while the chip code had been copied into settings and calendar export. Every chip row now uses one shared component with a single capsule; a custom calendar end date fades it out. We checked it with a capture 0.08 s after the tap: one capsule, somewhere between the two chips.

## Edit should visibly turn into X

![Mid-transition: the left X fading, the Edit capsule narrowing and overlapping the X](/blog/timetable-android-spring-menu/edit-toggle-midway.png)

In the timetable list, Edit now follows iOS's 0.2 s ease-in-out: the left X shrinks and fades, and the Edit capsule narrows into the X circle while the word and the X cross-fade. On the same screen, title rows grew from 56 to 76 dp in edit mode because the 48 dp reorder grip set the row height; the grip keeps its 48 dp touch box but reports 28 dp to the row.

## History

- 2026-10-14, early — the ⋯ menu springs out of its button and reshapes into the submenu; the top buttons become circles.
- 2026-10-14, evening — the circles return after the Android-grammar pass, at 48 dp; white rounded menus; one sliding capsule per chip row; animated edit toggle.
