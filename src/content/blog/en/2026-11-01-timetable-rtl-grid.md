---
title: "Switching to Arabic put our timetable under the wrong weekdays"
date: 2026-11-01T20:08:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "Compose mirrors only part of a right-to-left screen. The day header flipped, the schedules didn't, and reversing one list fixed it."
---

In right-to-left languages, Super Timetable on Android now keeps every schedule under its own weekday. We don't ship those languages, so we assumed the case couldn't come up. With the app set to Arabic, the timetable was already wrong.

## Direction flips even without a translation

With `android:supportsRtl="true"`, Compose mirrors layouts on its own, whether or not the app has Arabic strings. Set the app language to Arabic and the text falls back to English while the direction reverses.

The first capture looked right: Monday on the right, the time axis on the right. But Math is a Saturday class, and it was sitting under Monday.

![Before: the Saturday class Math sits under the Monday header](/blog/timetable-rtl-grid/before.png)

Drag it to the Tuesday column and it looks like Tuesday, but the saved value is Friday.

## One screen mixed two behaviors

| Mirrored for you | Not mirrored |
|---|---|
| `Row`, `Column`, `padding`, `Modifier.offset` | `Layout.place`, `Canvas`, pointer positions |

The header is a `Row`, so it flipped. Blocks use `place` and touches use raw x, so they stayed. Time pills use `offset`, so they flew to the far edge of the grid.

## We reversed the list, not the coordinates

All of the grid's column math is column number times width. So the grid's inside stays left to right, and only the list of days reverses. Blocks, touches, drags, pills and the header read that one list, so they agree.

![After: Math sits under Saturday at the far left, Monday is at the far right](/blog/timetable-rtl-grid/after.png)

- **Pinning the whole grid left to right** is one line, but the week runs backwards for those readers.
- **Branching on direction per coordinate** means one missed branch brings the bug back.
- **Turning `supportsRtl` off** hides the mismatch until those languages ship.

## A screenshot couldn't show it

Our first conclusion was that the grid and touch were fine. Tapping selected the block under your finger, and dragging followed it. The only thing wrong was how the header related to the data. Noticing that Math's stored day was Saturday is what gave it away, so the check now compares a known schedule with its header and reads the saved file after a drag.

## Where it stands

This removed the mismatch. There were no strings yet, so the text stayed English; Arabic and Urdu strings arrived in the last section. Shared images, printing, widgets and a device whose system language is Arabic came later the same day, below.

## 2026-11-01 — The exported pictures mirror too, and widget taps had been broken all along

A mirrored grid alone means an Arabic user sends friends a week running the opposite way. Shared images, printing, list previews, widgets and the tutorial now match the grid: the time axis on the right, Monday beside it, Saturday leftmost.

Share, print and the list preview draw through one renderer, so moving the axis and reversing the same day list there fixed all three. Flipping the finished bitmap would have been one line, and it would have mirrored every letter.

This time we changed the system language, not the app language. The launcher sets the direction of a widget's views, so an app language can't show what such a phone does.

### Tapping a widget block only opened the app

The widget looked right, but tapping Saturday's block just opened the app, and tapping an empty corner selected a different schedule. It wasn't an Arabic bug: the same code ran in every language.

A `uiautomator dump` showed why. Every block's tap target sat at the same coordinates. Glance has no free positioning, so we moved each box with `padding(start = x, top = y)`, but Glance padding is inside the view. The boxes never left the corner.

The geometry tests passed because the drawing coordinates were right. A manual test for tap position existed but missed it: tapping anywhere opens the app, so an open app proves nothing. We now pad a full-size parent and put the box inside it, pinned from both sides because the launcher decides direction. Sixty blocks still render, and the manual test now compares view bounds with the picture.

### Direction hid outside the coordinates too

- The tutorial's L-shaped outline assumed the axis was on the left. It now turns with the axis.
- Lines like "Duplicate at the bottom right" are wrong on a mirrored screen, so they get right-to-left English variants. Translations take priority.
- In 12-hour time, `12:00 PM – 2:00 PM` broke into `PM – 2:00 PM 12:00`. Digits and dashes are weak in a right-to-left paragraph, and 24-hour time hides it. Each time is now held together as one run.

We followed all 11 tutorial steps with real gestures, then checked the grid, widgets and taps again in Korean. Strings were what was left at this point: English punctuation lands at the wrong end until a translation arrives.

## 2026-11-01 — Ten more languages exposed the English hiding in code

We added Arabic, Urdu, German, Hindi, Indonesian, Italian, Russian, Thai, Turkish and Vietnamese, for 18 languages in all. The Arabic screen is now Arabic from top to bottom.

![The Arabic grid, with headers, schedules and the time axis all in Arabic and Monday on the far right](/blog/timetable-rtl-grid/arabic-grid.png)

### Translated, and still English

All 460 strings were in and the key checks passed, yet a German share image said "Lunch" and the 12-hour axis said "Noon". Both lived in code. Share images draw without a screen, so they kept their own per-language `when`, whose `else` was English. Key checks only read resource folders.

- Indonesian belongs in `values-in`, not `values-id`. Android looks up the legacy code, and the wrong folder only earns a lint warning.
- Kotlin's `uppercase()` ignores language, so Turkish headers lost the dot on `İ`. Visible text now uses the language's own rule.
- Arabic has six count forms. Plain strings like "%d schedules" can't follow them, so those became sentences where the number and noun don't have to agree.
- Translated folders outrank the right-to-left English lines, so Arabic and Urdu were translated from those lines, keeping "bottom right" on the correct side.

### Long words weren't the weak spot

We expected German sheet titles to clip, and they did. Reading every screen in every language showed worse: Italian "Tutti i gi" and Turkish "Her g…", where a label and three options share one row. We shortened the wording per language.

![Top, the clipped German title. Bottom, the shortened one.](/blog/timetable-rtl-grid/title-before-after.png)

Reworking the layout per language lost out: sheet headers and segmented controls are shared, so a change for one language means rechecking the other 17.

### What this doesn't cover

Translations had a separate review, but not by native speakers. At the largest system font, chips and day headers still clip in Thai, Hindi, Arabic and Urdu. Store screenshots and the intro video remain in the original languages. The iOS app caught up in the last entry below.

## 2026-11-01 — Two kinds of digits, and tests that passed without running

Arabic screens showed "٥٠ د" next to "9:00". A `%d` in a sentence uses the language's digits, but times were built with `Locale.ROOT`. One display function now converts times, dates, wheels and chips using the locale's own digits, so `ar-AE` stays Western. Writing Arabic digits into translations would be wrong there, and forcing Western digits app-wide would reach into per-app language and widgets.

![Arabic calendar export, with dates and counts all in Arabic digits](/blog/timetable-rtl-grid/arabic-digits.png)

Long words used to drop one last letter onto the next line. Words that can't fit at the smallest size now break at a syllable with a hyphen. The list sheet's bottom bar also mirrors now.

A worse problem turned up along the way. A bulk replace script rewrote `%1$d` as `%١$d`, a string that crashes when formatted, and the tests passed in six seconds. String checks read the XML files directly, which Gradle can't see, so a strings-only change skipped the test task or restored a cached pass. Earlier string edits may have slipped through the same way. We declared those folders as test inputs, broke a string on purpose to watch the test fail, and reran everything.

## 2026-11-01 — Widgets shrink their titles too

The grid shrinks and breaks long words, but widgets had a fixed size and cut the end off. Widgets now follow the same order: shrink until the word fits, shrink further if lines run out, hyphenate only a word too wide at the 0.75 floor, and end in an ellipsis. Keeping the fixed size and only adding hyphens lost out, because small widget text would break far too often.

![The today widget, with long titles shrunk, one-line blocks ending in an ellipsis, and a memo below its title](/blog/timetable-rtl-grid/widget-long-titles.png)

Android's hyphenation has no public API, so titles that fit keep the balanced wrap and only overflowing ones go through `StaticLayout`. iOS widgets gained the same rule in the last entry below. Checking a resized widget is still to do.

## 2026-11-01 — iOS reaches 18 languages, and breaks in different places

The iOS app now ships the same 18 languages. In Arabic and Urdu the time axis moves to the right, and shared images, print and widgets follow. English finally stops saying "1 schedules".

![iOS Arabic home screen — both widgets keep the time axis on the right, with Monday beside it on the weekly widget](/blog/timetable-rtl-grid/ios-arabic-widgets.png)

The fix matches Android: hold the grid left to right and reverse only the list of days. SwiftUI mirrors `HStack`, but not `Canvas` or UIKit touch coordinates. Sheets keep the logical order, because SwiftUI mirrors them already and a reversed list would flip twice.

Three things were different on iOS:

- **Direction needs a translation.** Android flips without one. iOS flips the moment Arabic ships, so the language and the layout went in together.
- **Offscreen rendering gets no direction.** The image renderer has to be told, or the export runs the other way from the screen.
- **The `.ics` risk was the calendar, not the digits.** Values were already ASCII, but dates came from `Calendar.current`, so an Islamic-calendar device would have written the wrong year into `DTSTART`. Export now always uses Gregorian.

Plurals moved to `.stringsdict`, and that alone was not enough: `String(format:)` without a locale skips the language's digits, so every counted string now goes through one function.

Widget titles shrink and break in Android's order. Korean, Chinese and Japanese titles follow the same rule and wrap between characters. `Text` will not hyphenate, so CoreFoundation's dictionary finds the break and we split the lines ourselves.

A blocked drag in Arabic looked like a layout bug until the same gesture failed in German too. The sample timetable was locked. Once unlocked, a Saturday event dragged one column right saved as Friday.

Translations reuse the Android copy and were not reviewed by native speakers. We checked the Arabic grid, edit sheet, list preview and real widgets by eye; the other languages' long strings and iPad remain to check, and the App Store listing is unchanged.

## History

- 2026-11-01: Fixed the grid's weekday mismatch.
- 2026-11-01: Mirrored shared images, printing, widgets and the tutorial, and fixed widget taps in every language.
- 2026-11-01: Added ten languages, including Arabic and Urdu strings.
- 2026-11-01: Unified Arabic digits, hyphenated long words, mirrored the list bar, and made string checks actually run.
- 2026-11-01: Widget titles now shrink and break like the grid.
- 2026-11-01: Brought 18 languages, RTL, plurals, language digits and fitted widget titles to iOS.
