---
title: "The upload said success, but testers never got the build"
date: 2026-09-24T21:30:00+09:00
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
