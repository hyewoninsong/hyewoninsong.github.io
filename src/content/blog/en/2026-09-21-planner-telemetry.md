---
title: "Four places the app failed without telling anyone"
date: 2026-09-21
app: "daily-planner"
tags: ["devlog", "data", "swiftui"]
summary: "A failed save, a failed alarm, and a fallback that wipes the store and starts over — none of it was recorded anywhere. Adding crash and event reporting meant stopping the simulator from inventing users, and then watching the verification fail a perfectly healthy app."
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

## Then the script failed a healthy app

With the config file in place, the script passed three checks and failed three. Configured, Crashlytics up, collection enabled — but "event logged", "server recognized this app" and "config parsed" all came back red.

The log had this line in it:

```
[I-ACS023008] To enable debug logging set the following application argument: -FIRAnalyticsDebugEnabled
```

All three missing lines are **debug level**. The argument was being passed and still wasn't taking effect: routed through `simctl`, it never reaches Analytics, with or without an explicit value. Meanwhile our own `-forceTelemetryOnSimulator` worked in the very same launch, because we scan the argument array directly and Analytics doesn't. **"My argument landed, so theirs must have" was the wrong inference.**

So the verdict moved. The SDK records what it actually did, on disk. The measurement plist inside the app container holds the last successful upload time, the last failed one, and the etag of the config the server sent; counting the pending queue table says how much is still waiting. It read:

```
last_successful_upload  1789967165.42
last_failed_upload      0
config_etag             15018060068621578958
queue                   0 rows
```

Uploads had been working the whole time. They just weren't in the log.

This is the same mistake as the config-file misreading earlier in this post, committed one layer down. **"Absent from the log" is not "didn't happen" — the log level may be off.** When you're unsure whether instrumentation is wired up, read the state the system persisted, not its chatter. The script and the skill behind it both changed.

One thing became visible along the way: across three uninstall-reinstall cycles on the same simulator, the instance id came out `889148C0…`, `4D7ECF71…`, `F256E21A…`. To Firebase those are three different people — which is the whole argument for keeping simulators out.

## Where it stands

Left to do: add dSYM upload to the release lane, force one crash on a real device to clear the console's onboarding screen, and fill in the App Store privacy questionnaire. The wrapper builds and runs without the config file and says so in the log, so nobody cloning the repo hits a wall.
