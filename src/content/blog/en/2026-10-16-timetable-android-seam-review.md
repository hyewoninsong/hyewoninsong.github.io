---
title: "We reviewed 53k lines of Android code. Every real bug sat on a seam."
date: 2026-10-16T11:43:08+09:00
app: "timetable"
tags: ["devlog", "android", "data"]
summary: "A whole-codebase correctness review of the Android app found zero bugs in the pure math and the gesture layer, and fifteen in the seams between two owners."
---

We reviewed the whole Android app for correctness, 53k lines, and fixed 15 bugs as 15 PRs. The pure math (period axis, lunch slot, snapping, collision, next-alarm time) and the gesture layer had no bugs. Every real bug sat where two owners meet.

## Three examples

**Cold-start import overwrote the save file.** Five intent handlers waited for the store to finish loading. The import handler did not. It inserted into the still-empty list, autosave wrote a file holding only that timetable, and when loading finished memory recovered (the success snackbar even appeared) while disk kept one timetable. The fix: wait for load, and make the store's insert refuse before load. A gate that four siblings have and one lacks is invisible in a diff; only a sweep over every handler finds it.

**The widget's read was a write.** The widget reads the save file through its own persistence instance, whose `load()` does everything the app's does: back up before an upgrade, rewrite a repaired file, quarantine an unparseable one, stamp the "newer app data" notice. No shared lock, same temp file name. So two writers could collide on first launch after an update, and the widget could consume the one-time rollback warning before the app showed it. The fix is a read-only mode where `save()` throws. A second instance inherits every side effect of the first.

**The alarm rang again after Stop.** The full-screen activity started playback in `onCreate`. Stopping from the notification silenced the service but left the screen; a rotation, dark-mode toggle or process-death restore re-ran `onCreate`, and the service, seeing no session, rang again. Now the screen remembers the alarm code in saved state, skips the start on recreate, and finishes itself when the ringing code becomes null. `onCreate` must be idempotent per alarm.

## The rest of the family

- Alarms were not re-synced on timezone change; only the widget tick listened.
- An inexact-window alarm rolled to next week when a resync ran three minutes after its time.
- A tablet popover closed by an outside tap skipped the discard the X button performs.
- `update()` lacked the duplicate check `add()` has.
- A decorator turned a post-save hook failure into a "save failed" alert.
- A two-way TextField sync reverted a keystroke.

## Why this method

Five reviewers split by area, each told to give a concrete failure scenario per finding and that a false positive costs more than a missed one. Every finding was re-verified by reading callers before fixing. One PR per bug, each with a reproduction test case and a decision note, merged in dependency order; append conflicts in the test catalog were resolved mechanically with pre-assigned IDs.

Two alternatives lost. One big PR is unreviewable and one revert takes everything. Fixing without re-verification would have shipped two plausible false positives: a "snap tie-break" that was documented intent, and a calendar-record race whose callers are sequential.

## Where it stands

Nothing was verified on a device in this session; each PR carries a manual test case for that. The seam checklist went into our Android UI skill.
