---
title: "The sheet's scroll stopped dead at its edges — the guard that held the sheet was eating them"
date: 2026-10-28T17:13:40+09:00
app: "notequiz"
tags: ["devlog", "android", "gesture"]
summary: "In the Android note quiz, the note-range and question-type sheets hit a wall at the end of their scroll. The guard that keeps a body scroll from closing the sheet was also taking what the edge effect needed. The rubber band now sits inside that guard: the content pulls past the edge, the sheet stays put."
---

On Android, pulling the note-range or question-type sheet past its top or bottom now drags the content with growing resistance and springs it back when you let go. Before, it stopped like a wall — unlike the iPhone app and unlike the Android tabs, which already had the rubber band.

## Only the content moves

![The note-range sheet at rest](/blog/notequiz-android-sheet-rubber-band/sheet-at-rest.png)

![Mid-pull from the top: the content is pushed down, the handle, title and buttons stay where they were](/blog/notequiz-android-sheet-rubber-band/sheet-pulled-past-top.png)

The handle, title and buttons do not move. The curve and spring are the same as on the tabs.

## Why the content, not the sheet

On iOS, pulling down at the top of a sheet's scroll moves the sheet. This app once had sheets close while a list was scrolled back up, and since then a sheet closes only from its handle, title bar, scrim or Back. Letting the content scroll move the sheet would bring that back. Android's stretch effect was out too: stretching the staff distorts the very pitch it shows.

## What ate the edge

Outside each sheet body sits a `NestedScrollConnection` that consumes the scroll and fling the list cannot use, so the sheet never sees them. A Compose scroll container only hands its `OverscrollEffect` what the parents left — and the guard left nothing. The fix is order: the rubber band's connection goes inside the guard, closer to the scroll, so it takes the edge first and the sheet still gets zero.

Checked on the emulator: repeated fast flicks down at the top never close the sheet, and an upward fling at the bottom leaves two changed frames in a two-second recording (the old shaking bug produced 40+). A unit test now fails on any vertical scroll in the UI code without the rubber band.
