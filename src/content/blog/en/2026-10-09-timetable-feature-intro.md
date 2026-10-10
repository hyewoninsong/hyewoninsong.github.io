---
title: "We threw away the drawn mockup and recorded the real app for the first-run tour"
date: 2026-10-10T15:05:05+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "On first launch, a welcome page and then a phone-shaped mockup playing the real app show four things SuperTimetable can do. The drawn first version was dropped the same day; the next day the clips got a finger and the pages got swipe."
---

Open SuperTimetable for the first time and, before the empty timetable, you get a welcome page and a four-page tour. Inside a phone-shaped frame an event is created, moved, recolored, timetables are switched, and a line underneath says what is happening. What plays inside the frame is a recording of the real app. The first version was a drawing.

## Show what the app can do before asking anyone to try it

The old first run was an empty grid with a "start the tutorial?" card. The tutorial teaches by doing, but it never tells you that you can make your own colors, lay a timetable out by class period, or keep several timetables. So the order is now tour, then tutorial.

| Page | What it shows |
|---|---|
| Just Drag | Fill the empty school slots — drag one on Monday → duplicate → drag to the next day → resize, through Friday (changed 10-10, below) |
| Your Style | Pick an event, change its color, create a custom color, apply to matching events → undo brings every color back |
| By Period or by Time | A computer-science timetable with rooms, switched from periods to a time axis |
| Multiple Timetables | Swipe cards → title list → search → duplicate |

![Pages 1 and 2 — the real app moving a just-created event, and picking a color in the real style popover. A line under the mockup describes the current action; the x2 chip is the playback speed](/blog/timetable-feature-intro/pair-real-clips.png)

No Skip. Pages move with Back and Next and, since 10-10, by swiping. Headlines use the App Store cards' copy and markup — the bracketed keyword gets the same highlighter band in the same accent color — captions come from the preview video, and the backdrop is the store screenshots' 3D bars. The real app is slow to watch, so playback defaults to 2× with an x2 chip on the mockup that toggles to 1×; the rate lives in the player, so captions stay in sync. The caption line lost its step number: a new sentence rises from below while the old one leaves upward, and that motion already says "next step".

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

## 2026-10-10 — The clip froze after leaving the app and coming back

With the tour on screen, going Home and returning left the mockup on a frozen frame. The caption below froze too, because it follows the clip's playback time. Moving to the next page started things again, which made it look intermittent.

The clip loops with `AVQueuePlayer` and `AVPlayerLooper`. When the app goes to the background the system pauses a player attached to the screen — intended, and we had set the policy explicitly. What was missing was the other half. A pause is just the rate going to zero, and the system does not restore it on return. The looper, despite its name, does not restart anything: it queues the next copy when one ends, and a paused player never reaches the end.

The fix is a few lines. The view that owns the player listens for `didBecomeActive` and calls `play()` if the player is paused. Speed needs no extra handling because the x2/x1 toggle sets `defaultRate` along with `rate`, and `play()` uses it. With `rate` alone, the clip would have come back at 1x.

We measured it rather than eyeballing it: show the tour, go Home, return after three seconds, take screenshots 1.5 seconds apart, and compare the share of changed pixels inside the mockup.

| | Before leaving | After return, first gap | Second gap |
|---|---|---|---|
| Before the fix | 10.82% | 0.0% | 0.0% |
| After the fix | 10.82% | 0.29% | 0.55% |

Why it slipped through: the checklist covered "force quit and reopen", which always works because reopening builds a new player. Leaving and returning looks similar but keeps the old player alive. Anything that runs by itself on screen — video, timers, looping animation — now gets that path checked separately.

## 2026-10-10 — A welcome page in front, swipe enabled, and a finger inside the clips

The tour now opens on a welcome page: six store screenshots tilted into a collage that fades into the background, a one-line tagline, "Welcome to SuperTimetable", and one full-width Continue button. The reference was another app's onboarding, which also carries a "40 million users" banner; we have no such number, so there is none. The collage images come from a script that downscales the store captures — never hand-made.

![The welcome page — a collage of store captures above "Welcome to SuperTimetable" and Continue](/blog/timetable-feature-intro/welcome-collage.jpg)

Swiping between pages had been left out on purpose: a demo finger moving inside the mockup and the user's finger swiping the same surface seemed confusing. That worry went away once the finger moved **into the video** — it lives behind the mockup glass, the user's finger in front. So the pages are now a `TabView` pager; dots and buttons stay fixed below. Neighbouring pages keep a player parked on its first frame and only the visible page plays, so at most one HEVC decoder runs at a time instead of four.

The finger is the tutorial's: a ring fills while pressing, pops when the long press lands, a circle follows a drag, a ripple marks a tap. Two ways to get it into the clips: overlay it at playback from exported touch coordinates, or have the app draw it during recording so it is baked into the video. The overlay would have to match the clip scale and each language's recording timing, and any drift makes the finger press thin air. Baking it means the video is the whole story and other languages come out right automatically. One debug launch argument installs a window-level gesture recognizer that never recognizes plus a transparent layer drawing the finger at every real touch; sheets rise in the same window, so the layer is brought to the front each time it draws. XCUITest's synthesized touches take the same path.

![Page 1 — the finger dragging a duplicated school block to Tuesday, with the drag circle and time capsule](/blog/timetable-feature-intro/clip-finger-drag.png)

Page 1 tells a different story now. Instead of listing operations on a Saturday swim slot, it starts from a timetable whose school slots are empty, creates Monday's, duplicates it, drags the copy to Tuesday, resizes it, and fills the week. Same four operations, but with a goal. Delete, undo and redo left page 1; undo now closes page 2, where one tap returns all five schools from the custom color to the original.

## Three recordings passed, and Monday kept a stray block

Pulling frames from the re-recorded page 1 showed Tuesday to Friday correct and Monday wrong: a school starting at 09:30 was left over and the original was gone. Three recordings, three passes, same result.

The scenario taps a block to select it, duplicates it (the copy lands 30 minutes lower, selected), then long-presses the copy and drags it to the next day. A probe dumping each block's accessibility value after every step showed that the **original** was dragged, with the vertical movement lost, while the copy stayed. The drag preview shows the copy, so the video looks right. Grabbing the copy where it does not overlap turned into a resize of the original instead.

Starting the same flow with a long-press-and-release selection instead of a tap works. The tap leaves an "editing schedule" snapshot that duplication does not update, and the drag commits to that snapshot — a guard added so a drag survives losing its selection mid-way now writes to the wrong event once the selection has changed. It is a real user-facing bug; the recording works around it with long-press selection, and the fix (commit to the event grabbed at drag start) is separate. Two lessons: no automated flow had ever gone tap-select → duplicate → drag, and eyes are fooled by previews — one line of value dumps beat ten frames. One more: a five-hour copy dragged onto Friday was pushed up to 08:00 by the 13:00 event below it, so Friday is filled from Monday's four-hour block.

## History

- 2026-10-09 — Four-page first-run tour using real app recordings instead of drawn screens
- 2026-10-10 — Clip now resumes after leaving the app and returning
- 2026-10-10 — Welcome page, swipe paging, finger baked into clips, page 1 as "fill the school slots", undo moved to page 2; tap-select → duplicate → drag bug found
