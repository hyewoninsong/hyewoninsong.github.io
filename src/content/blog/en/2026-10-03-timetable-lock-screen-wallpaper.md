---
title: "Putting a timetable on the Lock Screen, when the app can't know where the clock is"
date: 2026-10-04T14:05:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "A Lock Screen wallpaper export. The clock, widgets and notifications can't be avoided precisely, so it starts in a safe band and lets you drag. The canvas isn't shrunk — only the hour rows get shorter. Now for any device, over a photo you can pinch into place, and in iPad landscape."
---

SuperTimetable's `…` menu now has "Lock Screen Wallpaper". It produces an image exactly the size of your screen; save it to Photos, set it as wallpaper, and this week's timetable is there before you unlock. It's free. Three decisions shaped it; the last one was reversed a day later.

## The app cannot know where the clock is

The Lock Screen layout belongs to the system, not the app. Users resize the clock (iOS 17+), the widget row may or may not exist, iOS 26 can move widgets to the bottom, and notifications stack up from below. None of it is queryable.

So instead of "avoid it exactly":

- **Start in a safe band.** Measured on device: clock bottom at 28% of screen height, widget row bottom at 37.5%, flashlight/camera top at 88%. The default assumes widgets exist.
- **Let the user drag.** The preview is one phone-shaped frame with a translucent silhouette of the date, clock, four widget squares and the two bottom circles. Drag it and the timetable card moves vertically. The silhouette never ends up in the exported image.

![Default — the card sits in the band below the widget row](/blog/timetable-lock-screen-wallpaper/sheet-default.png)

A "Widgets: yes / no" chip moves the band's top edge up to just below the clock.

![Widgets off — the band starts under the clock and the hour rows grow](/blog/timetable-lock-screen-wallpaper/widgets-off.png)

Presets alone lost: a user with an enlarged clock would match none of them.

## Shorter rows, not a smaller image

The band is about 410pt tall. The share canvas draws one minute as one point, so a 12-hour timetable is ~900pt with its header. Scaling that to fit means 0.45×, and 11pt event titles become 5pt — unreadable at a glance.

Instead the canvas got a *minutes-to-points* parameter. Sharing, printing and list previews keep 1pt/min; the wallpaper uses `(band − chrome) ÷ hours`, clamped to 20–60pt per hour. At 12 hours that's 24pt per row, and a one-hour block still fits an 11pt single-line title.

![Result — dark, one card on black](/blog/timetable-lock-screen-wallpaper/wallpaper-dark.png)

Six places assumed "minutes × 1": axis labels, grid lines, block y and height, overlap hatching, alarm badges, period labels. Miss one and the axis drifts from the blocks. A source-contract test now checks all six.

The output is the device's native pixel size (`UIScreen.nativeBounds`, 1206×2622 on iPhone 17). Anything else and the wallpaper editor crops or stretches, undoing the band.

## The app saves it itself

iOS apps can't set wallpaper, so the path is Photos. The bottom button is "Save to Photos": the image lands in Photos and an alert says how to set it (open it, Share → Use as Wallpaper). Sharing elsewhere moved to the top-right icon. The first version left saving to the share sheet, and that didn't work — see October 4 below.

Calendar export is premium; this stays free. Lock Screen screenshots travel, and that's marketing.

## What's left

iPad landscape puts the clock on the left — portrait only in the first version; landscape followed a day later (see the second October 4 entry). Whether the dragged position should be remembered next time is undecided; today it always starts at the band's top edge.

## 2026-10-04 — "Save Image" in the share sheet is still the app's permission

The day after shipping, the report was simple: it doesn't end up in Photos.

The first version skipped a Save button to avoid the photo-library permission, reasoning that the share sheet's "Save Image" would handle it. It doesn't on your behalf — that save runs in the host app's process, and without `NSPhotoLibraryAddUsageDescription` in `Info.plist` it is blocked. On top of that, the item shared was a PNG file URL, so "Save to Files" showed up first.

The fix: a "Save to Photos" button that asks only for add-only access (`requestAuthorization(for: .addOnly)`) and writes the PNG bytes unchanged with `PHAssetCreationRequest`, plus the usage string in all eight languages — which also fixes "Save Image" in the other share sheets.

![Right after saving — the alert explains how to set it as wallpaper](/blog/timetable-lock-screen-wallpaper/save-to-photos-alert.png)

What would have caught it: checking that a file actually appeared in Photos, not that the share sheet opened. The simulator check now counts the photo library before and after (6 → 7, a 1206×2622 PNG), and a test guards the usage string.

## 2026-10-04 — For a device that isn't this one, and over a photo

Two more things landed the same day. The image only came out at this phone's size, so making one for a family member's phone or an iPad meant opening the app there. And the background was a flat colour only.

**Device is now a dropdown at the top of the options card.** It defaults to the current device with a "This device" tag. The menu lists every device running iOS 26 in iPhone and iPad sections, but far fewer rows than there are models: devices that share a screen panel produce the same image, so they share a row — "iPhone 16 · 15 · 15 Pro · 14 Pro". Pick another device and the preview takes its aspect ratio and the card is re-rendered at its size.

![Device menu — iPhone section, models sharing a screen on one row, the current device checked](/blog/timetable-lock-screen-wallpaper/device-menu.png)

The current device is found by screen, not by model identifier. The wallpaper only cares about native pixels, so `UIScreen.nativeBounds` looks the entry up; an identifier table lags every new device and splits identical screens into separate rows. A screen not in the list gets its own entry built from the live values, so "This device" always exists. It's a dropdown rather than chips because there are 21 entries, and the value shows only the lead name — the sibling list wouldn't fit on one line.

![iPad Pro 13″ selected — iPad proportions, card width still capped at 420pt](/blog/timetable-lock-screen-wallpaper/ipad-selected.png)

**Background is now "Color | Photo".** Photo opens the system picker. `PhotosPicker` runs out of process and hands back only the one picked image, so no read permission is requested — yesterday's add-only permission stays as is. The photo is cropped centre to fill the screen's pixel size exactly and the card goes on top. Changing device re-crops from the original bytes rather than upscaling a reduced copy, and the decode goes through ImageIO thumbnails sized to what the fill needs — a 48 MP original decoded in full is hundreds of megabytes.

![Photo background — the timetable card over a flower photo, with white clock and widget silhouettes](/blog/timetable-lock-screen-wallpaper/photo-background.png)

One thing broke immediately: the clock and widget silhouette was 35% black, fine on a flat colour and invisible over a pink flower bed. Without the clock position there's nothing to drag against. Over a photo it's now drawn white with a shadow, like the real Lock Screen clock.

Rejected: re-tapping the "Photo" chip to re-open the picker (a selected chip doesn't fire again), so a "Change Photo" row appears under it; remembering the device choice (the sheet always starts on this device). Switching back to Color keeps the photo, so choosing Photo again is instant.

## 2026-10-04 — Pinch the photo into place, pick the colour where events get theirs, and iPad landscape

The first question after photo backgrounds shipped: can I zoom and move the photo? No — it was cropped once, centred, and that was it. If the part you cared about landed behind the card, nothing could be done. Six changes went out as six separate PRs.

**Photo adjustment is a mode.** One-finger drag on the preview moves the timetable card. A pinch is unambiguously the photo, but a single-finger drag is used by both, so one gesture can't tell them apart. An **Adjust Photo** row under "Change Photo" switches the preview into photo mode: pinch scales (1–4×), drag moves, the card goes translucent and the footnote turns into instructions. Tap again ("Done Adjusting") to get the card back; "Reset" appears whenever the transform isn't the default. Because the mode is a button, there's no flipping a gesture mask on an in-flight gesture.

Two images back it. The **cropped** one is what gets composed; an **uncropped fill** image — the photo scaled so its short side meets the screen, about 13 MB on a 3× iPhone — is what the preview moves during the gesture. On release the original is re-cropped with the final zoom and offset. Both read one set of formulas (fill size, draw rect, clamp so the screen stays covered), so nothing jumps when you let go. The test uses a half-red, half-blue image: push it all the way right and the screen must show red; zoom 3× and the centre must stay put.

**Background colour reuses the event colour popover.** Flat backgrounds were light grey or black. Rather than a new palette, the same popover that picks an event's colour opens from a colour circle in a "Background Color" row — the 20 basics, the user's custom colours, and the colours already used in this timetable. Colour only, no title; drawn opaque because wallpaper bitmaps have no alpha. The popover has no "none", so a "Default" text button appears only while a colour is chosen. The clock silhouette picks white or black from the chosen colour's luminance.

**A shadow under the card, over photos only.** A white card vanished against sky and snow. Over a photo the card now gets a shadow — black at 35%, 16pt blur, 6pt down. Flat colours stay as designed. One mistake on the way: `CGContext.setShadow` takes its offset in device space, so it's multiplied by the scale, and inside a UIKit renderer **positive is down**. The first build used a negative offset on the "flipped coordinates" theory; the pixel test caught it at once — 195 three points above the card, 246 three points below. The shadow was falling upward. The test now pins the direction.

**iPad landscape.** Yesterday's "portrait only" is reversed. In landscape the iPad Lock Screen puts the clock and date top-left, widgets below them in the left column, notifications on the right, and has no flashlight/camera buttons. Reusing the portrait band would put the card on the clock. So in landscape the **card zone is the right half** (card centred in it, still capped at 420pt wide), the band runs from below the status bar (10% of height) to above the home indicator (92%), and the widgets toggle doesn't affect it. Orientation isn't a flag; width greater than height is landscape, and because fitting, composing and the preview ratio all read only the screen size, they handled landscape untouched. An "Orientation" chip row appears under Device only for iPad devices, and it starts in landscape when the iPad window is landscape.

Two small ones: the preview frame's corner radius was a fixed 48pt, which lied once you could pick an iPhone SE or a home-button iPad — the device list now carries each screen's radius (62 for the 17 line, 55 for 16/15, 0 for home-button devices, 18 for iPads). And the "Saved to Photos" alert gained an **Open Photos** button via `photos-redirect://`, since the next step is always the Photos app.

The menu row moved from right under Share to **below Free Time**: share, print, calendar and free time are weekly paths; the wallpaper is set up once a term.

No screenshots this time — five other simulators were running on the machine and boots took twenty minutes, so verification stopped at unit tests. Shadow strength, the landscape band ratios and the pinch feel will be tuned on a device.

## History

- 2026-10-03 — first version: safe band + drag, shorter rows, save via share sheet
- 2026-10-04 — Save to Photos button and photo add permission; share becomes secondary
- 2026-10-04 — Device dropdown (defaults to this device, matched by screen pixels) + photo background (`PhotosPicker`, no read permission)
- 2026-10-04 — Pinch/drag photo adjustment, background colour via the style popover, card shadow over photos (positive offset is down), iPad landscape, per-device corner radius, Open Photos, menu row moved — six PRs
