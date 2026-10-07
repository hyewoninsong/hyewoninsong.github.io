---
title: "Leave the app, come back, and the preview had lost its grid lines"
date: 2026-10-07T23:55:00+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "Timetable list previews came back from the background without grid lines. The app was re-rendering them while backgrounded, and a render done there drops Canvas content. A day later the same image got a cache."
---

Open the timetable list, switch to another app, come back: the card preview had its events and labels, but no grid lines. Swiping between cards brought them back. Now the preview survives the trip.

## Not a blank image, an image missing one layer

![The list card after returning from another app: events are there, grid lines are not](/blog/timetable-list-preview-background-render/lines-missing.png)

The preview is not a live view. An off-screen `UIHostingController` is drawn into an image with `drawHierarchy`, and the card shows that image. When this kind of render fails you usually get an empty image. Here everything was present except the grid lines, and on period-based timetables the grey lunch band too. Both come from a single `Canvas`.

## The preview was being re-rendered in the background

Logging the app state right before each render settled it.

| When | Renders | App state |
|---|---|---|
| List opened | 2 cards | active |
| 5 seconds after pressing Home | 2 cards | background |

The render runs in a `.task(id:)`, and its key includes `colorScheme` so that switching to Dark Mode redraws the preview. When an app goes to the background, the system takes app-switcher snapshots in both light and dark, flipping the appearance and flipping it back. The environment value changes, the key changes, the task runs again, and a `drawHierarchy` performed in the background bakes the image without the `Canvas` content.

On return the appearance is what it was, so the key matches and nothing triggers another render. Swiping worked only because off-screen cards are rebuilt from scratch.

I did not pin down why only `Canvas` is dropped. What is measured: same code, lines present when rendered in the foreground, absent when rendered in the background.

## Don't render while backgrounded

![After the fix: the grid lines are still there on return](/blog/timetable-list-preview-background-render/lines-kept.png)

- Skip the render if the app is in the background.
- Remember which key the current image was rendered with. On returning to the foreground the task runs once more and exits immediately if the key matches.

Without the second part every card would re-render on every return. With it, a redraw happens only if the appearance really changed while the app was away.

Drawing the grid with `Path` shapes instead of `Canvas` lost: the overlap hatching in the same image is also a `Canvas`, and that renderer is shared with sharing, printing and the lock-screen wallpaper. Removing `colorScheme` from the key lost too, since the preview would then go stale when the appearance changes with the list open.

## Open-and-capture checks could not see it

Every screenshot check of this preview opened the list and captured. None left the app. The repro is one step longer: open the list, press Home, wait five seconds, return, capture. The app's appearance must be set to automatic, because a launch that pins the appearance gives the system nothing to flip. That step is now part of how off-screen renders get checked. It has not been verified on a physical device yet.

## 2026-10-07 — The same image was being rendered on every open

With the grid lines fixed, the next thing showed: every time the list opened, each card was a spinner for a moment. Now a rendered preview is remembered, and reopening the list shows the image from the first frame.

Three things stacked up. Every card waited a fixed 0.4 s before rendering, a delay meant for the sheet's presentation that also hit cards created long after it. The image lived only in the card's view state, so closing the sheet threw it away. And one render blocks the main thread for 80–130 ms.

The cache key is everything that decides the image: timetable content, card width, row height, appearance, time format. The whole timetable is compared rather than a hash or a version counter; with one image per timetable that is a single comparison. Fields the image does not show are stripped from the key: name, order, and the last-viewed timestamp. Leave that last one in and the key changes every time a timetable is opened, so the cache never hits.

The 0.4 s wait now applies only right after the sheet appears. Nothing renders mid-swipe; it renders when the pager settles.

| Step | Renders |
|---|---|
| First open | one per card, about 1.1 s after the tap |
| Close and reopen | 0 |
| Swipe through five cards and back | 0 |

### The prefetch never ran

Neighbouring cards are also rendered ahead of time. The first version filled two cards on each side, had unit tests, and looked fine on screen.

Tagging each render in the log with who asked for it showed zero prefetch renders. `LazyHStack` was already creating cards two positions out, and those cards rendered themselves first. The prefetch found the cache full every time. Dead code that no screenshot would reveal.

Widening it to three positions puts it one step ahead of what `LazyHStack` creates, and the log then showed it working. The same measurement corrected an assumption: single swipes rarely showed a spinner before, because the card two positions out was already rendering off screen. The gain is mostly on reopening.

### One image was 26 MB

A preview of an 8:00–22:00 timetable measured 26 MB. It was rendered at the device's 3x scale and then shown at 0.84x, and the default renderer format uses 8 bytes per pixel on wide-colour devices. Rendering only the pixels that reach the screen, in standard range, brought it to 9.2 MB. Share and print output are untouched.

Yesterday's bug matters more now: with a cache, one image rendered in the background would keep coming back. The background guard sits on every path that renders, the prefetch included.

Render time on a physical device has not been measured yet.

## History

- 2026-10-06 — Fixed grid lines disappearing after leaving and returning to the app.
- 2026-10-07 — Added an in-memory cache, made the wait conditional, and prefetched neighbouring cards.
