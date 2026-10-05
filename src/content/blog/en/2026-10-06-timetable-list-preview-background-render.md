---
title: "Leave the app, come back, and the preview had lost its grid lines"
date: 2026-10-06T01:38:00+09:00
app: "timetable"
tags: ["devlog", "swiftui"]
summary: "Timetable list previews came back from the background without grid lines. The app was re-rendering them while backgrounded, and a render done there drops Canvas content."
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
