---
title: "Putting a timetable on the Lock Screen, when the app can't know where the clock is"
date: 2026-10-04T12:10:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "A Lock Screen wallpaper export. The clock, widgets and notifications can't be avoided precisely, so it starts in a safe band and lets you drag. The canvas isn't shrunk — only the hour rows get shorter. Now for any device, and over a photo."
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

iPad landscape puts the clock on the left — portrait only for now. Whether the dragged position should be remembered next time is undecided; today it always starts at the band's top edge.

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

## History

- 2026-10-03 — first version: safe band + drag, shorter rows, save via share sheet
- 2026-10-04 — Save to Photos button and photo add permission; share becomes secondary
- 2026-10-04 — Device dropdown (defaults to this device, matched by screen pixels) + photo background (`PhotosPicker`, no read permission)
