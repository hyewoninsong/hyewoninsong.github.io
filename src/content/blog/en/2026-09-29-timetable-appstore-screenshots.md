---
title: "Ten App Store screenshots that read as one picture"
date: 2026-10-01T23:10:54+09:00
app: "timetable"
tags: ["devlog", "appstore", "design"]
summary: "SuperTimetable's new App Store screenshots: a three-card panorama of 3D bars taken from the app icon, then seven feature cards whose background keeps running between the phones. How the seams line up, and why the drag shot had two guide lines."
---

Swipe through SuperTimetable's App Store screenshots and you now scroll across one long picture instead of ten separate cards. The first three set the mood; the next seven show the features.

## The first three cards are one image cut in three

The idea came from a streaming app whose first three screenshots are a single illustration split across cards, so objects cross from one card into the next.

We already had the material: the app icon's five colored bars and the gray dots above them. We built them as glossy 3D slabs in SceneKit, rendered one 3960×2868 image, and cut it into three 1320-wide cards.

![The first three cards — the icon's bars, in 3D, crossing the card edges](/blog/timetable-appstore-screenshots/panorama-three-cards.png)

The first render washed orange out into yellow; the lighting had to come down by almost half. A floor plane for shadows went too, since its far edge showed up as a gray band.

## The feature cards had to continue it

The seven feature cards keep their one-feature layout: a caption, a big headline, a phone bleeding off the bottom. They gained two things: the same bars and dots in the background, and a highlighter band under the key word of each headline, one icon color per card.

Scattering bars per card looked fine one at a time but broke the flow next to the panorama. So the seven backgrounds are now one 9240px strip, sliced. The only free space is a thin band above the caption and the 230px corridor between neighbouring phones. A diagonal bar across that corridor hides both ends behind the phones and shows only its middle.

![Feature cards — bars cross the corridor between phones and continue on the next card](/blog/timetable-appstore-screenshots/cards-continuous-background.png)

## Perspective cameras don't meet at the seams

One wide perspective camera would need a horizontal field of view above 110°, which stretches the bars at the ends. Moving a perspective camera card by card draws a seam-crossing bar from two viewpoints, and it misaligns by close to 20px. An orthographic camera has no perspective, so any cut matches pixel for pixel, and at this size the missing perspective is hard to notice.

We also tried carrying a bar from the panorama into card four. One side was perspective and the other orthographic, so the angles never matched, and we left that edge empty.

## Why the drag shot showed two guide lines

The "Just drag" card captures a block mid-move. Guide lines appear when an edge snaps to another event, and the shot showed one above and one below the block. That muddles the point: the top edge lined up with a neighbor.

When you move an event, it also snaps to its own original start and end, so you can drop it back easily. The capture moved the block sideways at the same time of day, so both edges snapped to where it came from. The app keeps that behavior. The capture now drops the block an hour earlier: its top meets the 13:00 boundary and its bottom touches nothing.

![Before and after — two guide lines became one](/blog/timetable-appstore-screenshots/drag-guide-line-before-after.png)

## Where it stands

All ten cards exist in eight languages, and every locale now shows its own app screens instead of borrowing the English ones. When the iPhone set was prepared, version 1.1.0 was in review and its screenshots were locked. The new set was reserved for the next version.

## 2026-10-01 — The iPad needed a different capture position

The iPad cards now use the same 3D bars and gray dots. Its landscape grid shows the week comfortably, but the shorter viewport initially showed mostly the long red morning schedules. We scrolled the real grid to bring the afternoon colors into view, then measured the time axis again before tapping or dragging. The saved schedules and display range stayed the same.

![The landscape iPad card shows several afternoon colors and a clean bezel without a notch](/blog/timetable-appstore-screenshots/ipad-afternoon.png)

Reusing an older frame plan exposed another default: an iPhone notch appeared on the iPad. It came from the compositor, not the app capture. When Dynamic Island is absent, the compositor enables its legacy iPhone notch unless the plan explicitly disables it. A landscape canvas and an iPad device name did not override that choice.

Every iPad frame now sets `notch: false`. We also inspect the top-center bezel at full size, because a successful render and a reduced contact sheet can both hide the mistake. Reused plans need their hardware settings checked again.

The approved Korean composition now has real app captures in all eight languages. We also set the simulator's system language for each run, because app launch arguments alone do not localize the date in the status bar. All 80 selected originals have the expected scene names and resolution. Store publication is checked separately after upload.

Two captures exposed a second output route. Normal screenshots read the folder configured by the test. Background captures taken while a finger remains held bypassed that setting and wrote directly to a shared cache. The English tests passed, yet two planned images were absent from the isolated output folder.

Trying to override `SIMULATOR_HOST_HOME` through the test runner did not replace the system's existing path. An explicit capture directory fixed the mismatch: both normal and mid-gesture writers now use it. We repeated only the two affected English tests, which passed in 99 seconds, and checked the new PNGs' timestamps and dimensions.

Completion now requires the actual ten selected files for every language, alongside the test result. Even the recovery log needed care: a single test is reported as `1 test`, while a full run uses `tests`. A passing test proves the interaction ran; the image manifest proves the deliverable exists.

## History

- 2026-09-29 — Added the iPhone panorama, continuous feature backgrounds, and drag capture notes.
- 2026-10-01 — Verified the iPad viewport, notch default, and gesture capture output route across eight languages.
