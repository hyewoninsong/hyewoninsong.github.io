---
title: "On a new device, the first launch was erasing the backup before offering to restore it"
date: 2026-10-08T23:58:00+09:00
app: "timetable"
tags: ["devlog", "data"]
summary: "Before the app could offer to restore, the empty timetable it creates on first launch had already replaced the iCloud backup. Two reasonable rules met at the seed save."
---

Open the timetable app on a new phone and it asks whether to restore from your backup. Until this week, the freshly installed app had already replaced that backup with one empty timetable by the time the question appeared. Now a freshly installed app writes nothing to the backup until you have decided whether to restore.

## Two rules, each fine on its own

The backup is one file in iCloud, replaced whole after every successful save. Saves are debounced to once a minute, except the first save after launch, which writes immediately — there is no previous write to wait on.

The restore offer appears when the tutorial is unfinished, the store is empty, and a backup can be read.

Between them sits the seed save. With no save file, the app creates an empty "My Timetable" so there is something to show, and saves it through the same path as every other save.

1. The app launches on a new device. No save file.
2. It creates an empty timetable and saves.
3. The save succeeded, so a backup is scheduled. First save: write now.
4. The backup in iCloud becomes one empty timetable.
5. The screen appears and the restore offer reads that file.

The offer still shows. It offers a backup with one timetable, and restoring it gives you an empty one.

## No writes until the user has chosen

The fix sits right before the seed. An app that starts with no save file records "backup decision pending" on the device **before** creating the default timetable, and while that flag is set nothing is written to the backup file. The flag clears when the restore offer is answered, a restore succeeds, backup is switched on in Settings, or the backup file is confirmed absent. iCloud being unavailable or the file being unreadable does not count as absent. Relaunching, adding events, or finishing the tutorial does not clear it.

Our first fix was different: compare what we are about to send with the existing backup, and never let an untouched app overwrite one that holds more. A separate change for the same problem had landed the same day, and side by side the comparison lost.

- **Compare contents.** Holds regardless of install history, but unlocks the moment one event is added. Someone who adds an event before seeing the offer still loses the backup.
- **Exclude only the seed save.** Renaming the empty timetable or changing a setting triggers the same overwrite a moment later.
- **Keep dated backup copies.** The real answer to a lot of things, but it changes the one-file premise and needs a picker.

What stayed is one sentence: until the user chooses, the only restore copy is not touched. The release condition is a choice, not the data, so nothing done in between can cost the backup.

## The tests already knew

The simulator cannot sign in to iCloud, so backup tests inject a temporary folder and check a write-then-read round trip. Nobody set up the order that actually happens: a backup already there, then a fresh store starting.

Worse, a restore test carried a comment explaining that store setup writes an automatic backup, so the test switches backups off to simulate "no backup". We read that as a test nuisance and not as the product losing data. When a test has to disable a feature to get around its behaviour, ask whether that behaviour is a problem for users too.

The same audit found two siblings. When one timetable in the save file failed to decode, the rest loaded and the next save rewrote the file without it. When the file existed but could not be read, the app started empty and saved over it. Both now keep the original aside first. All three are the same sentence: a less complete copy writing over a more complete one.

## Where it stands

A test reproduces the ordering with a temporary folder. Real iCloud — especially a backup that has not downloaded to the device yet — still needs a check on hardware.
