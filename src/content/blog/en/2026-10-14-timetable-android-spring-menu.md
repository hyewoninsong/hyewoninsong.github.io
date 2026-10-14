---
title: "The ⋯ menu on Android now grows out of its button"
date: 2026-10-14T03:05:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "The menu used to pop in, and its Share submenu replaced the whole list in one frame. Now it springs out of the button and the same panel reshapes into the submenu. The stock menu could not do it, so we draw the panel ourselves."
---

Tapping `⋯` in SuperTimetable for Android made a menu appear at once, and "Share ›" swapped the list for another in a single frame. Nothing was wrong, but it felt blunt. The menu now grows out of the button, and going into the submenu reshapes the same panel. The two top buttons briefly became circles, as on iPhone. Later the same day they went back to bare Android icons.

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

The small pickers inside sheets are still stock menus, and on tablets only the list and `⋯` buttons are circles. With system animations off, the menu appears without motion.

## 2026-10-14 — The circles are gone

Later that day the whole app moved to Android's own grammar. The top buttons lost their circles, and the menu corner went from 22 to Android's 4. The spring and the reshaping panel stay. More in [SuperTimetable for Android stopped dressing like an iPhone app](/en/blog/2026-10-14-timetable-android-native-grammar/).
