---
title: "We threw away the drawn mockup and recorded the real app for the first-run tour"
date: 2026-10-10T02:40:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "On first launch, a phone-shaped mockup now plays the real app demonstrating four things SuperTimetable can do. The hand-drawn first version was dropped the same day — it showed screens the app doesn't have."
---

Open SuperTimetable for the first time and, before the empty timetable, you get a four-page tour. Inside a phone-shaped frame an event is created, moved, recolored, timetables are switched, and a line underneath says what is happening. What plays inside the frame is a recording of the real app. The first version was a drawing.

## Show what the app can do before asking anyone to try it

The old first run was an empty grid with a "start the tutorial?" card. The tutorial teaches by doing, but it never tells you that you can make your own colors, lay a timetable out by class period, or keep several timetables. So the order is now tour, then tutorial.

| Page | What it shows |
|---|---|
| Just Drag | Drag on empty time → move → resize → duplicate → delete → undo → redo |
| Your Style | Pick an event, change its color, create a custom color, apply to matching events |
| By Period or by Time | A computer-science timetable with rooms, switched from periods to a time axis |
| Multiple Timetables | Swipe cards → title list → search → duplicate |

![Pages 1 and 2 — the real app moving a just-created event, and picking a color in the real style popover. A line under the mockup describes the current action; the x2 chip is the playback speed](/blog/timetable-feature-intro/pair-real-clips.png)

Two buttons, Back and Next, no Skip. Headlines use the App Store cards' copy and markup — the bracketed keyword gets the same highlighter band in the same accent color — captions come from the preview video, and the backdrop is the store screenshots' 3D bars. The real app is slow to watch, so playback defaults to 2× with an x2 chip on the mockup that toggles to 1×; the rate lives in the player, so captions stay in sync. The caption line lost its step number: a new sentence rises from below while the old one leaves upward, and that motion already says "next step".

## The drawn version did not survive the day

The first build drew everything: a 320×640 phone coordinate space with headers, blocks, buttons, a color panel and list cards placed by hand, animated from one clock and keyframes. Bundling video had been ruled out on the assumption that eight languages times four pages would bloat the app.

The reaction was "it shows screens that don't exist". True. The segmented toggle for choosing the axis is not how the app looks, the five dots and plus button were not the real popover, and the mini grid was an approximation down to the corner radius. A tour that shows an app different from the one on the next screen is a lie, and the lie grows with every change.

So it was all removed and replaced with recordings. The XCUITest that records the store preview got one more scenario: it performs the four scenes on fixture data and prints a timestamp before each action. A script cuts the recording at those marks into one clip per page plus a "from this second, show this caption" list. The app loops the clip and advances the caption from playback time. When the app changes, record again — one command for all eight languages.

![Pages 3 and 4 — a computer-science timetable laid out by period with room numbers, and searching the timetable list by name](/blog/timetable-feature-intro/pair-real-kinds-list.png)

The size worry was wrong. UI recordings with mostly static frames compress to almost nothing in HEVC: about 2 MB per language, around 15 MB for all eight.

## The recording passed three times and was wrong three times

First, the test tapped the just-resized block "to select it". It was already selected, so the tap opened the edit sheet, and duplicate, delete, undo and the axis switch all happened behind it. The button coordinates were still valid, so nothing failed.

Second, the simulator recorder only writes a frame when the screen changes, so a dismissed sheet's edge lingers until the next change. The fix was to nudge the grid by 2 pt — on top of a block, which read as a tap and opened the edit sheet again. Now the nudge is a 30 pt drag on the time axis.

Third, cutting a sparse-frame video with ffmpeg's input-side `-ss` starts at the first frame after the mark, dropping the still frame before the action and shifting every clip 1–2 s early. Filling frames with the `fps` filter before `trim` fixed it.

All three were found by pulling frames from the video, not from test results. A passing recording test means the actions ran, not that they were visible. The opposite happened too: asking `isHittable` on the third card in the list threw "activation point invalid" because pager cards exist off-screen before they are visible. Check existence and frame instead.

## Where it stands

The tour appears automatically only on a fresh install. For now there is also a "Replay Feature Tour" row in the menu, behind a build flag. The clips are light mode only, so in dark mode the mockup still shows a light app — it is a video.

Only the Korean clips ship first. Checking them on a real device before recording the other seven languages saves re-recording; until then, other languages get their own headlines and captions over the Korean app footage. The earlier foreign-language clips from the old three-page scenario were removed rather than left in: a clip that disagrees with its captions plays without any warning, so none is better than wrong.
