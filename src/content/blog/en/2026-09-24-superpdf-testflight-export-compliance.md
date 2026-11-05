---
title: "The upload said success, but testers never got the build"
date: 2026-11-05T19:09:34+09:00
app: "superpdf"
tags: ["devlog", "appstore"]
summary: "fastlane finished green and App Store Connect showed the build as VALID. TestFlight stayed empty. One unanswered encryption question had quietly parked four builds, and the only one that ever worked had been clicked through by hand."
---

A SuperPDF test build went up to TestFlight. fastlane printed "Successfully uploaded the new binary" and exited 0. The App Store Connect API reported build 7 as `processingState = VALID`. Minutes later, the tester's TestFlight app still showed nothing new. No line in the log was wrong. There was simply one more step between "uploaded" and "installable", and the build was stuck on it.

## VALID is not the same as available

Every build in App Store Connect carries a separate `buildBetaDetail` with an internal and an external state. Build 7 had both at `MISSING_EXPORT_COMPLIANCE`. Because of US export rules, Apple asks per build whether the app uses non-exempt encryption, and until that is answered the build finishes processing and then goes nowhere.

The older builds told the real story. Builds 3, 4, 5 and 7 were all parked in the same state. Only build 6 was `IN_BETA_TESTING`, because someone had opened the console and clicked "No". It had looked like "this worked last time". It had never worked on its own.

## The answer is one Info.plist key

The question can travel inside the build: `ITSAppUsesNonExemptEncryption` in `Info.plist`. SuperPDF only uses HTTPS and the crypto iOS provides, which is exempt, so the value is `false`. With the key present the question is never raised, and the build is released to testers as soon as processing completes.

Build 7 was unblocked through the API: patching `usesNonExemptEncryption: false` on the build with spaceship flipped it to `IN_BETA_TESTING` within seconds. That is the same thing the console click does. From the next build on, the plist carries the answer and the step disappears.

## Why it was missed

The signal was already there. The post-deploy script that opens the `.ipa` printed `ITSAppUsesNonExemptEncryption (missing)`. It was an informational line, so nobody acted on it, and the script still ended with "OK". The report then took fastlane's exit code as proof of a finished deploy.

So the definition changed. "Deployed" now means `internalBuildState = IN_BETA_TESTING` has been read back from App Store Connect. Neither the fastlane exit code nor `VALID` counts. A missing compliance key in the `.ipa` is treated as a defect, not a note.

## The other snag that day

The first upload was rejected before any of this: "The bundle version must be higher than the previously uploaded version: '6'". The project file said 3, fastlane bumped it to 4, and the server already had 6.

This app's Fastfile increments the local build number instead of asking TestFlight for the latest one. But the deploy always builds from a temporary checkout of the integration branch's tip and throws that checkout away afterwards, bump included. The branch stays at 3 forever while the server moves on. The fix this time was to set the number to 6 by hand and let the lane bump to 7. The real fix is to base the number on `latest_testflight_build_number`, so there is nothing local to lose.

## Where it stands

Build 7 is with testers and the plist key is in the repo. The deploy tooling is getting a post-upload beta-state check and a preflight rule that blocks when the key is missing, so the next app does not have to learn this the same way.

## 2026-11-03 — This time the build never showed up at all

Build 48, the first with the on-device neural voice engine (sherpa-onnx on onnxruntime), failed differently. The uploader printed `UPLOAD SUCCEEDED with no errors`, yet an hour later App Store Connect still listed no build 48, not even as processing. There was no beta state to read because there was no build. `altool --validate-app` on the same `.ipa` passed. The reason arrived only by email:

> ITMS-90208: Invalid Bundle - The bundle MindPDF.app/Frameworks/onnxruntime.framework does not support the minimum OS Version specified in the Info.plist.

Inside the `.ipa`, that framework's Info.plist said iOS 13.0 while its binary's `minos` said 26.2, and the binary was 51 KB instead of 44 MB. Both engine xcframeworks wrap static archives in `.framework` bundles. Through a Swift package `binaryTarget`, Xcode 27 links the code into the app and still embeds the empty shell, logging `Injecting stub binary into codeless framework`. The stub is compiled for the app's deployment target; the plist keeps the original 13.0.

The fix was to stop shipping the shell, not to edit its plist. The vendor script now repacks both as library xcframeworks (`.a` + headers + module map), which are linked but never embedded. The new archive has no `Frameworks/` folder and the same engine code in the main binary. Patching the plist to 26.2 would have kept an empty framework in every build and broken again on the next deployment-target change.

Same lesson as September: a success message only means Apple received the file. A build that has not appeared after fifteen minutes was rejected, and the reason is in the inbox. The `.ipa` inspector now compares each embedded framework's binary `minos` with its plist and blocks on a mismatch.

## 2026-11-05 — This time it installed, then died on launch

Builds 56 and 57 reached testers and read back as `IN_BETA_TESTING`, which is September's definition of deployed. Tapping the icon closed the app before anything drew. The TestFlight crash report was two lines:

```
Termination Reason: DYLD 1 Library missing
Library not loaded: @rpath/AMSMB2.framework/AMSMB2
```

dyld could not find a library before a single line of app code ran. The Korean morphological analyzer Kiwi had landed the same day and looked guilty, but it and the voice engines are static archives inside the main binary. `otool -L` showed one `@rpath` dependency: AMSMB2, added two days earlier for importing PDFs from SMB file servers.

AMSMB2 ships as a dynamic library product. A dynamic library needs a link entry and an Embed Frameworks entry that copies it into the app's `Frameworks/`. Adding the package in Xcode's UI creates both; this time the project file was edited by hand and only got the link. Build 57's archive had no `Frameworks/` folder at all.

Why tests missed it is the point: on the simulator, dyld also searches Xcode's build products folder, where AMSMB2 sits, so the app ran and every test passed. Only the bundle that goes onto a device lacked it.

The target now has an Embed Frameworks phase with AMSMB2 signed on copy, and the rebuilt archive contains it. The release lane checks every `@rpath` framework the binary loads against the app's `Frameworks/` before uploading, and the `.ipa` inspector does the same: build 57 now fails with a BLOCK line, the fixed build passes.

Third time, same lesson, one layer deeper. Upload success, beta state and a simulator run are not proof that the app launches on a device. That proof lives in the shipped bundle, and a script should open it before a person does.

## History

- 2026-09-24 — four builds parked on the export-compliance question; a build number behind the server
- 2026-11-03 — build 48 rejected with ITMS-90208 after Xcode embedded a stub into a static-library framework
- 2026-11-05 — builds 56 and 57 crashed at launch: a dynamic library linked but never embedded
