---
title: "Four places the app failed without telling anyone"
date: 2026-09-23T19:30:00+09:00
app: "daily-planner"
tags: ["devlog", "data", "swiftui"]
summary: "A failed save, a failed alarm, and a fallback that wipes the store and starts over — none of it was recorded anywhere. Adding crash and event reporting meant stopping the simulator from inventing users, watching the verification fail a perfectly healthy app, and learning that without symbols a crash report is a column of addresses."
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

## Without symbols, a crash report is a column of addresses

Instrumentation is wasted if the last piece is missing. A release build is optimized and stripped, so when it dies all that's left is memory addresses:

```
0   todo    0x0000000102a4c1f8  0x102a40000 + 49656
1   todo    0x0000000102a3b904  0x102a30000 + 47876
```

The table that turns those back into function names and line numbers is the dSYM. It's produced per build and matches exactly one, so the moment the build number ticks, the old one is useless. It has to go up where it was made — in the release lane, right after the build and before the store upload.

A failed symbol upload doesn't fail the deploy. Symbols can be re-uploaded; a build has to be rebuilt.

### Three things blocked it

**One: the deploy tool can't find the upload tool.** fastlane's symbol-upload action looks where CocoaPods would have installed it. This project uses Swift Package Manager, so that path is empty. The binary lives inside the package checkout, which lives in the build cache, which a disk cleanup deletes wholesale. Assuming it's there means one day symbols quietly stop going up. So it's resolved in three steps: a copy kept in the repo, then the newest build cache for this app, and failing that, resolve the packages fresh — without building.

**Two: plain code inside a lane doesn't run from the project root.** Arguments handed to the deploy tool are resolved against the root; code that checks whether a file exists is not — it runs from the script folder. The evidence was already in the file: an existing line reached up one level with `../Project.xcodeproj`. I missed it, used a relative path, and found out when the manual upload command died with "file not found." Now a helper computes the root explicitly and everything is built from it.

**Three: fetching dSYMs back from the store usually returns nothing.** App Store Connect only serves them for builds Apple recompiled. For a modern upload the list is empty — which is normal, and treating it as a failure stops the deploy. It now says "nothing to fetch, upload a local dSYM" and exits.

There's also a way to check the wiring without waiting for a deploy: a command that takes any dSYM by path and uploads it. Two seconds, and you know it works.

### Backfilling the builds already out there

Automation only covers builds from here on, so the last build's dSYM went up by hand for all three apps — the daily planner, the timetable app, the font manager — so crashes arriving right now are readable. The timetable app's widget extension symbols went up with it.

## Where it stands

Left to do: force one crash on a real device to clear the console's onboarding screen, and fill in the App Store privacy questionnaire. The wrapper builds and runs without the config file and says so in the log, so nobody cloning the repo hits a wall.

## 2026-09-22 — Nothing in the app said what it collects

Before filling in that privacy questionnaire, something else turned up: the app bundle had **no privacy manifest at all.**

That file lists what data the app collects and why it uses the APIs Apple requires a stated reason for. Leaving it out does nothing visible — it isn't compiled, nothing references it, so the build passes, the tests pass, and the store upload goes through. It surfaces much later, as a warning or an audit. Same shape as the two mistakes above: **a silent gap is found by opening the artifact, not by reading logs.**

So I opened it and counted. The built app contained seventeen manifests — Crashlytics, Installations, the Google utility bundles, the transport layer — each SDK declaring its own share. **The two analytics binaries had none.** The frameworks that actually gather and send the events ship without one.

That splits the result in an odd way. Crash collection is declared by Crashlytics' own file; **event collection is declared nowhere**. The app's own manifest is the only place it can be.

## Not declaring everything just to be safe

The tempting move is to list crash data and diagnostics too, since you're editing the file anyway.

It isn't safer. It creates a second source of truth for the same fact. When the SDK later revises its declaration, ours stays put, the two disagree, and that disagreement spreads to the App Store privacy labels and the privacy policy — with nobody able to say which one is true. So the rule is: **declare only what no SDK already declares.**

That leaves three things. No tracking (no advertising identifier, so no tracking domains either); product interaction plus the app instance id that rides along with it, collected for analytics; and `UserDefaults` with reason code `CA92.1` — the app reading and writing its own settings, nobody else's.

## Keeping it from happening again

Adding the file isn't enough on its own. A test now reads the manifest out of the bundle, checks that it actually shipped, checks that the "no tracking" claim doesn't contradict the collected types, and then **scans the app source**: if the code starts using a required-reason API — file timestamps, disk space, boot time, active keyboards, `UserDefaults` — and the manifest has no line for it, the test fails right there.

One recurring chore remains: recount after every dependency bump. An SDK that starts shipping a manifest makes our entry a duplicate; one that stops makes ours the only one. Either way, opening the app and counting takes two seconds.

## 2026-09-22 — Fully instrumented, and still unable to answer the question

Home screen widgets shipped, and the obvious question followed: **is anyone using them?** There was no data to answer with. Tapping a widget opened the app, the deep link quietly moved the date, and nothing was recorded. The instrumentation was all there; it just had nothing to say about the feature built last.

Linking the reporting SDK into the extension looks like the fix, and it fails in three places. A widget process **lives for a few seconds** — events are batched before upload, so most of them die with the process. It breaks the rule that exactly one file knows about Firebase. And linking an SDK means the widget now needs **its own privacy manifest**, which is one more copy of the thing the section above just finished consolidating.

So the app reports on the widget's behalf, and asks two separate questions:

| Question | Answered when |
|---|---|
| Is it **on the home screen** | The app comes to the foreground and counts installed widgets |
| Is it **being tapped** | A deep link opens the app |

These are different problems. Installed but never tapped means the widget shows the wrong thing; never installed means nobody knows it exists. Collapse them into one number and you can never tell which.

Counting has a trap worth closing up front: the identifier used to count installed widgets has to match the one the widget registers itself with, character for character. Keep a second copy in the app and the day someone renames a widget, the count silently becomes zero — and zero reads as "nobody uses it." That string now lives in one file both targets compile.

## Declaring a field and actually filling it are different jobs

While reviewing the crash context, one key turned out to be **defined and never written**: how many blocks are on the day currently on screen. Name and comment both present, no code setting it. Every crash report ever filed had that line blank.

Nothing catches this. An unused enum case isn't even a warning. Filling it in, three more went alongside: how many days from today the visible date is, how many blocks were linked together, how many widgets are installed. Opening a timeline crash should tell you *which day, how many blocks, how many linked* before you start trying to reproduce.

Two breadcrumbs joined them: which kind of drag just started (move, resize, group, create), and memory warnings. The second matters most — an app killed for memory pressure **files no crash report at all**. The memory warning logged just before it is the only trace left.

## The line that assigned error codes was quietly wrong

Non-fatal errors get a number each so the dashboard can separate them. The number came from a position in a list:

```swift
(list.firstIndex(of: self) ?? 0) + 1
```

Anything missing from that list falls through to `?? 0` and becomes **1** — already taken by "save failed." Add a new error kind, forget the list entry, and it merges into an unrelated error on the dashboard. Worse than looking broken: it looks like save failures went up.

Adding three new kinds this session (a default-alarm setting that won't decode, an alarm sound preview that won't open, and a custom color list that won't decode — that last one **loses the colors permanently, because the next save overwrites with an empty list**) nearly walked straight into it. The enum is now iterable and a test checks that **every** kind has a distinct code, failing on the spot when one is missing from the list.

The lesson from earlier in this post repeats one layer down: the instrument built to catch silent failures can fail silently too, and the only thing that stops it is a check that walks the whole set.

## 2026-09-23 — Every event arrived, and none of it could become a table

Two days after switching collection on, I went to register parameters as custom dimensions so the console could show which rescheduling tool people actually use. The catalog turned out to be unreadable there. GA4 registers a dimension by **parameter name alone** — it does not know which event sent it — and this app had `count` meaning four different things: todos archived, todos deleted, blocks moved, alarms fired. Registered, that is one column holding the sum of four distributions, and nothing splits it back apart. Every such key got a context prefix (`archived_count`, `deleted_count`, `reschedule_count`, `fired_count`); a key is shared between events only when the meaning is identical, and a test holds the list of those with the reason for each.

## A flag sent as 0 or 1 cannot be sliced

The type problem showed up later than the naming one. Booleans were going out as integers, and the console records an integer as a *numeric* parameter: registrable as a metric you sum, not as a text dimension you break a report by. `completed`, `archived` and `tutorial_done` were all in that state, and DebugView shows them perfectly. The rule is now one line — **anything you slice by is a string, anything you add up is an integer** — with flags as `"true"`/`"false"`, hours as `"09"` so they sort, and a suffix convention (`_count`, `_min`, `_offset` are integers, everything else is text) that a test applies to the whole catalog. One key that did two jobs (`minutes` meant a shift amount on push and a keep-gaps 0/1 on reflow) was split rather than renamed.

## The thing worth counting was not being counted

Reading the catalog end to end also showed what was missing. For a planner the questions are: do people plan the day itself or ahead of time — placements and check-offs now carry a `past`/`today`/`tomorrow`/`this_week`/`later` bucket; of yesterday's plan, how much got checked — the launch event now sends yesterday's block count and done count together, the one ratio that says whether the app moves a day at all; and which route people take to change the date — week strip, swipe, month grid, today button, drawer, widget. The date-navigation function now takes the route as an argument with no default, because a default nobody overrides is a dimension with one value. One user property (tutorial done) had been declared and never written — the same lesson as two days ago, a layer down.

The registration spec (33 dimensions, 25 metrics) lives in the repo as a file, and a change that sends a new key edits that file too. Old names were not registered as legacy: two days of TestFlight data, and `count` would be unreadable even if it were.

## History

- 2026-09-21 — Added crash and event reporting, kept the simulator out of the numbers, wired dSYM upload into the release lane
- 2026-09-22 — Filled the missing privacy manifest and settled on declaring only what the SDKs leave unsaid
- 2026-09-22 — Moved widget metrics into the app, filled the crash context fields that were never written, and closed the error-code collision with a test
- 2026-09-23 — Renamed and retyped parameters for the console (prefixes, flags as strings) and started counting same-day vs. ahead planning, plan vs. done, and date-navigation routes
