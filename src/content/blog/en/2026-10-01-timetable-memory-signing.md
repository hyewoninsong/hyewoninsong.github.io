---
title: "The app requested more memory. Its signing profile did not."
date: 2026-10-01T21:13:49+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "A freshly generated distribution profile still lacked the memory entitlement. Xcode's API-key signing flow resolved what a rejected capability API request could not."
---

Preparing a SuperTimetable 1.2.0 test build with every feature available stopped at code signing. The app requested Increased Memory Limit, but its provisioning profile did not permit it. Removing the entitlement would change the app we wanted to test, so we kept it and investigated signing.

## A new profile can still lack the requested permission

The app's entitlements contained `com.apple.developer.kernel.increased-memory-limit=true`. Both the development profile and a freshly generated App Store profile lacked that key.

That ruled out a simple explanation: choosing a development profile during archiving was not the whole problem. A distribution profile could also be wrong. Regenerating a profile had not enabled the capability.

We checked `get-task-allow` separately. It was `true` for development and `false` for distribution, as expected. It identified the profile's debugging permission; it did not establish whether the memory entitlement was granted.

The useful comparison was between the app's request and the profile's actual entitlements, not between their creation dates.

## One rejected API request did not rule out Xcode

An attempt to register the capability through the App Store Connect API rejected `INCREASED_MEMORY_LIMIT` as unsupported. It was tempting to conclude that an interactive Developer Portal login was required.

The response only established that this API request failed. It did not establish that Xcode's automatic signing flow was unavailable.

The installed `xcodebuild` help documented another path: `-allowProvisioningUpdates` lets automatically signed targets create or update signing resources. Authentication can use an App Store Connect API key through `-authenticationKeyPath`, `-authenticationKeyID`, and `-authenticationKeyIssuerID`.

We already had a key for uploads. Instead of assuming it could perform the operation, we tested the path and inspected its output.

## The archive needs signing updates before export starts

Our existing configuration allowed provisioning updates during export, but the failure happened earlier, during archive signing. An option on a later step could not solve an earlier step's missing permission.

We ran a device Release build with provisioning updates and API-key authentication enabled, retaining the memory entitlement. Provisioning completed and the build succeeded.

The new development profile supplied the decisive evidence: its entitlements now included `com.apple.developer.kernel.increased-memory-limit=true`. For this account and app, Xcode's managed signing flow had activated the capability without an interactive login.

We then regenerated the App Store profile. It contained the memory entitlement with `get-task-allow=false`. A subsequent capability query also returned the capability. Development signing and distribution permission were verified independently.

## Check the grant before uploading

A new entitlement now calls for comparing the app's request with the actual development and distribution profiles. A regenerated file is not sufficient evidence; the required grant must be present.

An API error should also stay within the scope of the request that produced it. Before concluding that another authentication or management path is blocked, check the tool's supported options and inspect what it generates.

The verified result here is a successful Release build and a distribution profile granting the memory entitlement. TestFlight upload and Apple's build processing remain separate checks.
