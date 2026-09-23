---
title: "A bug I fixed yesterday came back unchanged"
date: 2026-09-24
app: "superfont"
tags: ["devlog", "appstore"]
summary: "The deploy status showed another app's build as SuperFont's. That collision had been fixed the day before. The fix was in the repo, but the folder the deploy scripts actually run from was eight commits behind it."
---

I pushed a SuperFont test build to TestFlight. The upload succeeded and the build number went from 38 to 70. The status script still said "running", though, and the log it showed belonged to the timetable app. The completion summary printed an empty `v (build )`.

I had seen this exact symptom the day before, and fixed it. **A fix being in the repo and a fix actually running turned out to be two different claims.**

## What got mixed up

Every app deploys through the same set of scripts. While fastlane runs in the background, they write the process ID, log location, exit code and build-info location into a few small files under `/tmp`. The status script and the progress monitor read those files.

Those file names were the same for every app. When two apps deploy on one machine at the same time, the second one overwrites the first one's records. Nothing errors. One deploy just reads the other's state as its own.

- The status script read the timetable app's process ID. That process was still alive, so it reported "running".
- The monitor read the build-info location at the moment SuperFont finished. By then it pointed at the timetable app's file, which wasn't written yet, so the numbers came out empty.
- Only fastlane's own log was right: `v1.0.1 (38) → v1.0.1 (70)`.

## The fix was real, and it wasn't running

Yesterday's fix hashed the checkout path into each of those file names, so concurrent deploys from different folders can't collide. That commit was on the scripts repo's main branch.

The deploy scripts don't load from that branch, though. They load from a folder that links to one checkout of the repo. That checkout was parked on an old feature branch whose PR had already merged. Counting only the deploy scripts, it was eight commits behind main, and yesterday's fix was one of them. It had never run on this machine.

## What changed

- **A one-line check.** In the installed scripts folder, `git log --oneline HEAD..origin/main -- <scripts path>` should print nothing. Anything it prints is a fix that exists but isn't running. This time it printed eight lines.
- **When a number looks wrong, read the deploy's own log.** Use the log file the deploy script printed when it started, not whatever file is newest.
- **A warning on the last-resort path.** When the build-info location wasn't recorded, the scripts grab the newest matching file on the whole machine. That can still belong to another app, so they now say so when it happens.

## Tripping once more while cleaning up

I first thought this was a new bug and fixed it myself. Then I found an open PR for the same problem and ran `git checkout --` on four files to undo my version. That checkout is shared by several work sessions. The files also held another session's uncommitted changes, and those went with mine. I matched each file against the branches it came from and restored it. All of it turned out to be on main already, so nothing was lost. One look at `git diff` first would have made the whole search unnecessary.

## Where it stands

The installed checkout is still on the old branch. Moving it to main waits until the other session's uncommitted work there is sorted out. Until then, the check above runs before every deploy.
