---
title: "iPhone and iPad share a plan, with no sign-in screen"
date: 2026-09-23T13:20:00+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "data"]
summary: "Linking one person's devices without an account left exactly one option: CloudKit. The price was unique constraints, and breaking the schema rules turns sync off silently while the app keeps working."
---

Daily Planner has no accounts. No sign-up, no sign-in, everything stored on the device. But wanting the day you planned on your iPhone to show up on your iPad is about as ordinary a request as there is, and building a registration flow to answer it would have been absurd. Both devices now show the same plan, and the app gained no sign-in screen.

## Not building accounts

Without a login, there is effectively one way to link one person's devices: the **CloudKit private database**. It uses the Apple Account already signed in on the device, and the app never has to know anything about that account. SwiftData turns it on with one line of store configuration.

Why the alternatives lost is half the decision:

- **Our own backend with accounts** — that is not one screen, it is a second product. Sign-up, sign-in, password recovery, deletion, servers, bills. With no Android or web plans, all of that would buy exactly one thing.
- **JSON export and import** — cheapest to build, but manual and not live. Nobody is going to pass a file around at lunch to see what they changed at breakfast.
- **iCloud key-value store alone** — a 1MB ceiling is no place for related records. It did turn out to be the right home for settings.
- **Handoff** — that hands off a screen in progress, not stored data. Different problem.

## The price is three schema rules

Once the store mirrors to CloudKit, every model has to be expressible as a CloudKit record.

| Rule | Why |
|---|---|
| No `@Attribute(.unique)` | CloudKit has no concept of a unique constraint |
| Non-optional attributes need defaults | A record from another device can arrive missing a field this one doesn't know |
| **Every** relationship: optional, with an inverse | The two halves of a relationship can arrive separately |

(That third row originally said "to-one relationships." It was wrong, and it took two days to find out — see the bottom.)

The `@Attribute(.unique)` on all three models' `id` came off, and non-optional attributes like `title` and `startMinute` got defaults. UUIDs were already guaranteeing uniqueness, so nothing was actually lost. The schema moved to v3 and opens with a lightweight migration.

## Breaking a rule is silence, not a crash

This was the surprising part.

Break a rule and creating the store container **throws**. Catch that and reopen without CloudKit, and the app launches like nothing happened. The screens work, the data is there, and sync never attaches. To the user that reads as "it didn't show up on my iPad." To the developer it is one console line. It compiles, and every existing test stays green.

So the rules are pinned by a test instead of trusted to runtime. All three are visible on the `Schema` object without starting CloudKit at all — every attribute exposes `isUnique` and `defaultValue`, every relationship `isOptional` and `inverseName`.

One more trap underneath it: **a test that loops over an empty collection passes.** If the entity list came back empty, "no unique attributes" would be green. The loop is now preceded by an assertion that there are three entities, and to confirm the alarm actually rings, a `@Attribute(.unique)` went back in just long enough to watch the test go red. An alarm you have never heard go off is not an alarm.

## The code that deleted the store on failure

The original container code deleted the store files and started fresh whenever opening failed. With no users to migrate, that was a reasonable simplification.

With sync attached it means something else entirely: a missing entitlement, or a device signed out of iCloud, would **wipe the user's plans**. The open order is now iCloud, then local-only, and only then delete. Not syncing is bad; losing data is not in the same category.

## The same alarm, twice

When a block lives on two devices, both devices schedule its alarm. The same block rings on the iPhone and the iPad at once. The app could quietly pick a "primary" device, but then the silent one gives the user no way to understand why.

There is a switch in Settings instead. It defaults to on, so nothing changes for a one-device user, and turning it off also clears the alarms already scheduled on that device.

![Settings sheet: a Sync section showing read-only iCloud status, and an alarm section led by a "ring alarms on this device" switch](/blog/planner-icloud-sync/sync-and-alarm-settings.png)

Settings faced the same question one level down — does this value follow the person or the device? Time format and default block length follow the person. The profile you currently have open should follow the device: "Work" on the phone, "Study" on the iPad is a perfectly reasonable setup. So settings now live in two places, shared through iCloud or kept local.

## What's left

The code has shipped, but sync needs hands to finish: creating the iCloud container in the developer portal and **attaching it to the App ID** (creating and attaching are separate actions, and skipping the second one kills the release build at code signing — which happened six times afterwards), then running once on a real device and **deploying the schema to production** in the CloudKit console. Skip the second one and development builds sync while TestFlight builds quietly don't, on identical code. This feature is full of failure modes that make no noise at all.

## 2026-09-23 — sync had never attached, not once

The opening of this post says both devices now show the same plan. They didn't. The code shipped, the screens worked, the rules looked satisfied — and mirroring had never attached on any device since the day it was turned on.

The third row of the rules table was wrong. What CloudKit actually says when it refuses carries no "to-one" qualifier:

```
CloudKit integration requires that all relationships be optional, the following are not:
Profile: todos
Todo: blocks
```

`Profile.todos` and `Todo.blocks` are to-many, so they were left as `[Todo] = []`. Those two kept the container from opening, and the three-stage fallback described above caught it exactly as designed and fell back to a local-only store. The silence worked a little too well.

### A wrong rule makes the test that guards it wrong too

This post claimed the rules were pinned by a test rather than trusted to runtime. Here is what that test looked like:

```swift
#expect(relationship.isOptional || relationship.isToOneRelationship == false, …)
//                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ exempts to-many
```

The written rule said "to-one relationships," so the test exempted to-many. One wrong sentence got copied into both the code and the check meant to catch the code.

"An alarm you have never heard go off is not an alarm," this post said. This was worse than that. The alarm did ring — the fire was outside the area it watches. Hearing it ring does not find that. You have to ask separately what the alarm is not looking at.

### Why narrowing it down took a day

Designing for silence without also building the key to break it was the real mistake. The catch site read:

```swift
AppLog.error(.data, "cloudkit mirroring unavailable — opening local-only store")
```

The error object was taken and folded down to a domain and a code. Not one word of the reason reached the log, and `NSCocoaErrorDomain#134060` does not distinguish "the schema was rejected" from "the entitlement is missing." After checking entitlements, provisioning profiles and model constraints by hand, the next step was to ship a separate PR whose only job was to log the reason. It named the cause five seconds after landing on the device.

The reason now survives in two layers: the domain and code everywhere, the full text only in debug builds. Error descriptions can carry things like store file paths, so they never go into a release build's crash report.

### TestFlight could not have shown this

The bottom of this post said to run once on a real device and then deploy the schema to production. There is a hidden ordering inside that.

A distribution-signed build talks to CloudKit's **production** environment, and production never creates record types on its own. Running TestFlight builds while waiting for the development schema to fill in the console will wait forever — only a development-signed build creates the development schema, and only the console's deploy button creates the production one. If a device development build is blocked on provisioning, the Simulator is the way around it: it uses no profile, and CloudKit runs against the development environment there.

### After the fix

The two relationships became optional, with accessors on the models that fold the nil away so `?? []` doesn't scatter across ten call sites. The test's exemption is gone, and it now asserts there are four relationships before looping.

Changing optionality changes the Core Data version hash, which means a store that fails to open would reach the last stage of that fallback — the one that deletes user data. So rather than reason about it, the old build went onto a Simulator to create a store, and the new build was installed over it. The old build emits the error above; the new one opens with no error and no recreation, and the rows are still there. A lightweight migration covers it.

What remains is the line that was already there: run a development build once to create the development schema, then deploy it to production from the console.

## History

- 2026-09-21 — Linked two devices through CloudKit with no account, and pinned three schema rules with a test.
- 2026-09-23 — Found that one of those rules was wrong: to-many relationships must be optional too. Fixed the rule, the test, and the log that had swallowed the reason.
