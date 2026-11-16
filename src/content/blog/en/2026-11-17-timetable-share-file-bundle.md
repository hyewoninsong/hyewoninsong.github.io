---
title: "To share calendars as files, we turned the share file into a zip"
date: 2026-11-17T02:29:50+09:00
app: "timetable"
tags: ["devlog", "data"]
summary: "The .supertimetable share file now carries calendars too. Adding a type field to the JSON would have made older apps read a calendar as a broken timetable, so the container became a zip and the content stayed the same."
---

You can now send a whole calendar as a file. Calendar `…` › Share › Export as File writes one `.supertimetable` file. When the recipient opens it, the calendar is added to their calendars and opens right away.

## Same file name, new inside

The old `.supertimetable` was one timetable written out as JSON. It is now a zip with a table of contents and the documents.

| Entry | Content |
|---|---|
| `manifest.json` | Format name, format version, and the ordered list of documents |
| `timetables/<id>.json` | One timetable, the exact JSON the old share file used |
| `calendars/<id>.json` | One calendar, the exact JSON the app saves on the device |

The extension did not change, and neither did how the app picks up the file. The app checks the first four bytes. A zip is read as the new format, and anything else as the old JSON, so files people already have still open.

The calendar did have an "Export as File" item before. It exported only the **week on screen**, as a timetable. Now the whole calendar goes out.

## Why not just add a type field

The smallest change would have been adding `"type": "calendar"` to the JSON. Two days earlier we had renamed the calendar's saved keys to match the timetable's (`schedules`, `startDayOfWeek`, and so on). An older app that doesn't know `type` would not reject the file. It would import it as a strange timetable, with the repeats gone and events on the wrong days. A wrong import is worse than "can't open this file."

We considered two other options:

- **One JSON envelope.** Older apps would reject it, as they do the zip. But a calendar with no series cap can grow large, and one JSON blob has to be read whole, which makes per-document limits hard.
- **A separate `.supercalendar` extension.** It needs a second file type, and a second set of Android "open with" filters. Those filters have already taken several rounds of device-by-device fixes.

Older apps reject the zip cleanly. It can hold timetables and calendars together. The content is the same JSON as before, so the decoders and the broken-file rules did not change.

## Reading a zip someone else made

1. Read the central directory first. The limits are 64 MB per file, 64 entries, and 32 MB per entry, and they are checked **before** inflating anything.
2. After inflating, the size must match what the directory claimed, and the CRC must match.
3. If any document decodes only partly, the whole file is rejected.
4. If the documents don't all fit under the 20-timetable and 20-calendar caps, none are added.

The zip code is our own, with no dependency. Writing uses stored entries and a fixed timestamp, so the same content gives the same bytes. Reading also accepts deflate, which Android's `ZipOutputStream` writes.

## The cost

Older app versions can't open the new files, so the recipient has to update. Android switched to the same format the same day. It has no calendars yet, so it imports only the timetables in a file. A file that holds only a calendar gets its own message.

The same day we also removed the 500-series cap per calendar, now that the SQLite store writes only the rows that changed. AirDrop on real devices and the Mac haven't been tested yet.
