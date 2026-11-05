---
title: "Fonts installed by a font app were missing from the list — iOS only hands them out by name"
date: 2026-11-06T08:53:07+09:00
app: "superpdf"
tags: ["devlog", "uikit"]
summary: "Profile-installed fonts show up in none of the font enumeration APIs inside a third-party app, yet resolve by name. The list now comes from a cache file iOS leaves next to the font files."
---

Fonts installed through SuperFont now appear in SuperPDF's text box font list. Yesterday's fix for the same report did not work on a real phone — it was a guess, and the guess was wrong.

## The report came back

SuperPDF's text box lets you pick any font on the device. Yesterday the report was "fonts installed via a configuration profile are not in the list." The fix assumed `UIFont.familyNames` drops them and the full CoreText descriptor collection (`CTFontCollectionCreateFromAvailableFonts`) would have them. The simulator cannot install profiles, so no test walked that path; the PR said "device-only verification" and shipped.

The same report arrived the next day.

## One unit test on the device

The phone was paired over Wi-Fi. No capture pipeline, no UI test — a single unit test full of `print` statements, run with `xcodebuild test -destination "id=<device>"`, lands in the log. The first attempt hung for 15 minutes because the phone was locked. Unlocked, it took two.

| Asked | Answer |
|---|---|
| `UIFont.familyNames` | 86 families, all built-in |
| `CTFontManagerCopyAvailableFontFamilyNames` | the same 86 |
| `CTFontCollectionCreateFromAvailableFonts` descriptors | 295, every file under `/System/Library/Fonts` |
| `CTFontManagerCopyRegisteredFontDescriptors` | 0 |
| `UIFont(name: "MaplestoryOTFLight")` | **Maplestory OTF** — works |

174 profile-installed faces across eight families are in none of the enumeration APIs, yet every one resolves by PostScript name, and a descriptor match with the family as a mandatory key finds them too. Settings and the system font picker show them because they are system processes. A third-party app can use what it can name, and cannot ask what exists.

## Where the names come from

The files sit in `/var/mobile/Library/Fonts/Managed/` as `<PostScriptName>_<hash>`, no extension, readable from the app sandbox. Next to them is `AddedFontCache.plist` — iOS's own cache listing family, PostScript and full names per file. Reading it yields the eight family names without opening 174 files.

So the list is now three layers: the registry APIs (built-in and Apple-downloaded fonts), the plist's families, and `CTFontManagerCreateFontDescriptorsFromURL` only for files the plist has not caught up with. Rendering is unchanged — name lookup always worked.

No registration. `CTFontManagerRegisterFontsForURL` on those files returns 105, "already registered": the system considers them registered and simply does not enumerate them for apps. Registering descriptors built from the file data fails with 303. Neither was needed.

## What lost

- The Fonts capability entitlement — the official way to enumerate user fonts, but an entitlement missing from the App ID blocks distribution signing; this app already lost four weeks to that with iCloud.
- Parsing all 174 files every time the sheet opens — 60 MB of reads for information the plist already has.
- Routing users to the system font picker — yesterday's answer. It works, but a font that is on the device and not in "fonts on this device" is not explainable. The button stays, because fonts a font app registers with the Fonts capability still need it.

## What should have caught it

Writing "device-only verification" should have been the moment to verify. The phone was attached and it took ten minutes. There is now a test that asserts every profile family is listed and renders as itself; it skips silently on the simulator and on devices without profiles, and only bites on a real one.

`Managed/` and `AddedFontCache.plist` are private layout. If iOS moves them the list quietly goes empty, nothing crashes, and the font picker button is still there.
