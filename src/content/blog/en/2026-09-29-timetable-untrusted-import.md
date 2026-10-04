---
title: "We left timetable files readable and hardened the side that opens them"
date: 2026-09-29T04:20:00+09:00
app: "timetable"
tags: ["devlog", "data", "swiftui"]
summary: "A shared SuperTimetable file is plain JSON. We decided not to encrypt it and audited the import path instead — and found that changing two numbers in a file could crash the app."
---

SuperTimetable's shared timetable file stays plain, readable JSON. Instead of encrypting it, the app now treats every incoming file as untrusted, and two ways to crash the app with a hand-edited file are closed.

## Encryption would have protected nothing

- **There is no one to hide from.** People send the file on purpose to someone who is meant to see it.
- **A key inside the app is obfuscation.** Without a server, the key ships in the binary. Real encryption would need accounts and key exchange, which is far too much for a timetable.
- **Readable files pay off.** We can open a file a user sends in, old files keep decoding across versions, and the Android rebuild can simply parse it.

The real risk is a deliberately malformed file. That is the importer's job to handle, not the file format's.

## Two numbers were enough to crash it

**A reversed hour range.** `"startHour": 20, "endHour": 5` made the time axis build `Array(startHour...endHour)`, and Swift traps when the lower bound is greater than the upper bound. Imported timetables open right away, so the app died as soon as the file was opened. The widget had the same arithmetic.

**Extreme minute values.** `MinuteTime` clamps to 0...1440 in its initializer, but it relied on the synthesized `Decodable`, which writes the stored property directly and never calls that initializer. `Int.min` and `Int.max` got in, and computing a schedule's duration overflowed.

Neither value can be produced in the app's UI, which is why nobody had noticed.

## Fix, fall back, or reject

The app already has a rule never to truncate saved data on decode, so limits added later don't destroy old notes. We drew the line like this:

| Value | On decode |
|---|---|
| Length/count limits added later (your own save file) | Keep as-is |
| Values that crash (reversed range, minutes outside 0...1440) | Correct — default 6–22h range, clamp minutes |
| Size/count of an external file | Reject the whole file |

`MinuteTime` now has an explicit `init(from:)` that goes through the clamping initializer, and the stored format is unchanged. The widget's decoder mirror got both fixes. Incoming files over 10 MB or over 500 schedules are rejected rather than partly imported. 500 is the most schedules the app itself allows in one timetable. The file's size is checked before it is read.

## What we took away

The new tests build malformed files directly. Writing them hit one more trap: `URL` caches the file size it has already read, so reusing a URL after writing a smaller file still reported 10 MB.

If a type validates in its initializer, its decoder has to go through that initializer too. And a value the UI can never produce still has to be checked where a file is read.
