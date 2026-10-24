---
title: "The submit button told us the build came from a beta Xcode"
date: 2026-10-24T21:16:00+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "Xcode 27.1 beta and 27.1 GM report the same version string. A release lane that picked Xcode by version grabbed the beta, and three 1.2.1 builds were refused at submission. The lane now pins the GM build number and reads it back from the archive."
---

We pressed Add for Review on 1.2.1 and App Store Connect refused: "This build is using a beta version of Xcode and can't be submitted." Builds 329, 330 and 331, all uploaded that day, were the same. The deploy lane had learned a rule the day before, "release builds use Xcode 27.1", and it was following it. There were just two 27.1s.

## The day before: release builds were going out on an old SDK

iPhone Duo support was finished and verified folded and unfolded in the simulator, yet the TestFlight build showed Duo the small compatibility layout. The archive's `DTSDKName` said `iphoneos26.2`. The simulator check ran on Xcode 27.1; fastlane archived with whatever `xcode-select` pointed at, which on this machine was 26.3.

Duo only gives an app its full-size layout and vertical toolbar when the binary's `LC_BUILD_VERSION sdk` is 27.1 or newer. So the lane gained two guards: before archiving, find the Xcode whose `CFBundleShortVersionString` is `27.1` and set `DEVELOPER_DIR` for this lane only; after archiving, read the SDK with `otool -l` and stop before upload if it is below 27.1. The comment said "betas (27.2 and so on) cannot go to the App Store, so match the version exactly." That sentence was the next day's hole.

## Two things called "27.1"

Five Xcodes live on this machine, named `Xcode.app`, `Xcode 2.app`, `Xcode 3.app`, `Xcode-beta.app`. The names say nothing. `Xcode 3.app` was a 27.1, and the lane took it.

| | 27.1 beta | 27.1 GM |
|---|---|---|
| `CFBundleShortVersionString` | 27.1 | 27.1 |
| `xcodebuild -version` | Xcode 27.1 | Xcode 27.1 |
| SDK | 27.1 | 27.1 |
| `ProductBuildVersion` | 27A9269 | 27A9275 |
| Released | Sep 18 | Oct 15 |

The only local value that separates them is `ProductBuildVersion` in `Contents/version.plist`. Version string, `xcodebuild -version` and an SDK floor all pass both. The guess that beta build numbers end in a lowercase letter is wrong too: 27.2 beta is `27B5028f`, 27.1 beta is `27A9269`. Nothing on disk says which number is the GM. Apple's releases feed is the only source.

The previous day's rule only imagined the next version's beta. It never considered a beta of the same version, installed before the GM and still sitting there after. The submit button was the only check, and it ran after three uploads.

## Pin the GM build number, read it back from the archive

The lane now carries `RELEASE_XCODE_BUILD = "27A9275"` and selects only an Xcode whose `ProductBuildVersion` matches. If same-version Xcodes exist with other build numbers, it stops and lists them with their numbers. The environment variable that forces a path goes through the same check, so a forced path cannot become a back door for a beta.

The post-archive check grew as well. What review looks at is `DTXcodeBuild` in the archived app's Info.plist, so the lane compares that against the GM number alongside the SDK floor. Whatever path produced the archive, it is caught before upload.

Two alternatives lost. Reading the releases feed live from the lane ties every deploy to network and parsing. Deleting `Xcode 3.app` fixes today and breaks the day the next beta lands. The GM number is read by a human and pinned; a new GM means a PR that bumps the constant. Downloading an Xcode changing nothing in the lane is the point.

## Where it stands

Build 332, archived with the GM, is attached to 1.2.1 with `DTXcodeBuild` 27A9275 and SDK 27.1. Listing every installed Xcode's build number and matching it against the feed before a store deploy is now part of the deploy procedure.
