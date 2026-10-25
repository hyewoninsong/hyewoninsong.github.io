---
title: "Play search results were cutting the first letter off our feature graphic"
date: 2026-10-25T18:45:00+09:00
app: "timetable"
tags: ["devlog", "android", "appstore"]
summary: "The feature graphic is uploaded at 1024×500, but Play center-crops it per placement. Search cards are 16:9, so 67px vanish on each side. Text now starts further in and the bars sit inside the crop."
---

Search for SuperTimetable on Google Play and the feature graphic sits large above the app card. We had just redrawn it as the same 3D bar scene the App Store cover uses. In the real search result the icon and the first glyph of the headline were cut off on the left, and the blue bar was clipped at the right edge. The file was exactly 1024×500. Play simply does not show the file as uploaded.

## The uploaded ratio is not the displayed ratio

![Search result card with the icon and first headline glyph cut off on the left](/blog/timetable-play-feature-graphic-crop/search-card-cut.png)

The spec is 1024×500, about 2.05:1. Measure the search card and it is 16:9. Play crops the image **from the center** to whatever ratio a placement needs. At 16:9 only the middle 889px of the 1024 are visible, so 67px disappear on each side. Third-party guides say featured placements go down to 4:3, which is 178px per side.

Google's own guidance gives no pixel values. It says to keep the focal point centered and key elements out of the edge zones, and that ignoring this can make the app ineligible for those placements. Our scene reused the iOS cover's margin and started the text 60px from the left. That is inside the 67px that vanish.

## Text outside the 4:3 crop, bars inside the 16:9 crop

![After the fix, cropped to 16:9: icon, text and all five bars are visible](/blog/timetable-play-feature-graphic-crop/search-card-fixed.png)

Two rules now:

- Icon, app name, caption and headline start **outside the 4:3 crop**, at least 190px from the left. The text survives every placement.
- The five hero bars and the scattered bars and dots stay **inside 16:9**. The cluster moved toward the center and shrank a little, and the pink, sky and yellow bars that hung on the right edge moved in.

The gap between text and bars got smaller, and the text width cap shrank with it so long lines like the French caption still clear the bars.

![The full 1024×500 source: the outer 67px on each side hold only decoration](/blog/timetable-play-feature-graphic-crop/full-graphic.png)

## Why the bars do not fit 4:3 too

At 4:3 the right side of the bar cluster is still clipped. Fitting it would mean shrinking the bars a lot, and then the graphic would stop matching the first store screenshot, which shows the same scene. Featured placements are rare and the bars are decoration, so we accepted that. Moving only the text and leaving the bars was the other option; that keeps the blue bar clipped in every search result.

## Crop it before uploading

Nothing in the file reveals this. The metadata check passes and the render script exits cleanly. The render step now writes 16:9 and 4:3 center crops with `sips -c` to look at, and the Play Console preview gets a final check before the upload. The store-asset checklist also says, in so many words, not to reuse the iOS cover margin on the Android feature graphic.

## History

- 2026-10-25 — text and bars repositioned for the 16:9 search-card crop
