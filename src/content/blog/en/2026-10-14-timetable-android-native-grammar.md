---
title: "SuperTimetable for Android stopped dressing like an iPhone app"
date: 2026-10-14T19:09:05+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "We had copied the iOS app almost pixel for pixel, and Android users could tell at a glance. Circle buttons, horizontal dots, round menus, green switches and centred alerts now follow Android's own grammar, while the feel of the grid stays the same."
---

The Android build of SuperTimetable had been following the iOS app almost pixel for pixel. It felt right in the hand, but on an Android phone it looked like an iPhone port. Now the controls and dialogs look the way Android users expect, and the gestures are unchanged.

## Five things gave it away

| | iOS copy | Android |
|---|---|---|
| Top-bar buttons | icons in white circles | bare icons |
| Overflow | horizontal `⋯` | vertical `⋮` |
| Menus · cards | very round (22 · 26), continuous corners | menu 4, card 12, plain arcs |
| Switch | green track, fixed thumb | brand-blue track, thumb grows from a dot |
| Alerts | centred text, hairline buttons, bold Cancel | start-aligned, text buttons bottom-right |

![Left: white circle buttons and a round menu. Right: bare icons and a squarer menu](/blog/timetable-android-native-grammar/menu.png)

![Edit sheet: circle X and very round cards, then a bare X and 12 dp cards](/blog/timetable-android-native-grammar/edit-sheet.png)

![Settings: original, first pass, and with the Material switch](/blog/timetable-android-native-grammar/switch.png)

![Unlock alert: iOS layout on the left, Material layout on the right](/blog/timetable-android-native-grammar/alert.png)

On Android the confirming action sits on the far right. The Cancel button isn't bolder than the others. Destructive buttons stay red on both platforms.

## What stayed

Colours, the light grey sheet background and the floating buttons under the grid stay as they were. Material 3 Expressive has a floating toolbar now, so floating buttons are native Android too. The time wheels, the rubber-band edge on the grid and the spring menu also stay. We chose those for how the app feels to drag and set times, not for how it looks. The look follows the platform, and the feel stays the app's own.

![Image export sheet: circle buttons on the left, bare icons and squarer panel corners on the right](/blog/timetable-android-native-grammar/share-sheet.png)

## Five screens, a revert, then everything

We started with just the overflow dots, then shipped Android grammar on the five busiest screens. Then we reverted the whole thing to think about it again. The answer was that half-and-half is worst: an Android settings sheet that opens an iPhone-style share sheet looks odder than either style on its own. So the switch, a single `CompositionLocal`, now defaults to on, and every sheet, dialog and popup picks it up. The iOS look stays behind the off position, one line away if we ever want to compare again.

The alert isn't the stock `AlertDialog`. The stock dialog opens its own window, and inside it the haptics the user switched off in settings come back on. Our dialog wrapper re-applies that setting, so the Material card is drawn inside it.

## Where it stands

Illustrations keep their own shapes: the tutorial finger, the review thank-you card and the colour pad. The Android app hasn't launched yet, so real feedback starts with the first test build.
