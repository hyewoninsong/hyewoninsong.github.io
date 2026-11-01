---
title: "Every translation key matched, and the alarm still said '1 hours before'"
date: 2026-11-01T12:29:20+09:00
app: "timetable"
tags: ["devlog", "android"]
summary: "All 459 strings existed in all eight languages, yet the alarm lost its singular and exported calendars carried Arabic digits. We added real plurals to the Android timetable and let people pick the app's language in system settings."
---

The Android timetable can now run in a different language from the device, and an English alarm reads "1 hour before". Having every key translated turned out to say little about whether the sentences were right.

## The checks passed and the sentence was wrong

The audit started clean: 459 strings in all eight language folders, with matching format specifiers. But the app had no plural resources at all. A one-hour alarm, a default choice, read "1 hours before" in English, "1 heures avant" in French and "1 horas antes" in Spanish and Portuguese.

iOS keeps separate strings for 60 and 120 minutes. The Android port merged them into one `%1$d hours before`, and the singular went with it. Korean, Japanese and Chinese have no singular form to lose, so nobody developing in Korean would see it.

## Plurals change the whole sentence

We moved the alarm and every other counted sentence to `<plurals>`. In French, "1 événement(s) seront supprimés" became "1 événement sera supprimé": the verb changes too, so removing `(s)` would not have been enough.

A sentence with two counts doesn't fit a plural resource, which picks text from one number. It is now a template holding two clauses, each choosing its own form. A `count == 1` branch would have been simpler, but French also treats zero as singular. Tests now check that every language has the quantities it needs.

## Files don't care which languages you support

On an Arabic (Egypt) device, exported `.ics` files contained `TZOFFSETFROM:+٠٢٠٠`. Kotlin's `"%02d".format(n)` uses the device locale, even when the app has no Arabic strings. Time zone values now use `Locale.ROOT`, and a test that failed on the old code checks the whole file is ASCII.

## The system picks the language

On Android 13 and later, the app's language list comes from its resource folders. We skipped an in-app language screen: iOS has none, and the app would have to own saving and redrawing. We also turned off App Bundle language splits, so every install carries all eight languages and a choice in settings always has strings behind it.

On an emulator, switching the app to English, French, Spanish and Portuguese showed "1 hour before", "1 heure avant" and "1 hora antes".

## Where it stands

We haven't yet walked through the system settings screen or a Play install by hand. iOS still has a single plural form for strings like the batch update prompt.

## History

- 2026-11-01 — Added plurals, fixed `.ics` time zone values, enabled per-app language
