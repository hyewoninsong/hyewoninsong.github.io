---
title: "Four places the app failed without telling anyone"
date: 2026-09-21
app: "daily-planner"
tags: ["devlog", "data", "swiftui"]
summary: "A failed save, a failed alarm, and a fallback that wipes the store and starts over — none of it was recorded anywhere. Adding crash and event reporting meant also stopping the simulator from inventing users."
---

The daily planner had no instrumentation at all. Crashes showed up as a number in App Store Connect, and the worse category — failures that aren't crashes — showed up nowhere. There were four of them, and in all four the screen looked fine.

## Four silent failures

| Place | What it did |
|---|---|
| Saving | `try? context.save()` — the edit you just made might never reach disk, and it stays on screen either way |
| Scheduling an alarm | an empty `catch` — permission denied or a system limit hit, and you still believe the alarm is set |
| Fetching | `try?` → empty array — no way to tell "no blocks that day" from "couldn't read" |
| Opening the store | deletes the store files and creates a fresh one |

That last row is the alarming one. If the schema won't open, the fallback wipes the store and reopens it empty — and to anyone who hits that path, the app simply looks brand new. There was no way to know how many people it happened to.

All four now file non-fatal reports. The app keeps running; the dashboard keeps the record.

## Counts, stages and error kinds — nothing else

One rule came first: **no todo titles, no notes, no profile names.** Events carry counts, stages and states, and times are rounded to the hour. "A 60-minute block was placed at 09" survives; "a dentist appointment at 09:15" does not.

Errors follow the same rule. `localizedDescription` drags file paths and user-written strings along with it, so what gets reported is the domain and code — `NSCocoaErrorDomain#134060`. A test proves it, by feeding in a description full of Korean text and checking none of it comes back out.

For the same reason, app code doesn't know Firebase exists. Exactly one file may `import Firebase`, and every event name and parameter comes from a single catalog. A test scans the sources to keep that boundary. Names built ad hoc at the call site are worse than they look: past 40 characters, or with the wrong characters in them, the SDK **drops the event silently**, and you only find out because a dashboard looks empty. Instrumentation added to kill silent failures shouldn't fail silently.

## One simulator launch is one new user

A simulator gets a fresh instance id on every install. Spin up dozens of simulator clones for App Store screenshots and you've **invented dozens of users**. There's no retroactive delete, so this had to be handled the same day.

The tempting axis is `#if DEBUG`, and it's the wrong one. The question isn't which configuration you built — it's whether a person is holding the device. A debug build on real hardware should keep reporting; it's the only chance to confirm the event schema arrives before shipping.

On the simulator the SDK isn't configured at all, rather than configured with collection turned off. Turning the flag off has two problems: SDK startup is async, so a first install writes `first_open` into the local database during the enabled→disabled window, and the setting is **sticky** — once `false` is persisted, nothing reopens it until code explicitly writes `true`. Not configuring leaves nothing behind and nothing stuck. Measured: a simulator launch without the override produced **zero** Firebase log lines.

But there has to be a way back in, because verification itself runs on a simulator. Without it, a perfectly healthy app is judged "not collecting" — and that misdiagnosis sends you off to edit config files. A test keeps the flag's spelling identical in the code and in the verification script.

## The config file tells you nothing

Another app paid for this lesson first. `GoogleService-Info.plist` had no `MEASUREMENT_ID` and `IS_ANALYTICS_ENABLED = false`, which read as "Analytics isn't linked." Neither key applies to iOS: the first belongs to web app config, the second predates the GA merge and the SDK never reads it. That misreading produced a duplicate console project and two re-downloads of the plist, both **byte-identical** to the committed file. One run with debug logging showed it had been working from the first commit.

So the verdict now belongs to a script: build, uninstall and install, start the log stream **before** launching (Firebase logs within 20ms of launch), cold launch, and check that the server answered 204. Keys in a config file are not evidence.

## Where it stands

Left to do: create the console project and commit the config file, add dSYM upload to the release lane, and fill in the App Store privacy questionnaire. The wrapper builds and runs without the config file and says so in the log, so nobody cloning the repo hits a wall.
