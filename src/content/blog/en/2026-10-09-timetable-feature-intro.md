---
title: "We threw away the drawn mockup and recorded the real app for the first-run tour"
date: 2026-10-14T23:23:43+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "On first launch, a welcome page and then a phone-shaped mockup playing the real app show four things SuperTimetable can do. The drawn first version was dropped the same day; the next day the clips got a finger and the pages got swipe."
---

Open SuperTimetable for the first time and, before the empty timetable, you get a welcome page, one tour clip that runs through four chapters, and an ending page. Inside a phone-shaped frame an event is created, moved, recolored, timetables are switched, and a speech bubble on the screen says what is happening, right where it happens (it began as a line under the phone and moved on 10-13, below). What plays inside the frame is a recording of the real app. The first version was a drawing.

## Show what the app can do before asking anyone to try it

The old first run was an empty grid with a "start the tutorial?" card. The tutorial teaches by doing, but it never tells you that you can make your own colors, lay a timetable out by class period, or keep several timetables. So the order is now tour, then tutorial.

| Page | What it shows |
|---|---|
| Just Drag | Fill the empty school slots — drag one on Monday → duplicate → drag to the next day → resize, through Friday (changed 10-10, below) |
| Your Style | Pick an event, change its color, create a custom color, apply to matching events → undo brings every color back → redo (added 10-10 evening) |
| Multiple Timetables | Swipe cards → switch to the title list and search → open the computer-science timetable (moved ahead of the period chapter on 10-10, below) |
| By Period or by Time | The computer-science timetable with rooms → switched to a time axis → back in the list, reopen the first timetable: a finished week |

![Pages 1 and 2 — the real app moving a just-created event, and picking a color in the real style popover. A line under the mockup describes the current action; the x2 chip is the playback speed](/blog/timetable-feature-intro/pair-real-clips.png)

No Skip. Chapters advance on their own with the clip, and Back, Next and swiping (since 10-10) jump between them. Headlines use the App Store cards' copy and markup — the bracketed keyword gets the same highlighter band in the same accent color — captions come from the preview video. The backdrop started as the store screenshots' 3D bars and was removed late on 10-11. The real app is slow to watch, so playback defaults to 2× with an x2 chip on the mockup that toggles to 1×; the rate lives in the player, so captions stay in sync. The caption line lost its step number: a new sentence rises from below while the old one leaves upward, and that motion already says "next step".

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

Only the Korean clips shipped at first; checking them on a real device before recording the other seven languages saves re-recording. English arrived on 2026-10-12 (below). The earlier foreign-language clips from the old three-page scenario were removed rather than left in: a clip that disagrees with its captions plays without any warning, so none is better than wrong.

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

At this point the clip was Korean only; the English recording arrived on 2026-10-12.

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

Late that night the grid started moving: "flow from bottom to top, diagonally along the grid's angle." Inside a tilted container a plain vertical offset already follows the tilt, so there is no diagonal to compute. Each column stacks its cards twice, a clock drives the offset upward, and every lap (three cards plus three gaps) it snaps back to zero — at that instant the second copy sits exactly where the first one was, so there is no seam. 18 pt per second, about 45 seconds per lap: slow enough that you do not notice it while reading the headline. Reduce Motion stops the clock. A clock instead of `withAnimation`'s repeat-forever means the view can leave and come back (welcome ↔ tour) without a jump.

## 2026-10-11 — The top-right of the tilted grid was empty

Opening the welcome page again from the replay menu, the top-right corner looked bare. Tilting the whole nine-card grid nine degrees pushes its right edge upward, so the grid's top-right corner barely reaches the screen edge and the background shows past the rounded corner and shadow of the third column. With the grid drifting upward, the gap breathes.

![The welcome page — bare background above and right of the Ria card](/blog/timetable-feature-intro/welcome-top-right-empty.png)

The fix is one more column on the right: three cards (the event editor, Hyewon's time-based grid, the print screen) cropped from store captures the same way. The point is that the original nine do not move. The grid frame keeps the three-column width, aligned top-leading, and the fourth column **overflows** it to the right. Rotation centre and scale are unchanged, so the nine cards stay exactly where they were and the new column only fills the corner the tilt lifted; its lower part is clipped off-screen. It is shifted further up than the third column so it reaches the corner.

![The welcome page — Hyewon's colourful grid now fills the top-right, with the print screen's close button below it](/blog/timetable-feature-intro/welcome-fourth-column.png)

Three alternatives lost. Widening the frame to four columns and centring it moves the rotation centre right, shoving all nine cards left and cutting the first column. Shrinking the cards to fit four columns makes the captures unreadable. Reducing the tilt or scaling up: the tilt is the whole point borrowed from the reference onboarding, and more scale pushes cards down into the headline.

## 2026-10-11 afternoon — One card spins into the phone, and the period chapter runs the other way

The welcome page and the tour used to slide past each other. Now, when you tap Continue, one of the flowing collage cards lifts off where it is, spins a full turn around its vertical axis, turns into the phone mockup on the way, and settles where the phone belongs. The clip starts right there. The floating 3D bars behind the welcome page are gone from that page; they fade in as the tour begins. That night they were removed from every page. Collage plus bars made the first screen busy.

![One welcome card lifts, spins and lands as the phone mockup — at the tap, 0.55 s, 0.75 s, and landed](/blog/timetable-feature-intro/hero-flight.png)

No card is fixed in advance. The collage scrolls, so any given picture is sometimes off screen. At the tap we pick, among the cards wholly inside the top 78% of the frame, the one closest to top-center. Card positions arrive 30 times a second; keeping them in view state would redraw the whole intro every frame, so they live in a reference-type box that is read once at the tap.

A full turn still ends on the phone on purpose. Half a turn is a flip, not a spin; a full turn back to the card cannot become a phone. At 90° the back face is the phone; past 270° the front is the phone too. Both swaps happen when the card is edge-on, zero pixels wide. The back face is the clip's frame at 0 s, pulled ahead of time with `AVAssetImageGenerator`, and the real player sits paused on that same frame until the card lands. A spring with overshoot would pass 360° and flash the card again, so the curve has none.

### The removal transition could not depend on state

While the card flies, the welcome page must fade in place; if it slides, the phone's target slides with it. So the welcome page's transition was chosen by state: fade when a card is flying, slide otherwise. Recorded frames showed it sliding left. The state change that lifts the card and the one that switches pages were committed in one render, and the departing view left with the "no card" transition.

Deferring the page switch with `DispatchQueue.main.async` did not help: a block dispatched from a tap handler runs in the same run-loop turn, before the commit. Deferring from `onChange` did not help either; the lifted card and the switched page landed in the same frame. The fix was to stop choosing the removal transition by state at all and fix it with `.asymmetric(insertion:removal:)`. Insertion reads the value at the update that inserts it, so that side can still depend on state. The difference between fade and slide is 0.4 s; it was invisible in code and obvious in 10 ms frame strips.

### The period chapter now goes time → period

The period chapter used to take a college timetable from periods to a time axis, and the moment of change was flat: snug blocks simply scattered. Reversed, a college timetable opens on a time axis with 75-minute classes floating, then snaps into 1st, 2nd, 3rd period when Timetable Settings switches it to By Period. Then an empty Wednesday first period is dragged to add the class that was missing, with the same red as Monday's and the room in the memo.

![The period chapter — opened by time, switched to periods, Wednesday's missing class added](/blog/timetable-feature-intro/period-flip.png)

The recording fixture enters as "just converted from periods to time": same minutes, one Wednesday class removed. The app remembers the period rules when converting a timetable to time and restores them on the way back, and the fixture carries that memory too, so switching back brings all 12 periods with nothing deleted.

### School ends on the built-in red

The styling chapter used to finish on a custom navy. A custom color as the final look reads as "do I have to make that?" Now the custom color is only made and added; the save goes back to the Basic tab's red, and after undo and redo the school blocks are the built-in red, the same red the period chapter uses for the added class.

![The ending — a finished week with five school blocks in the built-in red](/blog/timetable-feature-intro/final-week-red.png)

That one tap dropped out of the recording twice. Right after tapping the Basic tab, the red swatch existed in the accessibility tree, but the page was still sliding in from the left and its frame was off screen; tapping that point counted as a tap outside the popover, which closed, and the test passed anyway. Waiting for the swatch frame to be inside the popover was not enough: the tab switch itself was gated on "the basic swatch does not exist", and a pager keeps hidden pages alive, so it always existed. The gate is now the segment's `isSelected`. A green recording test and a correct video are still two different things.

## 2026-10-11 evening — When the finger is visible, where a tap lands is content

In the styling chapter the tour picks a color and then dismisses the popover. Any tap outside closes it, and the popover swallows that tap. So the recording test reused the screenshot helper, which taps 24 pt below the popover.

That spot is the Delete Event button. Screenshots have no finger, so it never mattered. The clip has the finger baked in, and it looked like someone picked a color and then pressed delete. Nothing is deleted, but a viewer cannot know that.

![Left: the old clip, with the dismissing tap landing on Delete Event. Right: the new clip, tapping empty space under the header](/blog/timetable-feature-intro/popover-dismiss-finger.png)

Recordings now use their own helper. It reads the title field's measured frame and taps 14 pt above it, in the empty strip between the header row and the title. Screenshot and preview-video tests keep the old helper.

The last frame had the same problem. The ending page holds the clip's final frame in the phone mockup, and with an always-visible finger that frame had a finger resting on the finished timetable. Hiding it after a long idle would also hide it during pauses mid-clip, so the recording test sends the app a signal after its last action and the finger fades out over 0.3 s. The two seconds after that are the ending picture.

The period chapter's copy was trimmed the same day. The headline names two modes, by period and by time, and now both words carry the highlighter band instead of only the first. The first caption is down to one sentence. Two sheets that appear in the clip had changed shape, so the whole clip was recorded again.

## 2026-10-11 night — The 3D bars and the replay hint are gone

The tour has one less moving thing. The 3D bars and dots that drifted along the edges behind the tour and the ending are removed, and the background is the plain app surface. They were there to carry the store artwork into first launch, but next to a phone mockup playing the real app, motion at the edges competed for attention. What moves now is the clip and the welcome collage.

The ending page no longer says the tour can be replayed from the menu. That menu row exists only while the tour is being tuned and is hidden in release builds, so the hint would point at a row that is not there. The caption chip fades out on the ending page but keeps its space, because collapsing it would drop the phone above it.

## 2026-10-11 night — The flying card froze where it lifted

On a real device, now and then, tapping Continue left one collage card hovering in place. The tour text appeared, the phone mockup did not, and Next changed nothing.

The structure was the problem. While the card is in the air the phone is hidden and the clip is paused, and the card only lands at the end of a chain: lift, scene change, then the new page reporting the phone's frame through `onGeometryChange`. Miss one link and the card stays up forever. A decoration was holding the gate to the real content.

I could not find which link dropped that night (found the next day, see below); six back-and-forth runs in the simulator never showed it. A debug switch that blocks only the landing reproduces the reported screen exactly, so the fix does not depend on the cause. If the card is still up two seconds after lifting, it is removed and the phone appears. A normal flight takes 0.9 s, so the timer usually does nothing. The geometry callback now only records the frame, and the landing starts on the next run-loop turn.

Every check so far had asked whether the card flies well. None asked what happens when the signal never comes.

## 2026-10-12 — The cause was a revived view

The report came back with one more detail: it happens when you flick **quickly** between the welcome page and the first tour page.

Continue clears the last known phone frame and waits for the tour page to report a new one through `onGeometryChange`. But if you go back and tap Continue again before the 0.4 s removal transition finishes, SwiftUI does not build a new tour page. It revives the one that was leaving. Same view, same frame, so the callback never fires again, and the card waits for a value that is not coming.

![A tilted collage card hovering over the tour text with no phone mockup](/blog/timetable-feature-intro/hero-card-stuck.png)

That is also why clicking in the simulator never showed it: the gap has to be under 0.4 s. So the app now presses its own buttons. A debug argument sends Continue, Back 0.4 s later, then Continue again after a given number of milliseconds. Run at 0 and 150 with screenshots from launch, it showed the card stuck for two seconds until the watchdog removed it.

The fix is to put a flight number into the reported value. Same frame, different flight, different value, so the callback fires. The landing completion and the watchdog use the same number to clean up only their own flight.

One guess was wrong. I first blamed `onChange` keyed on the card's slot. Reverting only that and rerunning the probe did not freeze, so it stays as hardening, not as the cause.

## 2026-10-12 night — An English recording, and a check that had been off

Until now there was one clip, recorded in Korean. An English user read "Just Drag" above a phone typing a Korean word. The strings, the recording test and the sample timetables were already per-language; only the recordings were missing, so we recorded all seven other languages, about 130 s each.

![End frames of the eight clips — the same finished week in each language](/blog/timetable-feature-intro/eight-languages.png)

### Eight recorded, two kept

Each clip is 2.6 MB. Seven more would add 18.7 MB to the bundle, HEVC that the App Store cannot shrink further, and a user watches one of them, once. The next morning's call: **ship Korean and English, and every other locale plays the English clip.** A Japanese caption over "Choose Style" is a mismatch, but a smaller one than Korean footage, and English reads everywhere. The bundle grows by 2.6 MB.

Three alternatives lost: re-encode all eight at a lower resolution (about half the size, quality to be checked by eye); bundle English only and download the user's language on first run (smallest, but first run needs a network); and replace the video with the real app driven by a script inside the mockup. The last one fails because the editor sheet, style popover, list and keyboard are full-window system presentations that cannot be confined to a small phone frame, so they would have to be redrawn, which is the mockup we threw away on October 9. A test now requires exactly two clips: a missing one falls back silently, an extra one costs 2.6 MB.

### The test passed and the last frame was the home screen

The recording test logs a timestamp before each action and the clip is cut at those marks. Under load the recorder's clock runs ahead of the wall clock, so marks and picture drift apart. The promo pipeline has a check for that: the last scene change (app closing to the home screen) must sit within 1.5 s of the end mark.

The tour recording reuses that script, but the check looked for a mark named `end` and this test ends with `tour_end`. It failed every time with "no end mark", and the wrapper only looked for `passed`. A check that always fails and is always ignored is no check.

Once the name matched, two clips were rejected: French was 5.3 s off, Portuguese 4 s. Their last frame, the one the ending page holds in the phone mockup, was the simulator home screen.

![Left: last frame of a drifted recording. Right: the re-recorded one](/blog/timetable-feature-intro/drift-home-end.png)

(Neither clip ships in the end, but the check had been off.) The cause was video compositing from another job on the same machine. The rejected takes started with a one-minute load average of 6–17, under the gate, while the five-minute average was near 100. Load at the start is a precondition, not a verdict. The seven kept recordings all land at +0.75 to +1.05 s, the length of the app's closing animation.

The welcome collage stays Korean: its cards shrink text to 2–5 pt.

## 2026-10-13 — Explain each action once

The opening chapter repeats duplication and movement to fill the remaining days. Its captions kept switching between instructions the viewer had already read.

Creating, duplicating, moving and resizing still get their first explanation. Once the actions repeat, one caption stays through the rest of the chapter: **“Fill in the rest of your week.”** Repeating the instructions added no information; removing them entirely would lose the purpose of the sequence. The caption now describes what is being completed.

The choice follows the video's playback time. Returning to an earlier demonstration restores its instruction, while the repeated section keeps its single caption.

## 2026-10-13 — The caption moved from under the phone to next to the finger

The caption chip under the phone mockup is gone. The explanation now sits on the phone screen as a speech bubble whose tail points at the spot the clip is touching. "Long-press an empty cell and drag…" floats just above the finger on Monday 9:00; when it is time to duplicate, the bubble moves to the Duplicate button. A line under the phone makes the eye travel between video and text; a bubble at the finger reads as "this, now". The phone also grew into the space the chip left.

![First action of the fill chapter — the bubble sits right above the finger pressing Monday 9:00, tail pointing at it; under the phone only the page dots and buttons remain](/blog/timetable-feature-intro/bubble-create-above.png)

The question was where the positions come from. Typing coordinates by hand fails quickly: duplicate and move land on a different day each time, and a re-recording shifts everything a little. The recording test already knows where it taps, so the marks it prints before each action now carry the touch point as a screen fraction. The cutting script adds x·y to the "from this second, this sentence" list, and the app maps the fraction into the mockup's screen. Fractions survive a different recording device.

Three placement rules. Above the touch point by default, 22pt clear of the baked-in finger. Below when there is no room above — the save checkmark, the list-style toggle, the list button. Horizontally the box is pushed inside the screen while the tail keeps pointing at the touch; pressing the time axis at the left edge leaves the box inside and only the tail off-center. Box and tail are one path, so the translucent fill has no seam.

![List chapter — the list-style toggle is at the top of the screen, so the bubble hangs below it with the tail pointing up](/blog/timetable-feature-intro/bubble-search-below.png)

What a sentence is about is not the same as what gets tapped next: "swipe through the cards" points at the middle of the screen where the cards move, not at the list button. In the repeated fill section the sentence stays the same, and at first the bubble followed wherever the current duplicate or move happened (reversed the same afternoon — see below; it now appears once, at the first repeat).

The bundled Korean and English clips were not re-recorded. The video is unchanged and only the positions were missing, so the same test ran once per language without recording and its logged positions were merged into the existing lists in chapter order. An old list without positions still works — the bubble just sits at the bottom centre without a tail.

## 2026-10-13 afternoon — The bubble stays only long enough to read

On a real device the verdict was: the first position is right, but after that the bubble sits on top of the controls the clip is using. It did. A bubble stayed until the next mark, and the mark after "press and hold an empty slot" is the duplicate 14 seconds later, so the caption covered the title field of the new-event sheet the whole time. The fill caption re-appeared at every duplicate and move, over the middle of the grid.

![The new-event sheet is up but the create caption still covers its title field](/blog/timetable-feature-intro/bubble-covers-sheet.png)

Now a bubble stays **three seconds** from its mark and then fades in place over 0.8 s. The caption names the current action; once the action is done the video speaks for itself. Three seconds is fixed, not derived from text length — a Korean sentence of ~25 characters and an English one of ~60 both read in that time, and a per-locale formula would need per-locale tuning. The fill caption appears once, at the first repeated mark; showing it at every repeat would cover the grid every three seconds and defeat the point.

![Six seconds in — the bubble is gone and the sheet title "School" is visible](/blog/timetable-feature-intro/bubble-faded-sheet.png)

The three seconds are measured in **clip time**, not with a timer: the bubble is held while clip time minus mark time is under three seconds times the playback rate. At x2 clip time runs twice as fast, so the wall-clock hold is the same, and rewinding with Back or a swipe makes the same test true again, so the bubble comes back. Nothing to reconcile after the app returns from the background. A timer would have needed re-arming on every seek and rescaling whenever the speed changed.

The exit transition changed too. The old bubble used to shrink toward its tail; for a caption that has been read, shrinking reads as "something closed". Bubbles still bloom from the tail on the way in and now only fade on the way out.

One overlap remained: at x2 the new-event sheet rises about two seconds after the drag, so the first bubble shared the title field for roughly 1.5 s. We left it as a trade-off against reading time. That evening a real device showed it was not just the first bubble (below).

## 2026-10-13 evening — When the thing it points at is gone, the bubble goes too

A fixed three seconds only works while the screen holds still. Eight device screenshots came back with a bubble sitting on a sheet, a style palette, a colour picker, or a list under a freshly raised keyboard. A bubble points at a touch spot. If a sheet or popover opens right after the touch, the target is no longer on screen: the tail points at something buried, and the box covers what just appeared.

![The timetable settings sheet is up and the bubble is still there, its tail pointing at the time axis behind the sheet](/blog/timetable-feature-intro/bubble-tail-over-sheet.png)

Now a bubble leaves **when the screen changes** inside its three seconds, with a 0.3 s fade. Actions that leave the screen alone (duplicate, move, resize) keep the full three seconds.

The change time comes from the video, not from new recording marks. Marks would have meant re-recording both clips and hand-placing "the screen changes here" on 23 captions. Instead a script shrinks the clip to 66x143 greyscale at ten frames a second and, per caption, records the first moment more than 14% of pixels differ from the frame at the mark. One block appearing or moving is about 10%; a popover is 15–25%, the keyboard 27%, a sheet over 40%. No re-recording, and the script runs right after the clip is cut on future recordings.

A single threshold can be wrong, and undo does trip it (every block changes colour at once, 20%). So a wrong call is cheap: a false hit shows the bubble for 1.5 s instead of three, a miss falls back to three. There is no per-action exception list.

That 1.5 s floor is the second decision. Around ten captions see the screen change within half a second of their mark, because a tap opens a sheet immediately. Leaving at that instant would make them flash. Tight for a long sentence, but better than three seconds over a screen the caption no longer describes. The proper fix is to raise the bubble before the touch, which needs a gap in the recording and waits for the next re-record.

## 2026-10-14 — The Android version records the Android app

Android now has the same intro. The twelve collage cards and the clip in the phone frame are **recordings of the Android app** made on an emulator: the same story, Android's sheets, keyboard and bottom buttons. It had been deferred because the clip was an iOS recording and a looping video seemed to need a new player library. Both are solved.

![Android fill chapter — the Android new-event sheet and Korean keyboard inside the phone frame, the step caption and seconds remaining below (moved into bubbles that night, see below)](/blog/timetable-feature-intro/android-tour-chapter.png)

Shipping the iOS clip lost at once: an intro showing another platform's screens is wrong from the first frame. Media3 lost too: the platform `MediaPlayer` drawing into a `TextureView` already has speed and exact seeking on API 26, with no new dependency. The clip is H.264 rather than HEVC for old software decoders: 137 s, 2.7 MB.

**Tablets skip it**, as on iPad: the recordings show the phone layout. The rule is the smallest screen width (600 dp), not the window width, so a phone held sideways at first launch still gets it.

![Android ending — the finished week in a slightly tilted phone, the app icon in front, and the Start button](/blog/timetable-feature-intro/android-ending.png)

### Four places the recording went wrong

- **Injected touches draw no dot.** `adb shell input` bypasses the input device, so "show taps" draws nothing. A virtual touchscreen via `adb shell uinput` goes through the real input path — but its coordinates span the whole panel, so on a resized emulator only the centre was right.
- **`delay` is not "from now".** A 0.75 s press plus a 1 s drag arrived in 17 ms. uinput runs a virtual clock from registration and a late batch has all its delays in the past. We measure the clock's origin once and prepend a catch-up delay to every gesture.
- **The shared emulator is shared.** Another job reinstalled the app mid-take. Takes now run on a cloned AVD nobody else uses.
- **Idle gaps were invisible in frame times.** The now line redraws the same picture every second, so the first cut was 220 s. Trimming on frames whose picture changed (`mpdecimate`) brought it to 137 s.

After each chapter the recorder reads the timetable the app saved and stops if the scene drifted — a drop that landed at 12:40 instead of 13:00 looks fine on video.

## 2026-10-14 night — Android gets the bubbles too, and one syllable fell to its own line

The Android version shipped with the caption chip under the phone, the shape iOS dropped three days earlier. Now it has all three iOS rules. Each bubble points at the touch spot. It stays three real seconds, or leaves after 1.5 s if a sheet or keyboard changes the screen. The repeated fill run shows its sentence once. The clip was re-recorded on the current build, not patched with coordinates, because the sheets had changed since the first take.

![Android fill chapter, first action — while Monday 9:00 is held and dragged, the bubble reads in two even lines and its tail points at the press](/blog/timetable-feature-intro/android-bubble-create.png)

The recording script now stores the touch point with every mark, as a screen fraction. Look up, mark, then tap: a lookup after the mark makes the bubble appear a second or two early. Putting it first broke something else. The idle-gap trimmer cut the lookup pause and merged the period chapter's first two marks into one moment. The chapter's first mark is now taken first, and its point is attached once the element is found.

Screen-change times come from the iOS frame-difference script: shrink to 72 px grey and take the first frame where more than 14% of pixels differ from the mark frame. It caught 22 of 23 lines. The miss is search, where the keyboard came up after the six-second window, so that bubble keeps its full three seconds.

![Where the repeats begin — "Fill in the rest of your week" appears once above the duplicate button, and the later copies run with no bubble](/blog/timetable-feature-intro/android-bubble-fill.png)

### Draw the text you measured

The tail's position depends on the box width, so the text is measured with `TextMeasurer` before the bubble is drawn. The first build then handed the measured width, minus padding, back to a `Text`. Going px → dp → px lost a pixel, a line that fit exactly wrapped, and the box, sized for one line, clipped the second. The bubble now draws the measured `TextLayoutResult` with `drawText`, so nothing is computed twice.

Korean also broke between syllables, leaving "요." alone on a second line. `LineBreak.Heading` with `WordBreak.Phrase` gives two even lines that break between words, and the box width is re-measured from the longest line, because a wrapped layout is as wide as its constraint. `Phrase` needs Android 13; older versions still get the balanced split.

## History

- 2026-10-09 — Four-page first-run tour using real app recordings instead of drawn screens
- 2026-10-10 — Clip now resumes after leaving the app and returning
- 2026-10-10 — Welcome page, swipe paging, finger baked into clips, page 1 as "fill the school slots", undo moved to page 2; tap-select → duplicate → drag bug found
- 2026-10-10 — Four looping clips became one clip with auto-advancing chapters, an ending page, the list chapter ahead of periods, and end seeks at duration − 0.1 s
- 2026-10-11 — Idle gaps capped at one second (103 s) · seconds remaining per chapter · ending with a tilted phone and the app icon · three-card welcome collage
- 2026-10-11 evening — Hyewon and Insong user timetables · nine-card tilted-grid welcome (no status bar, white borders, no widgets) · persistent finger, also over sheet windows · later that night the grid flows upward along its tilt
- 2026-10-11 midday — fourth welcome column (event editor, Hyewon time grid, print) overflowing the frame to fill the top-right corner the tilt left bare
- 2026-10-11 afternoon — no 3D bars on the welcome page · one flowing card spins a full turn into the phone mockup · school finishes on the built-in red · period chapter runs time → period and adds the missing class · removal transitions are never chosen by state
- 2026-10-11 evening — dismissing tap moved off the Delete Event button to empty space under the header · period chapter copy trimmed, both headline keywords banded · clip re-recorded with the updated sheets · finger removed from the ending frame
- 2026-10-11 night — 3D bars and dots removed from the tour and ending backdrop · replay hint removed from the ending page, since release builds hide that menu row
- 2026-10-11 night — flying card could freeze between welcome and tour: two-second watchdog, geometry callback only records, debug switch to force the stuck state
- 2026-10-12 — cause found: a revived tour page never re-reports the phone frame · flight number in the measured value · debug argument that drives the fast back-and-forth
- 2026-10-12 night — seven more languages recorded · drift check switched on (it had been looking for the wrong end mark) · two rejected clips re-recorded
- 2026-10-13 — size (+18.7 MB for eight) → ship Korean and English only, other locales play the English clip
- 2026-10-13 — Explain each action once, then keep one caption for the remaining events
- 2026-10-13 — caption chip removed; a speech bubble on the phone screen points at the touch spot, positions carried by the recording marks as screen fractions
- 2026-10-13 afternoon — bubble holds three real seconds from its mark then fades in place (clip-time test, returns on rewind) · fill caption once at the first repeat
- 2026-10-13 evening — bubble leaves when the screen changes within its three seconds (sheet, popover, keyboard), 0.3 s fade · change time measured from clip frame differences, no re-recording · 1.5 s floor
- 2026-10-14 — Android version: the Android app recorded on an emulator (uinput touches, virtual-clock delays, dedicated emulator, picture-based idle trimming), platform MediaPlayer, phones only
- 2026-10-14 night — Android bubbles (touch spot · three seconds · early leave · fill once) · clip re-recorded on the current build · measured text drawn as is · balanced word-boundary lines
