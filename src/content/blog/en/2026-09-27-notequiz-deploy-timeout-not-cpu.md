---
title: "It looked like a CPU shortage. The timeout was just too short."
date: 2026-09-27T21:40:00+09:00
app: "notequiz"
tags: ["devlog", "appstore"]
summary: "The release build for SuperMusicNote 1.0 failed three times before compiling a single file. The machine was busy, so we blamed the CPU. Measuring said otherwise: a step that takes 20+ seconds on an idle machine was given 24, and a shared build cache had been left with empty folders."
---

The TestFlight build for SuperMusicNote 1.0 failed three times in a row, before compilation even started. The first error said "timed out" and the load average was around 15, so the conclusion came easily: not enough CPU. **It was the wrong conclusion. We should have measured how long the step normally takes before blaming load.**

## A 20-second step, a 24-second limit

Before building, fastlane's `build_app` reads the project settings with `xcodebuild -showBuildSettings`. It retries with timeouts of 3, 6, 12 and 24 seconds, then gives up:

```
xcodebuild -showBuildSettings timed out after 4 retries with a base timeout of 3.
```

On the same machine at load 4, the command took 21 seconds, then 26. With `-disableAutomaticPackageResolution` it took 3. The time goes to **Swift Package resolution**: the app pulls Firebase through SPM, and every settings read resolves Firebase's package graph again.

So even with the machine quiet, there were only a few seconds of headroom, and any real load pushed all four attempts over. Freeing CPU wasn't the fix; the limit was simply too low. We set `FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT` to 60 seconds, in this app and as the default in the deploy script every app shares.

## A shared cache with empty folders

With the timeout raised, the next attempt failed differently:

```
error: There is no XCFramework found at '.../SourcePackages/artifacts/
firebase-ios-sdk/FirebaseAnalytics/FirebaseAnalytics.xcframework'
```

The folder existed and was empty. Firebase Analytics ships as a prebuilt binary, and an interrupted extraction had left the folder behind. Package resolution thought the binary was already there, so the archive failed at the same spot every time, and retrying couldn't change that.

That cache lives in Xcode's default DerivedData, which every build and test of the project shares. On a machine that often runs several jobs at once, one broken cache takes all of them down. Release builds now use their own DerivedData. Rebuilding Firebase each time costs about a minute and a half, and in return nothing another job leaves behind can reach the release. To repair the shared cache, removing `SourcePackages/artifacts` was enough.

## Where it stands

With these settings, 1.0 (build 8) is on TestFlight with crash symbols uploaded and is attached to the review version. We never found out why the shared cache broke. Two builds racing on it is the likeliest cause, but release builds no longer touch it.
