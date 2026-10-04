---
title: "One-line Android test builds, like TestFlight — except the first one"
date: 2026-09-27T03:30:00+09:00
app: "timetable"
tags: ["devlog", "android"]
summary: "iOS builds reach TestFlight with one command; Android builds were being copied by hand. Two fastlane lanes now ship to Play internal testing and Firebase. Both walls we hit were console settings, not code."
---

Rebuilding SuperTimetable for Android meant we first needed a way to get builds onto phones. On iOS one command puts a build on TestFlight. The Android project could not even produce a signed release build.

## One command, two destinations

| Command | Goes to | Testers install via |
|---|---|---|
| `fastlane android beta` | Play Console internal testing (AAB) | Opt-in link, then the Play Store, with auto-updates |
| `fastlane android firebase` | Firebase App Distribution (APK) | Email invite and the App Tester app |
| `fastlane android build` | Local only | A signed AAB and APK |

Play internal testing is the closest thing to TestFlight. Firebase stays in the setup because it works before the app exists on Play. Version codes are never bumped by hand: each lane reads the highest code on every Play track and in Firebase, adds one, and passes it to Gradle as `-PversionCode=N`.

## Secrets live outside the repo

The upload key and its passwords live in the user's Gradle properties, not in the repository. Work here happens in separate git worktrees, and gitignored files do not follow into a new worktree. Keeping the files in the home directory means every worktree, and later CI through `ORG_GRADLE_PROJECT_*` variables, reads the same names.

## REST instead of a plugin

The usual Firebase plugin could not be loaded. Homebrew's fastlane cannot load plugins without a Gemfile, and the system Ruby, 2.6, was too old for bundler. So the Fastfile calls the App Distribution REST API directly: upload, poll, set release notes, distribute. fastlane already ships `googleauth` for Play uploads, so nothing new had to be installed.

## Permissions are per product

We reused a service account that already existed for GA4 admin work. Its GA4 editor role means nothing to Play. You invite the account under **Users and permissions** at the developer-account level, then grant rights app by app. It got four: release to testing tracks, manage testing tracks, release to production, and manage store presence. Payments and user management stay off, because the same key also touches analytics.

## Both walls were in a console

- **`Google Play Android Developer API has not been used in project N`.** Project N is the project that owns the service account, not the app's Firebase project. The service account got a 403 when it tried to enable the API itself, so the project owner had to enable it.
- **`Package not found`.** The Play Developer API only accepts uploads for an app that already has a build on Play. The first AAB has to be uploaded by hand in the console, and Play App Signing is set up at that moment. App Store Connect has no equivalent step.

## One more on the first real run

After the manual first upload, the lane read build 1 from the internal track, then stopped with `Cannot provide both apk(s) and aab`. fastlane's `gradle` action hands over every artifact in the build output folder. That included an APK left over from an earlier signing check. Adding `skip_upload_apk: true` to the Play lane made it upload only the AAB.

## Play is slow, so Firebase handles quick checks

The upload takes a minute, but a new build can take a long time to appear in testers' Play Store. A brand-new app's first releases get reviewed, and store propagation adds more delay. Firebase App Distribution has no review. When the upload finishes, the invite goes out and testers install the APK. Quick fix-and-check builds now go to Firebase. Builds where the store install flow matters go to Play.

The original plan was four console stops, reusing the same service account. The table covers the case where the service account and the Firebase project differ. We later merged them into one project, which made the first two rows unnecessary:

| Where | What |
|---|---|
| The app's Firebase project, Cloud IAM | Add the service account with the `Firebase App Distribution Admin` role |
| The project that **owns** the service account, API Library | Enable `Firebase App Distribution API` |
| Firebase console, App Distribution | Click Get started for the Android app once |
| App Distribution, Testers & Groups | Create a group with the alias `testers` and add emails |

The second row is the same trap as with Play. Permissions are checked in the project that invited the account. API usage is billed to the project that owns it, so the API has to be enabled there, and only the owner can do that.

## One package name, one Firebase project

Step three failed. The Firebase console said the project did not exist or we lacked access. The Android app had been registered in March under a different account's Firebase project, while iOS used the project that owns the service account. We registered Android in the iOS project and changed the package name to match the iOS bundle ID, `com.hyewoninsong.supertimetable`. The cost: a package name that has had a build uploaded to Play belongs to that Play app forever. The old Play app is abandoned, and the new one needs a manual first upload again. Before launch was the cheapest moment to pay that cost. Only `applicationId` changed. The Kotlin `namespace` stayed.

## A missing group returns a bare 404

The first Firebase run uploaded fine (`RELEASE_CREATED`), then the distribute call returned `404 Requested entity was not found`. The `testers` group did not exist yet. The lane now lists groups before building and fails with a clear message. The group and the testers were created through the API, since the console hides the Android tabs while the iOS app is selected.

## Where it stands

Firebase works end to end. Build 2 went out to four testers by email. Play needs the new app created and one manual upload, after which both lanes are one command.
