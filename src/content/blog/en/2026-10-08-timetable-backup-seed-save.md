---
title: "On a new device, the first launch was erasing the backup before offering to restore it"
date: 2026-10-13T10:11:43+09:00
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

## October 13, 2026 — The same question, widened to the save file and mode switching

A second review the same day took the same worry through the whole codebase: whether period-based timetables could corrupt the save file, what breaks when switching between period and time mode, and whether there were more ways to lose the iCloud backup. The backup proposal above landed first; this change sits on top of it, adopts it where the two overlapped, and adds only what it lacked.

### Define protection by what releases it, not by what arms it

Following the "existing device fails to read" case above into code, the mechanism was short. The protection flag was only set when there was no save file *and* the first-run offer had not been answered. That is: fresh installs only. On a device that had answered the offer once, a corrupt file was quarantined, a default timetable was created and saved, and with no previous write to wait on, the backup was replaced immediately.

The proposal above extended protection to existing installs. What this change adds is the **reason**. The file loader raises one signal for a read failure, a quarantine, or a partially decoded file, and protection armed by that signal uses different wording in the offer: there was a problem reading your timetables; if you don't restore, the current state becomes the next backup. Same alert as the "backup from a previous device" offer, but it says what happened. Turning the backup toggle on is still not consent; that decision from the proposal above stands.

### Missing on disk is not missing in iCloud

On a new device, iCloud delivers the file list before the file contents. Reading that as "no backup" releases protection and brings back the first-launch loss. The proposal above added metadata discovery that waits for the download and never releases on an empty result. Safe, with one leftover: on an account that has never had a backup, **every** fresh install sees "backup check needed" and must tap "Start new backup" in Settings before automatic backups begin.

That review added a release condition: a completed metadata gather followed by five quiet seconds. A follow-up the same day objected that a quiet local query is not a server acknowledgement that no backup exists (see "A local write is not a completed backup" below). What ships is the five-second rule, paired with a second check at the first write for the case where it was wrong — see the last section.

Rejecting a restore when one timetable inside the backup fails to decode was adopted from the proposal above. The first instinct was to restore what reads, but a restore replaces everything, and a partial result leaves the user unable to tell what is gone. Refusing and saying "damaged" is better.

The rest on the backup side is small. Dates carry fractional seconds (two events edited within the same second swapped order after a restore). The container URL is resolved once in the background at launch (every save was calling an API on the main thread that can be slow on first use). An account change drops pending writes and re-arms protection. The background flush was tied to the analytics session timestamp, so a second window could skip it; it is decoupled now.

### A load that rewrites stored values bumps the version even without new fields

The save-file finding was not a crash but a missing copy. A period timetable settles each event's stored time onto the period grid at every launch and saves if anything moved. That rule changed twice, on October 9 (stored value equals shown time) and October 12 (axes with breaks have no half-periods), and both shipped without a version bump because no field was added.

But the one-shot copy taken before migration runs only on the first load after the version changes. Same version, no copy. The October 12 rule merges two classes that sat in the front and back half of one period into a single slot, and nothing anywhere could undo that. The version is now 15. Nothing migrates; the bump exists so an older device's first load keeps a copy before the rewrite. As a rule: the save version is a generation of what load does to the file, not of the file's shape.

Silent fallbacks got reports while we were there. A broken period list opened as a time timetable and the next save erased the periods, with nothing logged to match a "my periods vanished" complaint against. A string where the kind should be made the app drop the timetable while the widget showed it as time-based; the app now matches the widget. The 24-period-plus-lunch-cell case, where the virtual axis reached 1,470 minutes against a 1,440 clamp, was solved first by the proposal above with a separate grid-coordinate constructor; this change only adds the regression test.

### Overlaps stay; alarms are pinned

Mode switching produced three findings. Going time → period → time shrank a 6–22 visible range to 9–16, because period mode overwrote the range with the period span and the way back only widened from there. The range is now remembered alongside the period list and restored on return.

Adjacent classes overlapping was left alone. On a 60-minute, no-break axis, settling 9:00–9:45 and 9:45–10:30 sends the end 9:45 up to 10:00 and the start 9:45 down to 9:30 (ties round outward), a 30-minute overlap. Changing the tie rule moves other cases instead. Overlaps show as hatching and that is acceptable. What got pinned by a test is that alarms fire at each class's settled start, period 1 and period 1.5, because an alarm that disagrees with the block on screen reads as "it didn't ring".

### Where it stands

Temporary-folder tests cannot establish real iCloud delivery. Download and upload completion after signing in on a new device remain hardware checks. The follow-up below argued against the automatic release after a quiet query; the review after that kept it and added an existence check at the first write.

## October 13, 2026 — A local write is not a completed backup

Someone replacing a phone needs a copy that reached the server. Writing into the local iCloud folder cannot make that promise by itself. This review separates the steps after local storage and removes editing history that no longer belongs to the restored data.

### Quiet metadata is still incomplete evidence

The earlier five-second rule tried to spare first-time users an extra choice. But a query finishing with no results describes the device's observed list, not an authoritative server response. Waiting longer does not change that distinction.

This review proposed keeping protection on empty results and timeouts, releasing only on a successful restore or explicit confirmation to start a new backup, at the cost of an extra choice for a truly new account. That proposal did not ship as written; the last section below settles on "a timeout is not absence, a confirmed absence releases, and the first write checks again".

### Cached addresses do not make file access nonblocking

The container URL was already resolved in the background. `NSFileCoordinator` can still wait, and encoding and file access remain synchronous operations. The complete coordinated operation now runs off the UI actor on a serial path, publishing only its result back to the interface.

Operations also need generations. A late completion must not discard a newer pending save or update the state of a different account. The earlier rule—record the newest snapshot before checking availability—stays in place.

### Pending upload is shown as pending

A successful local write leaves an upload for iCloud to complete. Offline access or an upload error can leave another device without the new file. Updating the successful-backup timestamp immediately would imply recovery is already possible.

Local staging is now distinct from confirmed upload. The local write time is recorded, but pending or unconfirmed uploads are not displayed as completed backups. Completion must belong to the staged revision; an older file's acknowledgement cannot certify the next save.

### Restoring ends the previous undo history

A whole-store restore replaces the dataset, but old undo commands can still refer to records from before it. Running one after restoration can bring those records back, including from another window.

After the local restore commit succeeds, the old undo and redo histories are cleared. Failed restoration preserves both current data and editing history. The pre-restore snapshot remains a separate recovery copy.

Verification must include delayed file access, newer saves arriving during a write, pending and failed uploads, and undo after restoration. None of those local tests proves delivery between real iCloud devices. Offline editing followed by upload, download, and restoration on two signed devices using the same account remains a separate check.

## October 13, 2026 — An account switched while the app was closed never sends a notification

The reviews above stopped a less complete copy from writing over a more complete one. Walking the backup and restore path end to end once more turned up three ways a perfectly good copy could land in **someone else's slot**.

### The account-change notification only arrives while the app is alive

An earlier section says an account change drops pending writes and re-arms protection. That was a subscription to `NSUbiquityIdentityDidChange`, which is delivered only while the process is running. People switch Apple accounts in the Settings app, with the timetable app closed. On the next launch there is no notification, the container URL now belongs to the new account, and the first save writes immediately. Whatever backup another device had left in that account is replaced by this device's timetables.

Apple's documentation covers exactly this: archive `ubiquityIdentityToken` and compare it at launch. The app now does that, and the same handler runs for the launch comparison and the notification.

One more thing got fixed on the way. The old handler treated a `nil` token (signed out) the same as a different account. Sign out and back in to the same account, and the app offered its own backup as "from a previous device"; tap "Not now" and automatic backup stayed paused. The classification is now four-way: first observed (store only, so an upgraded install gets no false hold), unchanged, signed out (drop queued writes, keep the stored token so the account coming back reads as unchanged), switched (hold). `nil` is not "a different value".

### A hold released by "absent" gets a second check at the first write

Two opinions on the five-second rule collided the same day. The objection is right: five seconds is a guess, and a longer guess is still a guess. Going back to one extra choice for every new account was not attractive either. The question that separates them is what remains when the guess is wrong. If the problem is that the first backup written on a wrong guess cannot be undone, make the first write undoable.

When discovery releases the hold, the app records that discovery, not a person, released it. The first write under that record that finds a file already at the destination does not write and re-arms the hold; the next launch offers restore as usual. A user choosing "Start new backup", a successful restore, or any successful write clears the record. It defaults to off, so long-standing installs keep writing over their own backup. The grace period lowers the odds; the existence check closes the window. They are a pair, not substitutes.

### A restore is not a save

A successful restore used to go down the same path as a successful save: refresh widgets, re-register alarms, schedule a backup. First write after launch, so no sixty-second wait. The app was rewriting the backup it had just read, and not with the original bytes but with the normalized copy, clamped to the visible range and settled onto period lines. Pointless at best. In one case it was a loss: device A on the newer app backs up, device B on the older app restores, B reads unknown fields as defaults, and that downgraded copy replaces A's backup. Reset A and A is gone too.

Restore now touches widgets and alarms and leaves the backup alone. The last-write time is set to now so the next edit waits the usual interval, and the "last backup" shown in Settings is the backup's own saved date. The "saved by a newer version of the app" notice that the local loader and the file importer already show is attached to cloud restore too; the decoder silently accepts unknown versions, so the JSON has to be scanned separately. The undo clearing described in the previous section landed with this change.

### A third choice next to "Not now"

![The restore offer with three buttons, Start a new backup from this device, Restore, Not now, and the line "Automatic backup stays paused until you decide"](/blog/timetable-backup-seed-save/offer-three-choices.png)

"Not now" keeping the hold stays as decided. What was missing came after it: while the hold stands, automatic backup is paused and the same question returns on every launch, and nothing said so. Someone who never intended to restore had to find "Start new backup" in Settings before backups resumed. Lose the phone a few weeks later and there is no backup.

The alert now has "Start a new backup from this device" as a third option and ends with "Automatic backup stays paused until you decide." The third button calls the same function as the Settings row: release the hold, save on the spot so the first backup is written now, and re-arm if the save fails. It is destructive, so it is red and the system puts it first.

### Where it stands

Account switches and late metadata cannot be proven on the simulator. The classification is a pure function tested across all four combinations, and the first-write guard is tested with a file placed in a temporary folder first: no write, hold re-armed, original bytes intact. The two-device, two-account sequence stays a hardware check. Conflict versions that iCloud keeps when devices alternate writes are still not consulted; this file is a one-way recovery copy, not sync, and that decision stands.

## October 13, 2026 — The prompt and the write gate were reading different state

The first-launch hold arms when the local store is empty at launch. One kind of device never matched: an install from before the hold existed, opened once and left alone. Its default timetable was already saved, so the store was not empty.

The restore offer has a second trigger, though: tutorial unfinished, one empty timetable, offer never answered. That device matched it. It showed "Restore from your previous device?" and accepted "Not now" — while the only thing that blocks a write, the hold flag, was off. The next edit replaced the backup.

Aligning the two conditions would fix this case and leave the next one. So the write path now asks its own question: did this install create that file? Overwrite permission is stored separately from the hold. It is granted by a successful restore, an explicit "Start a new backup", or this install's own successful write, and revoked whenever the hold re-arms. Without it, a write that finds a file at the destination does not write and arms the hold instead. With no file there, it writes as before.

The earlier first-write check marked one specific release path. This one does not care how the hold came to be off.

Installs with no recorded permission are treated as owners when they have a last-backup time or a resolved offer, so existing users keep backing up. The check only sees metadata that has reached the device; it is a second line behind the hold, not proof of remote absence.

One test lesson: the helper used to plant "another device's backup" also stamped this device's last-backup time, which made the guard see an owner. The fixture was erasing the state under test; the pre-fix failure only reproduced after clearing it.

## History

- October 8, 2026 — Hold backup writes before a fresh install creates its default timetable.
- October 13, 2026 — Preserve nested decode failures, hold backups after local recovery loss, protect undownloaded backups, and keep the newest queued snapshot through unavailable periods.
- October 13, 2026 — Lossy-load wording, gather-finished-plus-quiet absence, save version 15, remembered visible range, overlaps kept with alarms pinned (second review, on top of the proposal above).

- October 13, 2026 — Remove quiet-query auto-release, move coordinated I/O off the UI actor, distinguish upload completion, and clear pre-restore undo/redo.
- October 13, 2026 — Compare the account token at every launch (sign-out is not a switch), check for an existing file at the first write after a discovery release, never rewrite the backup right after a restore and warn on newer-app backups, add "Start a new backup from this device" to the offer.
- October 13, 2026 — Separate overwrite permission from the hold; an install that never wrote does not replace an existing backup (installs that predate the hold).
