---
title: "The watch app built fine. Uploading it stopped in four places."
date: 2026-10-05T08:30:00+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "We added an Apple Watch app, confirmed all four targets built and embedded, and then tried the first TestFlight upload. The portal, signing, an iCloud container and an icon stopped it in turn. None of them is on the path a build takes."
---

SuperTimetable gained an Apple Watch app and a complication. All four targets built, and the watch app was embedded in the iPhone app where it belongs. The next day's test build stopped four times, each fix exposing the next stop.

## Every stop was outside the build

| # | Where | What was missing |
|---|---|---|
| 1 | Pre-deploy checks | The watch app's identifiers had no App Group |
| 2 | Archive signing | No provisioning profile for the watch target |
| 3 | Archive signing | The iCloud container was not attached to the iPhone app's identifier |
| 4 | Upload | The watch app had no icon |

A simulator build does not sign anything and never meets store validation, so none of this was visible before merging.

## The archive did not use the profiles we had downloaded

The second stop was the confusing one:

```
Provisioning profile "iOS Team Provisioning Profile: *" doesn't include the App Groups capability.
(in target 'TimetableWatch')
```

The trailing `*` means the team wildcard profile. That usually says the identifier is not registered, but it was. The deploy lane was already fetching an App Store profile per target with `sigh`, and the watch one carried the App Group.

The archive simply does not use those. The project signs automatically, so `xcodebuild archive` picks an Xcode-managed development profile on its own. Existing targets passed on profiles cached on the Mac. The new target had none, fell back to the wildcard, and a wildcard profile cannot carry an App Group.

`-allowProvisioningUpdates` was already there, but only on the export step, which runs after the archive. Passing it to the archive fixed it. It needs the team's account signed in to Xcode; this Mac only had a personal-team account, and nothing showed that while no new profile was needed.

We also tried passing the API key to `xcodebuild` directly. The key `sigh` accepts was rejected with an authentication failure. We did not find out why.

## A capability being on is not the same as being attached

iCloud was switched on for the identifier. Creating the container and attaching it are separate steps, and the second was missing. The capability list cannot tell you; the downloaded profile can:

```
icloud-container-identifiers  []
```

An empty array means nothing is attached. Creating and attaching groups and containers has no public API, so a person does it in the portal.

## A watch app carries its own icon

With signing fixed, archive and export passed and the upload was rejected:

```
409 Missing Icons. No icons found for watch application 'Timetable.app/Watch/TimetableWatch.app'
```

The watch app ships inside the iPhone app but is its own bundle and needs `CFBundleIconName` in its own `Info.plist`. Without an icon it still compiles, signs and embeds. Only store validation refuses it, after a full archive.

The iPhone app's icon file already declared a circular watchOS variant, so the art stayed as it was. We gave the watch target a copy and named it in the build settings, with a test that the copy matches the original. Sharing one file between targets was possible, but the project assigns files to targets by folder, and a checked copy was the smaller risk.

Building just the watch app without signing takes about a minute and shows whether the key is there.

## Adding a target ends at the upload

The build with the watch app is on TestFlight now. For every new bundle identifier we count three things: groups and containers attached in the portal, a profile the archive can obtain, and an icon in each bundle. None of them appears in a build log.
