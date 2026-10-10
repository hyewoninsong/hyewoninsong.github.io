---
title: "We threw away the drawn mockup and recorded the real app for the first-run tour"
date: 2026-10-11T03:21:48+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "On first launch, a welcome page and then a phone-shaped mockup playing the real app show four things SuperTimetable can do. The drawn first version was dropped the same day; the next day the clips got a finger and the pages got swipe."
---

Open SuperTimetable for the first time and, before the empty timetable, you get a welcome page, one tour clip that runs through four chapters, and an ending page. Inside a phone-shaped frame an event is created, moved, recolored, timetables are switched, and a line underneath says what is happening. What plays inside the frame is a recording of the real app. The first version was a drawing.

## Show what the app can do before asking anyone to try it

The old first run was an empty grid with a "start the tutorial?" card. The tutorial teaches by doing, but it never tells you that you can make your own colors, lay a timetable out by class period, or keep several timetables. So the order is now tour, then tutorial.

| Page | What it shows |
|---|---|
| Just Drag | Fill the empty school slots — drag one on Monday → duplicate → drag to the next day → resize, through Friday (changed 10-10, below) |
| Your Style | Pick an event, change its color, create a custom color, apply to matching events → undo brings every color back → redo (added 10-10 evening) |
| Multiple Timetables | Swipe cards → switch to the title list and search → open the computer-science timetable (moved ahead of the period chapter on 10-10, below) |
| By Period or by Time | The computer-science timetable with rooms → switched to a time axis → back in the list, reopen the first timetable: a finished week |

![Pages 1 and 2 — the real app moving a just-created event, and picking a color in the real style popover. A line under the mockup describes the current action; the x2 chip is the playback speed](/blog/timetable-feature-intro/pair-real-clips.png)

No Skip. Chapters advance on their own with the clip, and Back, Next and swiping (since 10-10) jump between them. Headlines use the App Store cards' copy and markup — the bracketed keyword gets the same highlighter band in the same accent color — captions come from the preview video, and the backdrop is the store screenshots' 3D bars. The real app is slow to watch, so playback defaults to 2× with an x2 chip on the mockup that toggles to 1×; the rate lives in the player, so captions stay in sync. The caption line lost its step number: a new sentence rises from below while the old one leaves upward, and that motion already says "next step".

## The drawn version did not survive the day

The first build drew everything: a 320×640 phone coordinate space with headers, blocks, buttons, a color panel and list cards placed by hand, animated from one clock and keyframes. Bundling video had been ruled out on the assumption that eight languages times four pages would bloat the app.

The reaction was "it shows screens that don't exist". True. The segmented toggle for choosing the axis is not how the app looks, the five dots and plus button were not the real popover, and the mini grid was an approximation down to the corner radius. A tour that shows an app different from the one on the next screen is a lie, and the lie grows with every change.

So it was all removed and replaced with recordings. The XCUITest that records the store preview got one more scenario: it performs the four scenes on fixture data and prints a timestamp before each action. A script cuts the recording at those marks into one clip per page plus a "from this second, show this caption" list. The app plays the clip and advances the caption from playback time (at first one looping clip per page; since the evening of 10-10 one clip, played once — below). When the app changes, record again — one command for all eight languages.

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

At the time the clip looped with `AVQueuePlayer` and `AVPlayerLooper` (replaced that evening by a single `AVPlayer` playing once, below; the resume fix stays). When the app goes to the background the system pauses a player attached to the screen — intended, and we had set the policy explicitly. What was missing was the other half. A pause is just the rate going to zero, and the system does not restore it on return. The looper, despite its name, does not restart anything: it queues the next copy when one ends, and a paused player never reaches the end.

The fix is a few lines. The view that owns the player listens for `didBecomeActive` and calls `play()` if the player is paused. Speed needs no extra handling because the x2/x1 toggle sets `defaultRate` along with `rate`, and `play()` uses it. With `rate` alone, the clip would have come back at 1x.

We measured it rather than eyeballing it: show the tour, go Home, return after three seconds, take screenshots 1.5 seconds apart, and compare the share of changed pixels inside the mockup.

| | Before leaving | After return, first gap | Second gap |
|---|---|---|---|
| Before the fix | 10.82% | 0.0% | 0.0% |
| After the fix | 10.82% | 0.29% | 0.55% |

Why it slipped through: the checklist covered "force quit and reopen", which always works because reopening builds a new player. Leaving and returning looks similar but keeps the old player alive. Anything that runs by itself on screen — video, timers, looping animation — now gets that path checked separately.

## 2026-10-10 — A welcome page in front, swipe enabled, and a finger inside the clips

The tour now opens on a welcome page: app captures tilted into a collage that fades into the background (six at first, a fan of three the next day, then a tilted grid of nine that evening — below), a one-line tagline, "Welcome to SuperTimetable", and one full-width Continue button. The reference was another app's onboarding, which also carries a "40 million users" banner; we have no such number, so there is none. The collage images come from a script that downscales the store captures — never hand-made.

![The welcome page — a collage of store captures above "Welcome to SuperTimetable" and Continue](/blog/timetable-feature-intro/welcome-collage.jpg)

Swiping between pages had been left out on purpose: a demo finger moving inside the mockup and the user's finger swiping the same surface seemed confusing. That worry went away once the finger moved **into the video** — it lives behind the mockup glass, the user's finger in front. So the pages became a `TabView` pager, with dots and buttons fixed below. That pager was removed again the same evening (below): the phone sliding out while an identical phone slides in was exactly the "broken flow" we were asked to fix. Swiping stayed, and now jumps to a chapter start.

The finger is the tutorial's (that day it only appeared during touches; the next day it became permanent — below): a ring fills while pressing, pops when the long press lands, a circle follows a drag, a ripple marks a tap. Two ways to get it into the clips: overlay it at playback from exported touch coordinates, or have the app draw it during recording so it is baked into the video. The overlay would have to match the clip scale and each language's recording timing, and any drift makes the finger press thin air. Baking it means the video is the whole story and other languages come out right automatically. One debug launch argument installs a window-level gesture recognizer that never recognizes plus a transparent layer drawing the finger at every real touch; sheets rise in the same window, so the layer is brought to the front each time it draws. XCUITest's synthesized touches take the same path.

![Page 1 — the finger dragging a duplicated school block to Tuesday, with the drag circle and time capsule](/blog/timetable-feature-intro/clip-finger-drag.png)

Page 1 tells a different story now. Instead of listing operations on a Saturday swim slot, it starts from a timetable whose school slots are empty, creates Monday's, duplicates it, drags the copy to Tuesday, resizes it, and fills the week. Same four operations, but with a goal. Delete, undo and redo left page 1; undo now closes page 2, where one tap returns all five schools from the custom color to the original.

## Three recordings passed, and Monday kept a stray block

Pulling frames from the re-recorded page 1 showed Tuesday to Friday correct and Monday wrong: a school starting at 09:30 was left over and the original was gone. Three recordings, three passes, same result.

The scenario taps a block to select it, duplicates it (the copy lands 30 minutes lower, selected), then long-presses the copy and drags it to the next day. A probe dumping each block's accessibility value after every step showed that the **original** was dragged, with the vertical movement lost, while the copy stayed. The drag preview shows the copy, so the video looks right. Grabbing the copy where it does not overlap turned into a resize of the original instead.

Starting the same flow with a long-press-and-release selection instead of a tap works. The tap leaves an "editing schedule" snapshot that duplication does not update, and the drag commits to that snapshot — a guard added so a drag survives losing its selection mid-way now writes to the wrong event once the selection has changed. It is a real user-facing bug; the recording works around it with long-press selection, and the fix (commit to the event grabbed at drag start) is separate. Two lessons: no automated flow had ever gone tap-select → duplicate → drag, and eyes are fooled by previews — one line of value dumps beat ten frames. One more: a five-hour copy dragged onto Friday was pushed up to 08:00 by the 13:00 event below it, so Friday is filled from Monday's four-hour block.

## 2026-10-10 — Four pages became one story with an ending

The evening's verdict was "it feels random". Each page looped its own clip in place, swiping slid the phone out while an identical phone slid in, and after the last page there was nothing but a Start button. Three asks: no broken flow, one story that ends, and an ending page to match the welcome page.

The tour is now one clip, played once from start to finish, and the four chapters are time ranges inside it. Crossing a chapter boundary leaves the phone where it is; only the headline above and the caption below change. The current chapter's dot fills with playback progress, so the hand-off is announced. When the clip reaches its end the ending page arrives by itself: the last frame stays in the phone, and the text changes to "Siwoo's week is complete / Now it's your turn", with Back and Start below. No new artwork was needed — the end of the clip is the ending picture (the next day that phone got a tilt and an app icon in front — below).

![Just after the automatic hand-off to chapter two — the phone still shows the timetable chapter one filled, only the headline and caption changed, and the third dot is filling with progress](/blog/timetable-feature-intro/chapter-auto-advance.png)

That needed a new order. The list chapter moved ahead of the period chapter: fill Siwoo's timetable, color it, open the list, swipe cards, search by name and open the computer-science timetable, show the period axis and switch it to time, then return to the list and reopen Siwoo. The story starts on an empty week and ends on a finished one, and the list is the bridge between the two timetables. Redo now follows undo at the end of the style chapter so the finished week keeps its new color; duplicating a timetable and the list-style toggle as scenes of their own were cut. The repeated Thursday and Friday duplicate-and-move is compressed 4× between two recording marks — the viewer's rhythm is one action per caption, and repetition should fly by. The whole thing ran a little over a minute at 2×; trimming idle gaps the next day brought it to 52 seconds (below).

![The ending page — the finished week stays in the phone, only the text changed to "Now it's your turn"; no speed chip, Back and Start](/blog/timetable-feature-intro/ending-finished-week.png)

Two alternatives lost. Keeping one clip per page and auto-advancing at the end still shows two phones while the pager slides, even with the last frame of one matching the first of the next. Looping with the end stitched to the start has no sense of progress and no end. One clip means one player, one decoder, one file, and a chapter jump is one `seek`. The cost is that a chapter you went back to keeps going forward when it ends — intended; the story only moves forward.

The probe caught one thing. Pressing Next in the last chapter landed on the ending page with the computer-science timetable still showing instead of the finished week. The jump sought to the clip's exact duration, where there is no frame, so `AVPlayerLayer` kept the old picture. Reaching the end naturally was fine because the last frame had already been drawn; only the manual jump was wrong. The end is now 0.1 s before the duration, a unit test checks that an end seek stops short of it, and the probe keeps screenshots of all four ways to reach the ending. One more: right after a seek the periodic observer delivers one sample from before the jump, which flashed the old caption back, so samples are dropped until one arrives near the target.

The clip is still Korean only; the other seven languages get their own headlines and captions over the Korean footage.

## 2026-10-11 — Idle gaps cut, seconds remaining shown, and an ending with some weight

Four notes came back on the one-clip tour. The waits between actions are too long. Show how much is left in each step. The ending should land like the opening does — one phone in the middle is flat, maybe put the app icon in. And the welcome collage is cluttered, too many tilted images.

The waits first. Shortening the recording test's `pause` calls looked like the fix, but measuring showed most of the dead time was XCUITest itself: every element query, tap and round trip costs half a second to a second, and that stays even with every pause at zero. So the cutting script uses the recorder's own quirk instead. The simulator recorder only writes a frame when the screen changes, which means the gaps between frames in the raw video are exactly the moments where nothing happened. The script reads frame timestamps with `ffprobe` and, for any gap over one second, keeps the first second and drops the rest. The dropped frames are identical to the kept one, so there is no seam. Re-cutting the same raw removed 52 seconds across 39 gaps: 153 seconds became 103, which is 52 at 2×. Nothing was re-recorded. The cap is one second because at 2× that is half a second, enough for the headline crossfade (0.42 s) to finish before the next finger moves.

Time remaining is a single number beside the page dots: "15s" next to the filling dot, counting down each second. It is the clip time left in the chapter divided by the playback rate, so switching to 1× doubles it. A sentence like "next in 15s" has a different width in each of eight languages and crowds the dot row; a number beside a filling dot reads without explanation, and VoiceOver gets the sentence. The first attempt overlaid the number on the dot row with an alignment guide, and the simulator screenshot showed it sitting on top of the last two dots. It is now a symmetric row — the same label hidden on the left, visible on the right — so the dots stay centred.

![The style chapter — "15s" beside the page dots, counting down as the third dot fills](/blog/timetable-feature-intro/chapter-auto-advance.png)

The ending keeps its rule that the last frame is the picture, and builds on it: as the ending page arrives the phone shrinks to 0.84 and tilts six degrees, and the app icon tile pops out of its lower-right corner and overlaps it. The finished timetable sits like a finished thing with the app in front of it. The icon is not a bitmap — the new icon format cannot be loaded with `UIImage(named:)` — but the thank-you card already drew the seven bars as a view, so that view moved to a shared file.

![The ending page — the phone with the finished week tilted, the app icon overlapping its corner](/blog/timetable-feature-intro/ending-phone-icon.png)

The welcome page lost weight. Six screenshots at six angles with colour chips between them became a fan of three (replaced again that evening by a tilted grid — below): the grid in front, upright; style and list behind it, nine degrees each way. Front, back, left, right — nothing else for the eye to chase. The first version hid the side cards almost entirely behind the centre one; a screenshot showed it, and the sides moved out.

![The welcome page — three store captures fanned behind the headline](/blog/timetable-feature-intro/welcome-three-cards.jpg)

When the pacing feels slow now, the first thing to read is the script's "N idle gaps, M seconds dropped" line, before re-recording. Slowness the cap cannot catch is the action itself — a slow drag, typing — and that is when the test changes.

## 2026-10-11 evening — Two real timetables, a tilted grid, and a finger that never leaves

Three more changes the same evening. First, data. The computer-science timetable the period chapter opened was made up for the fixture; the user sent two of their own files instead: Hyewon (music school, 8 periods) and Insong (computer science, 12 periods), both period-based with 75-minute classes that end on half-period lines. They went into the capture fixture as-is. Hyewon replaced the fake Hyewon in the third slot; Insong was appended at the end, because the third slot is what the widget capture picks by number. The tour fixture now holds only the unfinished Siwoo, and the period chapter opens Insong. The search term is "Insong" — a person's name never matches a course title.

Second, the welcome page. The morning's fan of three became, that evening, what the user had pointed at in another app's onboarding: nine captures in a three-column grid, the whole grid tilted nine degrees, columns staggered so the cards flow diagonally from top to bottom. Four timetables, the style popover, the custom-colour editor, the list, batch edit, a dark grid. Two conditions: no status bar or Dynamic Island in the captures, and clean white borders. So the store captures lose their top 62 pt and bottom 34 pt and keep only app content, and each card gets a 3 pt white border that stands in for the phone outline. No widget images — widgets only ever appear as real home-screen captures, and the welcome page has no reason to show one. One stumble: `sips` pads with black when the crop window leaves the image, so the first build had black blocks under every card. `ffmpeg`'s `crop` replaced it.

![The welcome page — nine app captures in a tilted grid flowing diagonally, content only, white borders](/blog/timetable-feature-intro/welcome-tilted-grid.jpg)

Third, the finger. "Sometimes it's there, sometimes it isn't" was accurate: it appeared on touch-down and faded 0.3 s after release. Now it is always there. Before the first touch it rests near the lower middle of the screen; when a touch comes it glides from where it was to the touch point in 0.22 s, and only then does the ring fill or the ripple spread. On release it lifts slightly and stays, and the next touch starts from there. Only the effects change with context: ring for a long press, circle for a drag, ripple for a tap.

That uncovered one more thing. Frames from the re-recorded clip showed no finger while colours were being tapped inside the style popover. Both the finger layer and the touch-spying recognizer were attached to the app window, and sheets and popovers are presented in a **different window**: touches there never reached the recognizer, and the layer sat underneath. When the finger disappeared between touches anyway, nobody noticed. The fix scans the scene's windows every 0.1 s, adds a recognizer to each new window and moves the layer to the topmost non-keyboard window. Every window spans the screen, so coordinates line up. For the few seconds the keyboard is up, the finger is behind it; that stays.

![The style chapter — the finger tapping orange inside the style popover, drawn over a popover that lives in another window](/blog/timetable-feature-intro/finger-over-popover.png)

Four re-recordings that day, three of them for the finger. Each one was found by pulling frames; the test passed every time.

## History

- 2026-10-09 — Four-page first-run tour using real app recordings instead of drawn screens
- 2026-10-10 — Clip now resumes after leaving the app and returning
- 2026-10-10 — Welcome page, swipe paging, finger baked into clips, page 1 as "fill the school slots", undo moved to page 2; tap-select → duplicate → drag bug found
- 2026-10-10 — Four looping clips became one clip with auto-advancing chapters, an ending page, the list chapter ahead of periods, and end seeks at duration − 0.1 s
- 2026-10-11 — Idle gaps capped at one second (103 s) · seconds remaining per chapter · ending with a tilted phone and the app icon · three-card welcome collage
- 2026-10-11 evening — Hyewon and Insong user timetables · nine-card tilted-grid welcome (no status bar, white borders, no widgets) · persistent finger, also over sheet windows
