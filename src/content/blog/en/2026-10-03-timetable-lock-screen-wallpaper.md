---
title: "Putting a timetable on the Lock Screen, when the app can't know where the clock is"
date: 2026-10-03T20:15:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "A Lock Screen wallpaper export. The clock, widgets and notifications can't be avoided precisely, so it starts in a safe band and lets you drag. The canvas isn't shrunk — only the hour rows get shorter."
---

SuperTimetable's `…` menu now has "Lock Screen Wallpaper". It produces an image exactly the size of your screen; save it to Photos, set it as wallpaper, and this week's timetable is there before you unlock. It's free. Three decisions shaped it.

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

## Saving goes through the share sheet

iOS apps can't set wallpaper. A dedicated "Save to Photos" button would need the photo-library add permission — eight localized prompts plus denial handling. The existing share sheet already has "Save Image" (and AirDrop), so the wallpaper goes there, with one line underneath: save it, then set it as wallpaper in Photos.

Calendar export is premium; this stays free. Lock Screen screenshots travel, and that's marketing.

## What's left

iPad landscape puts the clock on the left — portrait only for now. Whether the dragged position should be remembered next time is undecided; today it always starts at the band's top edge.
