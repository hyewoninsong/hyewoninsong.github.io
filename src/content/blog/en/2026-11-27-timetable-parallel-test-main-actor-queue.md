---
title: "Parallel tests stalled the main thread for 55 seconds — no single test was holding it"
date: 2026-11-27T03:50:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "xcuitest"]
summary: "A stall that only showed up when the whole unit suite ran in parallel. Sampling the test host showed a queue on the main actor, fed by tests that were calling the real AlarmKit and writing to the real app group."
---

The timetable app has about 3,400 unit tests. Run one after another they finish in 73 seconds. Run in parallel, the main thread stalled for about 55 seconds and tests with time limits failed. The day before, the note said "couldn't find which test holds it." The answer turned out to be: none.

## Sample the process at the moment it stalls

The earlier suspect was an iCloud container lookup, because that had caused the same symptom once. This time we sampled the test host for 40 seconds with `sample` and ranked the app frames on the main thread.

iCloud did not appear. These did:

| On the main thread | Why |
|---|---|
| Alarm resync → AlarmKit authorization and alarm list | Thousands of test-made stores called the app's real alarm service on every save |
| Calendar save → expanding 14 weeks for the widget | 43 test sites built the store with default arguments, so every save wrote widget data to the real app group |
| A setup loop adding 500 events one at a time | 500 saves, each recomputing the whole calendar |

## It was a queue, not a culprit

Swift Testing runs tests concurrently in one process, but `@MainActor` tests share the single main thread. A few long ones make everyone else wait.

The log hides this. Hundreds of tests that take 0.01 seconds were reported at 30–55 seconds, because the reported time includes the wait. A test that asserts "done within 0.5 seconds" fails in that queue.

So the fix was to shorten the queue:

- In the unit-test host, the alarm service uses a backend that calls nothing. That is the only app-code change.
- Test calendar stores are built without the widget mirror; 62 sites that passed no calendar store at all now get a temporary folder.
- Bulk setup builds the model once instead of calling the store 500 times.

The serial run went from 73 to about 50 seconds. The longest wait in a parallel run dropped from 55–60 seconds to 31–52. The queue itself stays, since main-actor work across the suite adds up to tens of seconds. Serial is now the default for full runs: it is faster and steadier.

## Two other things that looked like a stall

A run with any failure took nearly ten more minutes to exit. `xcodebuild` collects simulator diagnostics after a failure, with a 600-second timeout. The tests were already done. `-collect-test-diagnostics never` turns it off.

One test failed only in parallel. Several tests swapped a global report handler by hand, and one test restoring it wiped another's collector. A shared, serialized helper already existed; three files were not using it.

## Splitting a 6,000-line file under source-reading tests

The same day we split a 6,600-line grid file. Many tests here read source files as text and assert that a string is present or absent. Move code to another file and the "present" assertions fail loudly. The "absent" ones keep passing, because they no longer look at the code that moved.

Rather than repointing each test, the tests now read the whole group that used to be one file. One table maps the original path to its pieces, and 75 test files read through it. Splitting further means adding a path to the table.

## Where it stands

Five parallel runs, five passes. New timing tests wait on a condition instead of a deadline. And the next time something stalls, the first step is a stack sample, not a guess.
