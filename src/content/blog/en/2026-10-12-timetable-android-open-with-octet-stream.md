---
title: "Tapping a timetable file in Files did not offer our app"
date: 2026-10-15T01:46:35+09:00
app: "timetable"
tags: ["devlog", "android", "data"]
summary: "We ported the iOS manual test catalog to Android and ran it for the first time. Two rows failed: the Files app did not list Timetable under \"Open with\", and a schedule touching the selected one could not be picked with a tap. Unit tests covered both spots and were green."
---

On Android, tapping a received timetable file in the Files app now lists Timetable under "Open with". A schedule sitting directly below the selected one can be picked with a single tap. Both were assumed to work until we ran the tests by hand, the way a user would.

## The test built its own intent; Files builds a different one

Timetables travel as `.supertimetable` files. The app accepted them through `ACTION_VIEW` filters that match the extension with `pathPattern`. A test guarded that, and passed.

The test's intent carried a URI and no type. The real Files app sends something else: for an unknown extension it attaches `application/octet-stream`, and the URI looks like `content://…/document/msf%3A31`, with no file name in it.

That difference decides everything. **A filter without `mimeType` does not match an intent that has a type.** No type in the filter means "untyped intents only", not "any type". And with no file name in the URI, `pathPattern` has nothing to match. Both conditions missed.

One line shows it on an emulator:

```
adb shell cmd package query-activities -a android.intent.action.VIEW \
  -d content://… -t application/octet-stream
```

Before the fix it returned nothing.

## A filter that cannot check the extension

The fix is one more filter: `content` scheme, `application/octet-stream`, no path condition.

It is broad. Timetable now shows up under "Open with" for any file of unknown type. The alternatives lost for simple reasons:

- **Declare a custom MIME type.** The sender picks the type, so declaring one on the receiving side changes nothing.
- **Import only from inside the app.** That removes the first thing a recipient tries: tapping the file.

So the door is wide and the check happens inside. Files that are not timetables are refused at import, along with broken files, files over 10 MB and files with more than 500 schedules. We exercised each refusal through both entry points.

## The resize handle was covering the neighbour

A selected schedule grows resize handles, and the handles respond a little outside the block so they are easy to grab. When another schedule sits right below, "a little outside" is the top of that neighbour. Tapping there was read as a tap on the selected block's handle, and the edit sheet opened.

![Math is selected; its lower handle touches the English block](/blog/timetable-android-open-with-octet-stream/math-selected.png)

![Tapping the top of English now selects English](/blog/timetable-android-open-with-octet-stream/neighbour-selected.png)

The rule now: if another block is under the finger, the handle's outer reach is zero. Toward empty cells it stays generous.

The same run surfaced a third thing. Changing a schedule's colour with "apply to schedules of the same style" took one undo per schedule, plus one. Each schedule was a separate store call, and each call is one undo entry. It is a single call now.

## Why none of this was caught

All three spots had passing unit tests. The tests were not wrong; their inputs were not the real inputs. The intent was not shaped like the one Files sends, the blocks in the tap test did not touch, and the undo test changed one schedule. Each now has a test with the real shape.

## Where it stands

After the fixes, 12 of the 14 related rows pass. The other two were not failures but could not be judged: one needs the unfolded screen, one used a fixture whose 500 schedules stack in a single cell. Of 239 rows, 37 have been run so far. Unfolded posture, dark mode and the release build come next.

## 2026-10-15 — Samsung My Files sends an empty type

The same report came back from a Galaxy. Tapping the file in Samsung My Files said no app could open it. That build had already passed every shape we could think of on the emulator: messenger `*/*`, Drive `application/json`, dotted file names.

So we stopped guessing and read the log on the phone:

```
MyFiles: There is no activity that can handle the intent.
         (type :  , data : content://media/external/file/57150)
```

- **The type is an empty string**, not null. MediaStore stores the file as `application/octet-stream`, but My Files uses its own extension table and sends `""` for one it does not know.
- **The URI is a MediaStore row id.** The file name lives in the row, and the app can only read it after it has been chosen.

Only `*/*` matches an empty type. A filter with no `mimeType` matches null only; we installed one to check, and nothing changed. `mimeType=""` does not parse. A Samsung developer forum thread reaches the same dead end.

An unrestricted `*/*` worked, but the phone then offered Timetable for every photo. Photos, video and audio go out as `…/images|video|audio/…`, and everything else as `…/file/<id>`. So the filter is pinned to `host="media"` with `pathPattern="/.*/file/.*"`. Timetable files open, and the photo and video choosers stay clean. PDFs and documents in that table may still list the app. A non-timetable file is refused at import, as before.

KakaoTalk could not be fixed from our side. It never sends an intent for an unknown extension, even with a catch-all filter installed. Its Share does reach the app, so that is the path for files received in KakaoTalk.

Both earlier rounds missed for the same reason: an emulator query only tests the shapes you thought of. Changes to these filters are now checked by tapping in the real sender on a real device, with logcat running.

## History

- 2026-10-12 — Files app `application/octet-stream`; tapping a touching neighbour
- 2026-10-15 — Samsung My Files' empty type; KakaoTalk via Share
