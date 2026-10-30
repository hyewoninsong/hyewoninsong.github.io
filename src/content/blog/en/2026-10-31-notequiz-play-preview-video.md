---
title: "A Play Store preview video — and an app that froze whenever the test paused"
date: 2026-10-31T01:12:36+09:00
app: "notequiz"
tags: ["devlog", "android", "appstore"]
summary: "The Android listing now has the same 24-second preview as iOS, in eight languages. SuperTimetable dropped its videos over YouTube ads; this app kept them. The recording went wrong three times first."
---

SuperMusicNote's Play Store page now plays a 24-second preview, as the App Store page does. It shows a quiz, the ladder hint building up, and the stats map settling on a weak note, in eight languages. Six still screenshots can't show hints being drawn one after another.

## The iOS preview's five scenes, recorded on Android

The scenes, captions and music match the iOS preview. Android chooses only where each scene is cut.

| Scene | What you see |
|---|---|
| Note Reading Quiz | One right answer, then a wrong one (the answer is never revealed) |
| Ladder Hints | Do → Mi → Sol stack up under the La being asked, then the do-only hint |
| Practice in Stages | The five-stage sheet |
| Quiz Made for You | Bass clef on, set to Hard |
| My Practice Stats | The map lights up and lands on La above the staff |

![Ladder hint scene: Do, Mi and Sol drawn faintly under the La that was answered](/blog/notequiz-play-preview-video/ladder-scene.png)

The ladder finishes in under a second on Android, against 2–3 seconds on iOS. So the Android cut starts 0.6 s in, after the screen slides in and the answer buttons fade up.

## SuperTimetable took its videos down; this app put them up

Play only accepts a YouTube link. YouTube may show ads on a channel that isn't in its Partner Program, and it suggests other channels' videos when one ends. Neither can be turned off. SuperTimetable removed its previews ten days ago for that reason.

This time we accepted the same cost:

- **No video** avoids the ads, but stills can't show the app's main idea: hints drawn one by one, then taken away.
- **One English video for every language** is easy, but note names differ by language (도, レ, 哆, Do). A Korean player would think it was another app.
- **Eight videos, one per language**: chosen. Spanish and French share a video across their two regions.

The videos are unlisted, so only the link opens them.

## Three ways the recording went wrong

An instrumented test drives the app and logs a timestamp before each action. The compositor cuts the recording at those timestamps.

1. **The app froze while the test waited.** In a Compose test, animations and `delay()`s run on the test's `mainClock`. While the test slept, nothing was drawn, and the next `waitUntil` skipped animations straight to their end. The first question took 16 seconds to accept an answer. Fix: turn `autoAdvance` off and have a background thread advance the clock by the real elapsed time every 8 ms.
2. **The emulator's `screenrecord` dropped still stretches.** It only writes a frame when the screen changes, so a 26-second scene came out as 11 seconds of video. The emulator's host-side recorder (`adb emu screenrecord`) writes a steady 30 fps on the host clock. As on iOS, the answer key turns green 0.1–0.2 s after its timestamp.
3. **Load from other work pushed scenes out of place.** At a load average above 75, the Japanese stats scene showed the setup screen instead: the tab switch was drawn 3.5 s late. Recording now waits for load under 20. Afterwards it compares each scene's timestamp gaps against a good English take and re-records if any is off by more than a second. Traditional Chinese was caught once.

![End of the stats scene: La above the staff is selected](/blog/notequiz-play-preview-video/stats-scene.png)

A zero exit code never meant the scenes were right. Every language was checked on a one-frame-per-second contact sheet before upload.

## Where it stands

All ten Play locales now link a preview, and the 1.1.2 screenshots were reshot the same day. One thing to watch: Content ID could still claim the synthesized music. Nothing was flagged at upload.
