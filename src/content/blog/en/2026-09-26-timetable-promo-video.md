---
title: "A 30-second promo video, made in code and fixed by eye nine times"
date: 2026-09-26T01:20:00+09:00
app: "timetable"
tags: ["devlog", "appstore", "design"]
summary: "SuperTimetable's App Store preview is a simulator recording cut and captioned by a Python script, in seven languages. The direction changed several times after watching it, and full-screen playback taught us that the viewer's Dynamic Island covers the top of the video."
---

SuperTimetable now has a 30-second App Store preview: drag to add an event, move and resize it, try colours and apply one to every matching event, flip between timetables. It exists in seven languages.

No video editor was involved. A UI test drives the app in the simulator, the screen is recorded, and a Python script cuts the scenes and draws the captions. The direction was judged by eye, and it went through nine versions.

![The headline popping in one character at a time (left) and settled with the highlighter band (right)](/blog/timetable-promo-video/caption-pop.png)

## Say it first, then show it

Every scene opens with a one-second intro. The first frame of the demo holds still while a small caption rises in. The headline then pops in one character at a time, from 1.6× down to size with a slight bounce, and a blue highlighter band sweeps under it. Only then does the demo play. The first version kept the caption fixed while the demo ran, so viewers were reading while the screen was already moving.

## Three transitions later

A horizontal slide felt like turning a page rather than showing a new feature. A blur-out, blur-in transition sounded best on paper, but combined with the intro it left seven of the thirty seconds out of focus. The shipped version is a plain 0.25-second crossfade.

## Music, generated

The soundtrack is synthesized, so there is nothing to license. A calm 120 BPM pad dragged, so it became 128 BPM dance pop with a pumping four-on-the-floor kick. Each transition gets a rising whoosh, and a low hit and cymbal land exactly when the next headline pops. A chime was tried and cut.

## The viewer's phone has a Dynamic Island

Previews are 886×1920, which is almost exactly an iPhone's aspect ratio, so full-screen playback fills the display edge to edge. The top of the video sits under the viewer's Dynamic Island: roughly y 22–97 and x 316–570 in video pixels on an iPhone 17 Pro Max.

![A frame with the Dynamic Island drawn over it: the first layout lost the caption's first line (left); the current one starts below the island (right)](/blog/timetable-promo-video/dynamic-island-before-after.png)

A simulator recording never shows the viewer's island, so the collision only appeared once we drew the island over a rendered frame. The first caption line was being cut in half. Captions now start 130px from the top. The phone below is sized backwards from that line, and every layout change is checked against the island, the home indicator and the display corner radius.

## Recording notes

- Drag gestures show a time pill that moves out of the way when a finger covers it. The video has no finger, so the pill looked misplaced. Ending the drag one column over keeps the pill in place without changing the result.
- Scenes that continue each other must be recorded as one take. Reordering two separately recorded scenes would have shown a block snapping back to its old colour between them.
- A dismissed sheet lingered as a green strip at the bottom of the recording, in all seven languages. `simctl recordVideo` only writes a frame when the screen changes, so the last change sat unflushed. One harmless tap after the dismissal flushed it. The lime pixel count in that strip went from 3,655 per frame to zero half a second later.
- Seven languages record at slightly different speeds, so the test logs a timestamp before every action. Cuts are written as "marker ± seconds". Offsets tuned once on Korean fit every other language.

## Where it stands

All seven previews are on the 1.0.1 version page; the Spanish and French videos serve both regional stores. When the UI changes, one recording per language and one render command rebuild the whole set.
