---
title: "To share calendars as files, we turned the share file into a zip, then went back to JSON a day later"
date: 2026-11-18T12:32:13+09:00
app: "timetable"
tags: ["devlog", "data"]
summary: "The .supertimetable share file now carries calendars too. Adding a type field to the JSON would have made older apps read a calendar as a broken timetable, so the container became a zip. A day later we reversed that and went back to a single JSON file."
---

You can now send a whole calendar as a file. Calendar `…` › Share › Export as File writes one `.supertimetable` file. When the recipient opens it, the calendar is added to their calendars and opens right away.

> 2026-11-18: the zip format below was withdrawn a day later. The app writes a single JSON file again. The last section says what changed and why; the text above it is the reasoning as it stood on November 17.

## Same file name, new inside

The old `.supertimetable` was one timetable written out as JSON. The November 17 build made it a zip with a table of contents and the documents.

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

Older app versions can't open the new files, so the recipient has to update. Android switched to the same format the same day. It had no calendars that day, so it imported only the timetables in a file (it imports calendars now).

The same day we also removed the 500-series cap per calendar, now that the SQLite store writes only the rows that changed. AirDrop on real devices and the Mac haven't been tested yet.

## 2026-11-18: back to a single JSON file

A day later someone asked whether `.ics`, the standard calendar file, is a zip inside. It isn't. It is one plain text file with no compression and no index, and calendar apps read it whole once, on import. Day to day they use their own database.

Our share file is in the same position. It holds one document and is read whole, once. "Read entries selectively when it grows" was one of the reasons for the zip, and nothing ever needed it. Speed with many events is the on-device store's job, and SQLite already handles that. The cost was that older apps could no longer open plain **timetable** files, which had nothing to do with calendars.

So the zip is gone. Both files are a single JSON again:

| File | What is written now | In an older app |
|---|---|---|
| Timetable | The same JSON as before November 17, byte for byte | Opens as before |
| Calendar | `{"documentType": "calendar", "calendar": { … }}` | "Can't open this file" |

The calendar file took a second pass. The first version put a marker at the top of the calendar JSON. That caused exactly what we had worried about: because the calendar's keys have the timetable's names and places, an older app imported the file as a weekly timetable, and one-off events became weekly ones. The November 17 judgment that a wrong import is worse than a refusal was right. Going all the way to a zip to avoid it was not.

One level of wrapping is enough. With the calendar under a `calendar` key, the top level has none of the keys a timetable reader looks for, so older apps refuse the file cleanly. Newer apps see the marker and read the inner object as a calendar.

The zip reader was removed too. Files made by the test builds of those two days no longer open; exporting again is cheaper than keeping code that vets someone else's zip. iOS and Android changed together.

One test stands in for older apps. It feeds an exported calendar file to the timetable reader and expects it to fail. Opening the file in the actual store version is still to do.

## History

- 2026-11-17: added calendar file sharing and made the share file a zip bundle
- 2026-11-18: withdrew the zip, both writing and reading, and went back to a single JSON file; a calendar sits under a `calendar` key so older apps refuse it
