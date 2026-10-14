---
title: "SuperTimetable for Android stopped dressing like an iPhone app, except for the round buttons"
date: 2026-10-14T19:25:56+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "We had copied the iOS app almost pixel for pixel, and Android users could tell at a glance. Cards, rows, switches, alerts and the overflow dots now follow Android's own grammar. We removed the round top buttons too, and put them back a few hours later."
---

The Android build of SuperTimetable had been following the iOS app almost pixel for pixel. It felt right in the hand, but on an Android phone it looked like an iPhone port. Now cards, switches and dialogs look the way Android users expect, and the gestures are unchanged.

## What changed is the look

| | iOS copy | Now |
|---|---|---|
| Overflow | horizontal `⋯` | vertical `⋮` |
| Cards · rows | very round (26), continuous corners, 52 rows | 12, plain arcs, 56 rows |
| Sheet handle | long 58 × 4 | Android's 32 × 4 |
| Switch | green track, fixed thumb | brand-blue track, thumb grows from a dot |
| Alerts | centred text, hairline buttons, bold Cancel | start-aligned, text buttons bottom-right |

![Settings switches: original green, first pass, and the blue Material switch](/blog/timetable-android-native-grammar/switch-rows.png)

![Unlock alert: iOS layout on the left, Material layout on the right](/blog/timetable-android-native-grammar/alert.png)

On Android the confirming action sits on the far right. The Cancel button isn't bolder than the others.

## The round buttons came back

The plan also covered the top buttons and menus: bare icons and 4 dp menu corners, as Android does by default. We shipped that, then undid both within hours. Over a timetable, a button needs a surface to read as a button, and a grey square menu looked blunt next to the white cards. The top buttons and sheet close buttons are 48 dp circles again, Android's minimum touch size. Menus are white with 16 dp corners. [The ⋯ menu post](/en/blog/2026-10-14-timetable-android-spring-menu/) has the details.

## What stayed

Colours, the light grey sheet background, the floating buttons, the time wheels, the rubber-band edge and the spring menu stay. The look follows the platform where it helps, and the feel stays the app's own.

## Five screens, a revert, then everything

We started with the overflow dots, then shipped the change on the five busiest screens and reverted it to think again. Half-and-half turned out to be worst: an Android settings sheet that opens an iPhone-style share sheet looks odder than either style on its own. So the switch, a single `CompositionLocal`, now defaults to on everywhere. The iOS look stays behind the off position.

The alert isn't the stock `AlertDialog`. The stock dialog opens its own window, and inside it the haptics the user switched off in settings come back on. Our dialog wrapper re-applies that setting, so the Material card is drawn inside it.
