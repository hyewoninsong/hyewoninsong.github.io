---
title: "A process can be alive and still be doing nothing"
date: 2026-09-22
app: "daily-planner"
tags: ["devlog", "appstore"]
summary: "A TestFlight upload sat for 54 minutes with no error. The process was alive, the log was quiet — nothing said it had died. The actual evidence was in a different log file, in the fact that it held zero open network connections."
---

The build finished clean, the dSYM uploaded, and then nothing. The last line in the log said "this might take a few minutes" and stayed there — 10 minutes, 20, then 54. The process still answered when checked, and the log file hadn't grown a single line. No evidence of death, no evidence of work either. **Being alive and being busy turned out to be two different claims.**

## Every signal I checked was quiet

The actual upload isn't done by fastlane — it shells out to Apple's own `altool`. Fastlane's log had nothing past "starting the upload." Nothing in the process tree, nothing in any visible error output.

The tell was in a place I hadn't thought to check: how many open network connections that process currently held. Zero. A multi-megabyte file mid-transfer should hold at least one. Zero connections meant it wasn't transferring anything.

## The real log lived somewhere else entirely

Fastlane wraps `altool`'s output, but `altool` also keeps its own log file, separate from anything fastlane shows. That file had this:

```
ERROR: GET APP SETTINGS: received status code 502; bad gateway.
DEBUG: Retried server error too many times. Giving up.
DEBUG: Waiting for KPI items to be sent...
```

Apple's server returned a transient 502, `altool` exhausted its internal retries, and gave up — so far, expected. What wasn't expected: instead of raising an error and exiting, it parked itself inside an internal "waiting to send usage stats" step and never moved again. No timeout, no further retry, nothing. Fifty-four minutes later, that log file still had exactly the same last line.

## Making it notice and retry on its own

Once I'd seen it by hand, the rule was obvious: if the log goes quiet during the upload step for long enough, and the process is holding zero live connections, it isn't slow — it's dead. A watchdog now runs alongside every deploy checking exactly that pair of conditions. When both are true, it kills the process tree and the deploy script retries from the top.

The important part is what it does **not** retry. A signing failure, a compile error, a genuine rejection from Apple — none of those produce this signal, so they get reported immediately instead of retried blindly. The automatic retry is scoped to one very specific shape: dead process, zero connections, mid-upload.

## What's still open

The stall threshold is a flat five minutes. On a day Apple's servers are just slow for legitimate reasons, that might be too short; there could also be other kinds of silent hangs this particular check doesn't catch. For now it's deliberately narrow — built to catch the one pattern actually observed, on the theory that a watchdog that's too eager to kill a perfectly healthy upload is worse than one that misses a rare variant.
