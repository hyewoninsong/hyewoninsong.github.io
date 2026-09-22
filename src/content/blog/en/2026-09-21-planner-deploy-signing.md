---
title: "An empty array cost six builds"
date: 2026-09-23T01:40:00+09:00
app: "daily-planner"
tags: ["devlog", "appstore"]
summary: "The first TestFlight build after adding iCloud sync died at code signing six times, each one three minutes in. Every cause came down to not telling 'off' apart from 'on with nothing attached'."
---

The sync code was already merged. All that was left was shipping it, and that took six failed attempts. Every failure landed in the same place: after the compile finished, at code signing, three minutes in. The four causes were unrelated to each other but shared one shape — something could not tell **"missing" apart from "present but empty."**

## An entitlement has to match in three places

Adding a capability writes it in three places: the app's entitlements file, the App ID on the developer portal, and the provisioning profile built from those two. The first two were set, and the build still died.

```
error: Provisioning profile doesn't support the iCloud.…superplanner iCloud Container.
```

The portal clearly showed iCloud switched on, which is what made this take so long. The answer was inside the profile:

```
<key>com.apple.developer.icloud-container-identifiers</key>
<array></array>
```

A missing key and a key holding an empty array are different states. The first means the capability is off. The second means it is on with nothing attached to it. On the portal, enabling iCloud, creating a container, and attaching that container to the App ID are three separate actions — and if no container exists yet, the attach list is empty, so there is nothing to tick and it looks finished.

## There is no Xcode account on a headless machine

Fixing the profile exposed the next wall. Automatic signing works by having the account logged into Xcode talk to the portal for you, and a command-line build has no such account.

```
error: No Accounts: Add a new account in Accounts settings.
```

xcodebuild accepts API key credentials directly, so that was the next thing tried — and it failed on a bad bearer token, using the same key file that was already fetching certificates and profiles successfully. The two are **separate code paths**; one working says nothing about the other. So rather than fixing automatic signing, the build switched to manual signing against the profile already on disk, which removes the need to talk to the portal at all.

## Manual signing belongs to the app target only

Passing the manual signing settings to the whole build broke Firebase instead.

```
error: Firebase_FirebaseCore does not support provisioning profiles.
```

Build settings passed on the command line apply to **every** target in the build, including the ones generated for package dependencies. Libraries are not signed, so a profile cannot be given to them, and giving one is an error. Scoping the settings to the single app target fixed it.

One more thing was hiding there. The code that restored the settings after the build only restored **half** of them: the signing style flipped back to automatic, but the certificate and profile names stayed behind in the project file. That file is tracked by git, so committing it unnoticed would have broken everyone else's build too. Restoring now resets the file outright instead of calling the inverse operation.

## Ask in ten seconds, not three minutes

All four of these only appear after a full compile. Each question costs three minutes. So there is now a short path that fetches just the profile and dumps the permissions inside it — ten seconds to find out whether the portal is right yet. The pre-deploy checks do the same comparison automatically: what the entitlements file asks for against what the profile actually grants, and an empty array is reported as "on, but nothing attached." (That check looked at **one target**. Once there were two, its blind spot became the next outage — see 2026-09-23 below.)

Building that check walked straight into the same trap twice more. Converting a whole profile to JSON fails because of the embedded certificates and dates. And Python's plist module fails to import at all in this environment — with the error swallowed, that outcome looks **exactly like "nothing to report."** The first version was printing a green check while seeing nothing. A check that passes while blind is what every problem in this post turned out to be. An empty comparison result is now reported as "could not compare," never as a pass.

## Where it stands

The build shipped. One thing is noted but not yet hit: the entitlements file declares the development push environment while the distribution profile grants production. It passed this time, but manual signing can reject that mismatch, and if it does the file will need to be split per configuration.

## 2026-09-23 — two targets means two of everything

A home screen widget went in, and the next deploy died in the same place.

```
Provisioning profile "iOS Team Provisioning Profile: *" doesn't include the App Groups capability. (in target 'todoWidgets')
```

Having written the post above, the answer looks obvious: the capability is off in the portal. It was not. The real cause was that **the extension's App ID had never been registered at all**. The deploy script was built when there was one target, so it only ever fetched a profile for the app — the widget had never talked to the portal.

The tell is inside the error. The profile name is `iOS Team Provisioning Profile: *`, a wildcard. That does not mean "the right profile is missing a capability," it means **no matching profile exists and something generic got picked up**. An unregistered App ID never gets a profile, no matter how many capabilities are switched on. Last time's "missing vs. present but empty" had simply moved one step earlier.

With manual signing, adding a target adds three things: registering the App ID, issuing its profile, and writing that profile's name into the project. The last one hides a trap. The action that fetches a profile stores the result in a **single shared slot**, so fetching the second target's profile overwrites the first. And the action that writes signing settings takes **one** profile name — pass both targets at once and they both get the same profile, which fails. Capture each result right after fetching it, and call the setter once per target.

## Measuring where automation stops

While in the portal anyway, it was worth finding out how much a script can do. Registering an App ID through the App Store Connect API works. Switching a capability on works. Creating the App Group itself has no endpoint.

| Call | Result |
|---|---|
| Register an App ID | works |
| Turn on a capability | works |
| Create an App Group | 404 — no such resource type |
| List the groups on an App ID | 404 — no such relationship |
| List iCloud containers | 404 |

The 404 is not "forbidden," it is "that path is not defined." Which explains, belatedly, why the iCloud container last time had to be made by hand. So the boundary is: **App IDs and capabilities by script; creating groups and containers, and ticking them onto each App ID, by a human in the web UI.** Next time this step blocks a deploy, no time gets spent looking for an API.

The pre-deploy check changed too. It now walks **every** signable target in the project and checks each bundle ID is registered before anything is built. If last time's lesson was "never read an empty array as a pass," this one is **"whatever the check looks at is the check's limit."** A check written for one target quietly sees half the picture the moment there are two.

## History

- 2026-09-21 — first deploy after iCloud sync; six failures at code signing
- 2026-09-23 — a widget extension made it two targets; an unregistered App ID, and where automation stops
