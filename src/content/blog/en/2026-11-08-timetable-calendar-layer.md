---
title: "A calendar on top of the timetable — one base timetable per date, and only the differences for changed days"
date: 2026-11-08T18:39:39+09:00
app: "timetable"
tags: ["devlog", "data", "design"]
summary: "Semester timetable, exam week, and 'no class this Thursday' now live in one app. Timetables stay date-less weekly templates; a separate calendar decides which one applies on each date, and anything you change inside a day is stored as a diff against it."
---

A SuperTimetable timetable has always been "the same week, every week". Exam week in the middle of a semester, or a single cancelled Thursday, had no place in the app, so we added [export to calendar](/en/blog/2026-09-28-timetable-calendar-export/) and pointed people at Apple Calendar. They ended up switching between two apps. This release puts a calendar on top of the timetable so both views live in one place.

## The timetable stays; the calendar holds the dates

Timetables did not change. They are still weekly templates without dates. On top of them you can now create any number of **calendars**, and a calendar does exactly two things.

| What a calendar decides | How |
|---|---|
| One base timetable per date | A default timetable plus a list of rules: "weekly during this range" or "this date only". A date rule beats a range rule; between ranges, the one created later wins |
| Changes that belong to one date | Anything you move, resize, add or delete inside the calendar grid becomes an **exception for that date**. It never asks |

Opening a calendar shows a week grid with dates in the header, today's column highlighted, and the week's base timetable named under the title. Tap the name to open that timetable and edit it there. Edits to the base propagate to every date that uses it, except the dates that carry an exception.

![Calendar week grid: dates under the weekdays with each day's base timetable name, Thursday on a different timetable, and dashed outlines on the schedules changed or added for that date only](/blog/timetable-calendar-layer/calendar-week.png)

Exceptions are stored as a **diff**: hidden schedules, modified schedules, added schedules, and which base they were made against. Move Math from 9 to 10 in the base timetable and every ordinary day follows; the one day where you moved Math to another weekday stays as you left it. Changed blocks get a single rounded dashed outline. No fills, bands or badges, because schedule color already speaks through one dot.

Changing the base timetable for a date makes its hidden/modified entries meaningless. If any would disappear, the app asks first ("changes on 3 days, 5 in total, will be lost") and keeps the added schedules.

## Why this shape

Four alternatives lost.

- **A calendar as a copy of the timetable per date.** Simplest, but edits to the base never reach the copies; one exam week means editing the semester twice.
- **A date field on every schedule.** Every schedule format changes, and widgets, Android and the share file format follow.
- **A separate calendar grid.** Two copies of the gestures and the edit sheet. Instead, the existing grid got one seam, "where do I read from and where do I write to", so timetables and calendars share the same rendering, gestures, edit sheet and iPad shell.
- **Swiping the grid body to change weeks.** The body already belongs to block dragging and pinch. Weeks move by swiping the weekday header, the ‹ › buttons, or "Today".

One more: the first design had "long-press an exception block to revert it to the base". Long-press is already how you lift a block to drag it, so revert moved to the last row of the edit sheet and the iPad pointer menu.

Dates are stored as strings like `"2026-11-12"`, not `Date`; a `Date` shifts an exception by a day when you change time zones. Exceptions are grouped by month (`"2026-11"`). The whole file is still loaded at once, but a per-month split later becomes a file move. A performance test with five exceptions on every weekday for five years measures load, save and week resolution, so the numbers will speak before the design does.

## Alarms still follow the base only

In this phase, alarms are the base timetable's weekly alarms, untouched by calendar exceptions, with one line in the calendar saying so. Widgets, Siri and calendar export still know only timetables. No biweekly rules either, for the same reason biweekly alarms were removed earlier.

## The test was wrong, and the fix kept going to the developer

The work ran through a pipeline: design, five developers, review, QA, build, regression. It stalled twice in the same way. The QA runner correctly said, four times, "the product code is right, the **QA fixture** is wrong", but the orchestrator always sent failures to the owning developer, who was not allowed to touch that test file. Only the "same failure three times" guard brought a human in.

The fixture bug was one line: it turned off `NSUndoManager.groupsByEvent` and opened undo groups by hand, and one call registered undo outside a group, crashing the host with `must begin a group before registering undo`. The regression stage repeated the shape, this time with a bidi-isolate counter that ignored nesting depth, plus ten old source-contract tests pinned to lines this change had deliberately moved.

The fix was a third verdict for the runner: not pass or fail, but **test defect**. That verdict goes to the QA writer who owns the test, who fixes their group's tests and any orphaned contract tests, and reruns. The runner had been right from the start; nobody was listening on that channel.

## Taking the screenshot found one more bug

To get a picture for this post we seeded a calendar in the simulator, saved "last viewed = calendar", and launched. The app opened the base timetable instead. Every time, with the whole pipeline green.

The cause was the order inside the store's init. It restores the "last viewed timetable" key first and reads the "last viewed target" key second. But the first restore is a `@Published` property, so its `didSet` runs even inside init; that `didSet` sets the target to the timetable, and *that* `didSet` writes the target key back to disk. Only then does the second line read the key, and it reads the timetable it just wrote. The comment knew the order ("the timetable restore overwrites the target, so read after it"); it did not follow the overwrite all the way to disk.

Every launch-restore test in the pipeline started from an **already built** store and assigned values into it. The init path never ran, so the rule was right, the tests were green, and only the app was wrong.

Fixing that exposed a second layer: four relaunches, two right, two wrong. Even after launch restore switched the window to the calendar, the timetable grid that briefly appeared on the first frame still ran its `.task` and wrote "last viewed timetable". The screen showed the calendar; the saved value said timetable. Next launch timetable, the one after calendar. So: read every key before any assignment, keep a restored calendar as a launch snapshot, and let the grid write "last viewed" only while it is still the window's display target. Four relaunches since, four calendars. The regression test now builds a **fresh** store on the same file and defaults, and the runner rules say an "after relaunch" scenario is judged by relaunching the app.

## Where it stands

Android reads the calendars at the same save-file version and writes them back unchanged; its UI comes later. Real-device and TestFlight checks follow the PR review. Month view, per-date alarms and calendar widgets are phase 2.
