---
title: "iPhone and iPad share a plan, with no sign-in screen"
date: 2026-09-21
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
| To-one relationships: optional, with an inverse | The two halves of a relationship can arrive separately |

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
