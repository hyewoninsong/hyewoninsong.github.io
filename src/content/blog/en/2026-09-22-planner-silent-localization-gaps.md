---
title: "A missing translation never raises an error"
date: 2026-09-22
app: "daily-planner"
tags: ["devlog", "appstore"]
summary: "SuperPlanner ships in five languages, and asked for alarm permission in Korean in all of them. Neither the app nor the store complains when a locale goes missing."
---

SuperPlanner ships in Korean, English, Japanese, and both Chinese scripts. Every on-screen string lives in one catalog, and a test fails if any of the five is blank. While going through the release checklist, a phone set to Japanese asked for alarm permission — in Korean.

## A permission string is not a code string

The sentence in the AlarmKit permission dialog comes from `NSAlarmKitUsageDescription` in `Info.plist`. The app never reads that value; the system pulls it out of the bundle and draws it in its own dialog.

So it had no reason to be in the string catalog, and it wasn't. The test that catches missing translations only reads that catalog, so it could not see the gap: **the string wasn't missing, it was never in scope.** The whole bug is that a second kind of user-facing string existed.

It stayed invisible for a simple reason. The device doing the building is set to Korean, so the dialog always looked right. You only see it by switching the simulator's language and asking for permission from scratch.

The fix is one file. In `InfoPlist.xcstrings` the key is the plist key rather than the source sentence, and the values are the five translations. After building, the check is not a test but the **build product**:

```
$ plutil -p todo.app/ja.lproj/InfoPlist.strings
{
  "NSAlarmKitUsageDescription" => "一日に置いたやることの開始・終了の時刻に…"
}
```

Having a value in a catalog and having an `.lproj` in the bundle are two different events. A string catalog can declare a language and still produce nothing, so this app already verifies all five `.lproj` folders land in the build. The permission string is now checked in the same place.

## The store listing has a hole with the same shape

The App Store description is in five languages too. fastlane reads `fastlane/metadata/<locale>/description.txt`, and the folder name has to be an App Store Connect locale code — `en-US`, not `en`; `zh-Hans` and `zh-Hant`, not `zh`. **A misnamed folder is skipped in silence.** That language simply doesn't go up, and the log happily reports the other four.

There is one more quiet spot. What actually landed has to be read back from the stored values, **not from the upload log**. The first run here died at the very end with `No data` — a first version has no review-details record yet, and deliver reads one — but by then every locale was already uploaded. Going by the log alone, it would have looked like a failure worth retrying.

So the copy lives in the repository and a script gates the upload: same section count per locale, same bullet count per section, every field inside its character limit. Locale parity is the rule that rots first, because you cannot see it by reading one file — add a section to one language, or drop one, and nobody knows unless all five are counted side by side. That is a rule for a script, not for a reviewer.

## Silent failures are caught in the output

Both cases share a shape: something is absent and nothing errors. A missing translation falls back to the source text, a misnamed locale folder is skipped, and an upload log describes what was sent rather than what arrived. In places like these, don't trust the declaration — look at the result: the `.lproj` folders inside the built `.app`, and the values stored on the store.

## Where it stands

Version 1.0 on App Store Connect now has its copy, categories, age rating, price, and territories. What's left needs a human — the app privacy label, review contact details, screenshots, and attaching a build. Screenshots are next.
