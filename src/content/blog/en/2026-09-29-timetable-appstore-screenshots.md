---
title: "Ten App Store screenshots that read as one picture"
date: 2026-10-24T05:22:48+09:00
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

## 2026-10-15 — The same cards on the Play Store

The Android listing on Google Play now uses the same cards as the App Store. Backgrounds, captions and highlight colours come straight from the iOS 1.2.0 composition plan; only the phone screens are new, captured from the Android app with the same sample timetables in the same scenes. Because nothing was re-translated, both stores say the same thing in all eight languages. The device frame is a Pixel shape with a centred punch-hole instead of a Dynamic Island.

![Four Play Store cards with Android screens — drag, schedule editor, by time or by period, home screen widget](/blog/timetable-appstore-screenshots/play-android-cards.png)

They could not be uploaded as they were. Play rejects phone screenshots whose long side is more than twice the short side, and the 6.9-inch iPhone cards are 1:2.17. We re-composed them at 9:16 on the same width, lifting captions and phone by 100 px and trimming the same amount off the top of the background — the phone already ran off the bottom edge, so nothing is lost. Play also caps the set at eight, so Batch Edit and Image Share were dropped. The two-card panorama is scaled as one strip with padding only on its outer edges, so the bars still meet at the seam.

The preview video reuses the iOS promo's six scenes, captions and music through the same compositor. Play only accepts a YouTube link, so publishing it is still to do.

Three things went wrong while driving the emulator by coordinates:

- **Long recordings drift.** One 85-second `screenrecord` cut early scenes more than a second too soon and late scenes almost exactly; its variable frame timing drifts against the host clock during the take. Recording each scene separately, fixing it to 30 fps and concatenating gave the same 1.2-second action-to-pixel delay in every scene.
- **A cloned emulator boot-looped.** Copying the AVD folder while the original was running brought along half-written user data. Cloning without it boots cleanly — and a dedicated emulator matters, because on the shared one another job reinstalled the app mid-run.
- **`adb shell input text` is ASCII only.** Titles like 자율학습, 自習 and Étude failed or were remapped by the Korean keyboard; uiautomator2's `set_text` writes into the field directly.

Looking at each language's raw captures side by side caught every one of these. A script exiting with 0 did not mean the scenes were right.

## 2026-10-24 — Ten cards for the folding iPhone

App Store Connect now takes iPhone Duo screenshots — 1398×2034 for the outer display, 2007×2853 for the inner one — and from April 2027 every app built with the iOS 27.1 SDK must have them; uploading earns an "optimized for iPhone Duo" badge. SuperTimetable 1.2.1 ships on that SDK, so the open inner display went up in landscape (2853×2007), ten cards in ten locales.

![Drag card inside an open iPhone Duo — the Saturday art block being dragged](/blog/timetable-appstore-screenshots/duo-drag-card.png)

The set is the iPad set. An open Duo is wide enough for the same shell (the edit popover next to the grid, the print and share sheets with their option column), and its aspect is nearly the iPad card's (1.42 vs 1.33). So captions, backgrounds and order derive from the iPad plan; only the canvas and the bezel change. Re-cutting the iPhone 6.9" cards for a Duo canvas lost: ten new designs for no visible gain.

### The display type is not in the docs

The API's `screenshotDisplayType` enum lists 33 values and no Duo; fastlane's spaceship doesn't know it either, and `deliver` routes by image size, so a 2853×2007 PNG has nowhere to go. What the server really accepts comes out of one bogus `POST /v1/appScreenshotSets`: the 409 body says "Expected one of …" and the list contains `APP_IPHONE_DUO` and `IMESSAGE_APP_IPHONE_DUO`. A 409 creates nothing, so it is a safe probe (a GET filter with a bogus value just returns an empty list). The uploader names the type by hand.

### Five places the capture test died on an open Duo

The iPad XCUITest failed all nine segments on the Duo simulator. Every failure had the same root: two screens.

- Every PNG was black at 2034×1398. `XCUIScreen.main` is the outer display, which is off while the phone is open; the app and the test both live on the inner one. Take every `XCUIScreen.screens` screenshot and keep the largest. The inner capture comes back 2006×2852 with an EXIF rotation — one pixel short of spec, harmless once composited, but a raw upload would need `simctl io screenshot --display=3`.
- Tapping a block twice never opened the editor. Coordinates built from `app.coordinate(withNormalizedOffset:)` land on the app element's screen, the dark outer one; the same offsets built from `app.windows.firstMatch` work. Element `tap()` always worked. On a single-screen device the two origins coincide, which is why nobody had seen it.
- Nothing scrolled the grid. Empty cells, the hour-axis strip, press durations of 0 and 0.1 s, four velocities, six swipes — all zero, while taps and one-second long-press drags work. Rather than dig further, a capture-only launch argument (`-AppStoreInitialScrollHour 13.75`) makes the app start scrolled to the afternoon.
- Picking "10 minutes before" showed the notifications-off alert: the fresh Duo simulator reports AlarmKit as denied without ever prompting, and `simctl privacy` cannot touch it. In capture mode the app now uses a stand-in alarm backend that is always authorized and registers nothing — the card only needs the value.
- The keyboard element outlived the keyboard, so the "keyboard dismissed" assertion failed; the popover also shrinks above the keyboard, so the header row is now measured from the close button instead of a fixed offset.

![Alert card inside an open iPhone Duo — Taekwondo with a 10-minute reminder](/blog/timetable-appstore-screenshots/duo-alarm-card.png)

### A human opens the phone

Posture is a DeviceHub button; neither `simctl` nor XCUITest can change it, and every boot folds the phone again. The iPad driver reboots per locale to switch the system language, which would silently fold the Duo from the second language on. The Duo driver never reboots and passes the language as launch arguments only — none of the ten shots shows system-language UI (the open Duo's status bar is just the time and Wi-Fi). Before each locale it checks that the inner display is lit; a folded Duo returns that display at full size, all black. One Open press, eight languages.

Eight languages × nine segments ran with zero failures; a read-back shows ten `COMPLETE` `APP_IPHONE_DUO` screenshots in all ten locales and the iPhone and iPad sets untouched. Review submission is a separate step.

## History

- 2026-09-29 — Added the iPhone panorama, continuous feature backgrounds, and drag capture notes.
- 2026-10-01 — Verified the iPad viewport, notch default, and gesture capture output route across eight languages.
- 2026-10-15 — Ported the cards to the Play Store as eight 9:16 cards and built the matching promo video from emulator recordings.
- 2026-10-24 — Uploaded ten open-inner-display iPhone Duo cards in ten locales; the hidden `APP_IPHONE_DUO` type and the two-screen capture, coordinate and scroll pitfalls.
