---
title: "On a new device, the first launch was erasing the backup before offering to restore it"
date: 2026-10-13T03:31:14+09:00
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

The fix sits right before the seed. An app that starts with no save file records "backup decision pending" on the device **before** creating the default timetable, and while that flag is set nothing is written to the backup file. The original release conditions included answering the offer, turning backup on, or treating the file as absent. The October 13 proposal narrows them to a successful restore or an explicit decision to replace the backup, as explained below. iCloud being unavailable or the file being unreadable does not count as absent. Relaunching, adding events, or finishing the tutorial does not clear it.

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

The first fix was tested by reproducing fresh-install ordering in a temporary folder. Real iCloud, especially a backup not yet downloaded to the device, remained a hardware verification task. The follow-up below revisits the boundary of that protection.


## October 13, 2026 — Recovery needs protection beyond first launch

Adding period-based timetables prompted another review of saved data, mode changes, and iCloud backup. The backup question remained familiar: if the local contents are incomplete, should they replace the last recovery copy? We had answered it for a fresh install, but not for an existing device that failed to read its data.

### A decoded timetable can still be missing an event

The file loader already preserved the original when an entire timetable failed to decode. A malformed event inside a timetable took a different route. The event decoder retained the readable entries, and the enclosing timetable returned successfully. To the file loader, zero timetables had been lost. A later save could replace the source without preserving the missing event's original bytes.

This requires an event that already fails to decode; it does not mean ordinary events spontaneously become corrupt. The loss was in the opportunity to recover. Logging an error did not preserve its input.

The proposed fix carries event-level failures up to the file owner. Preservation must happen whether a whole timetable or one nested event failed. The regression test mixes valid and malformed events and checks the original bytes, not just the number of timetables.

### Keeping the local original does not protect the cloud copy

After partial recovery, editing a surviving event could still trigger a backup containing only the survivors. A user who had answered the first-launch offer long ago was outside the original protection.

The new protection also pauses cloud replacement after read failure or partial recovery on an existing installation. Local editing can continue, and restarting does not clear the hold. Restoring or starting a new backup remains an explicit user decision through the existing controls.

We chose to keep readable data accessible while withholding the remote write. Successful local recovery and permission to replace a remote recovery copy are separate outcomes.

### A file missing locally may still exist in iCloud

A local directory miss can mean the other device's backup has not downloaded yet. Treating that as absence and releasing protection recreates the original overwrite risk.

The proposed path discovers the backup through metadata and waits for its download before reading. Empty results or a timeout do not grant write permission. Neither turning automatic backup on nor choosing “Not now” on the restore offer authorizes replacement.

A fresh device must therefore restore successfully or explicitly choose “Start new backup” in Settings. This adds a choice even for someone with no previous backup. The confirmation explains that an older backup not yet downloaded may also be replaced. We chose to keep the recovery opportunity rather than infer consent from a local cache.

### Availability must not decide which snapshot is newest

A second sequence exposed stale backup data. An older save was waiting for the debounce interval. A newer save arrived while iCloud was temporarily unavailable, but the availability guard returned before replacing the pending value. Once access returned, a background flush could send the older snapshot.

The latest local timetable still existed. It was the recovery copy that fell behind.

The fix records the latest pending snapshot before checking whether it can be sent. It adds no new retry policy: the existing next-save or background-flush path now carries the latest value. Running the old and changed service code against temporary storage reproduced the difference: the former wrote the old snapshot; the latter wrote the newest one.

### Test the writes left behind after failure

A write/read round trip cannot exercise these sequences. Start with a healthy remote copy, fail a local read, edit, flush, and relaunch. For availability changes, place both an older queued save and a newer save in the sequence.

These are changes under review. Controlled temporary-file checks are not evidence of validation against a live iCloud account. Protecting the only recovery copy requires checking what can still write after a read or transfer has stopped halfway.

## History

- October 8, 2026 — Hold backup writes before a fresh install creates its default timetable.
- October 13, 2026 — Preserve nested decode failures, hold backups after local recovery loss, protect undownloaded backups, and keep the newest queued snapshot through unavailable periods.
