---
title: "Putting a timetable on the Lock Screen, when the app can't know where the clock is"
date: 2026-10-07T02:44:40+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "A Lock Screen wallpaper export. The clock, widgets and notifications can't be avoided precisely, so it starts in a safe band and lets you drag. The canvas isn't shrunk — only the hour rows get shorter. Now for any device, over a photo you can pinch into place, and in iPad landscape. The chips that pick what you drag sit outside the collapsible options."
---

SuperTimetable's `…` menu now has "Lock Screen Wallpaper". It produces an image exactly the size of your screen; save it to Photos, set it as wallpaper, and this week's timetable is there before you unlock. It's free. Three decisions shaped it; the last one was reversed a day later.

## The app cannot know where the clock is

The Lock Screen layout belongs to the system, not the app. Users resize the clock (iOS 17+), the widget row may or may not exist, iOS 26 can move widgets to the bottom, and notifications stack up from below. None of it is queryable.

So instead of "avoid it exactly":

- **Start in a safe band.** Measured on device: clock bottom at 28% of screen height, widget row bottom at 37.5%, flashlight/camera top at 87.5% (88% at first; re-measured later). The default assumes widgets exist.
- **Let the user drag.** The preview is one phone-shaped frame with a translucent silhouette of the date, clock, four widget squares and the two bottom circles. Drag it and the timetable card moves vertically. The silhouette never ends up in the exported image.

![Default — the card sits in the band below the widget row](/blog/timetable-lock-screen-wallpaper/sheet-default.png)

A widgets chip (yes / no at first, now top / bottom / none — see the last 2026-10-05 section) moves the band's top edge up to just below the clock.

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

**Photo adjustment is a mode.** One-finger drag on the preview moves the timetable card. A pinch is unambiguously the photo, but a single-finger drag is used by both, so one gesture can't tell them apart. A control picks what the drag moves: choose the photo and pinch scales (1–4×), drag moves, the card goes translucent and the footnote turns into instructions. "Reset" puts it back. Because the mode is a button, there's no flipping a gesture mask on an in-flight gesture. (This control started as an "Adjust Photo" row inside the options card; see the 2026-10-05 section below for where it lives now.)

Two images back it. The **cropped** one is what gets composed; an **uncropped fill** image — the photo scaled so its short side meets the screen, about 13 MB on a 3× iPhone — is what the preview moves during the gesture. On release the original is re-cropped with the final zoom and offset. Both read one set of formulas (fill size, draw rect, clamp so the screen stays covered), so nothing jumps when you let go. The test uses a half-red, half-blue image: push it all the way right and the screen must show red; zoom 3× and the centre must stay put.

**Background colour reuses the event colour popover.** Flat backgrounds were light grey or black. Rather than a new palette, the same popover that picks an event's colour opens from a colour circle in a "Background Color" row — the 20 basics, the user's custom colours, and the colours already used in this timetable (that "In Use" row was removed on October 6 — see below). Colour only, no title; drawn opaque because wallpaper bitmaps have no alpha. The popover has no "none", so a "Default" text button appears only while a colour is chosen. The clock silhouette picks white or black from the chosen colour's luminance.

**A shadow under the card, over photos only.** A white card vanished against sky and snow. Over a photo the card now gets a shadow — black at 35%, 16pt blur, 6pt down. Flat colours stay as designed. One mistake on the way: `CGContext.setShadow` takes its offset in device space, so it's multiplied by the scale, and inside a UIKit renderer **positive is down**. The first build used a negative offset on the "flipped coordinates" theory; the pixel test caught it at once — 195 three points above the card, 246 three points below. The shadow was falling upward. The test now pins the direction.

**iPad landscape.** Yesterday's "portrait only" is reversed. In landscape the iPad Lock Screen puts the clock and date top-left, widgets below them in the left column, notifications on the right, and has no flashlight/camera buttons. Reusing the portrait band would put the card on the clock. So in landscape the **card zone is the right half** (card centred in it, still capped at 420pt wide), the band runs from below the status bar (10% of height) to above the home indicator (92%), and the widgets toggle doesn't affect it. Orientation isn't a flag; width greater than height is landscape, and because fitting, composing and the preview ratio all read only the screen size, they handled landscape untouched. An "Orientation" chip row appears under Device only for iPad devices, and it starts in landscape when the iPad window is landscape.

Two small ones: the preview frame's corner radius was a fixed 48pt, which lied once you could pick an iPhone SE or a home-button iPad — the device list now carries each screen's radius (62 for the 17 line, 55 for 16/15, 0 for home-button devices, 18 for iPads). And the "Saved to Photos" alert gained an **Open Photos** button via `photos-redirect://`, since the next step is always the Photos app.

The menu row moved from right under Share to **below Free Time**: share, print, calendar and free time are weekly paths; the wallpaper is set up once a term.

No screenshots this time — five other simulators were running on the machine and boots took twenty minutes, so verification stopped at unit tests. Shadow strength, the landscape band ratios and the pinch feel will be tuned on a device.

## 2026-10-05 — For the foldable, only the cover screen

iPhone Duo is now in the device list — as one entry, the cover screen. The wallpaper exists so you can glance at your week without opening the phone, and a closed phone only shows the cover screen. Open it and Face ID unlocks straight into the app.

A second entry for the inner screen lost: the same device twice in the list, and an inner screen that rotates, which would mean reopening landscape Lock Screens (iPad-only today) for an iPhone.

Ignoring the inner screen entirely breaks something else, though. "This device" is matched by screen pixel size, and with the phone open the system reports the inner screen — an unknown size, so the default would become a nameless "iPhone" entry. The inner size is therefore stored on the cover-screen entry as an alias. Whichever screen you open the sheet on, "My device" is the cover screen.

The device isn't out yet, so the numbers come from the simulator.

| Measured | How | Value |
|---|---|---|
| Cover screen | simulator display list | 1398×2034 px at 3x (466×678 pt) |
| Corners | rasterised the simulator's screen mask PDF, distance to the first opaque pixel | about 7 pt on the hinge side, about 62 pt outside |
| Clock bottom | cover Lock Screen capture | about 0.24 of the height |

![iPhone Duo cover Lock Screen — date and clock sit left of centre, camera cutout top right](/blog/timetable-lock-screen-wallpaper/duo-outer-lock-screen.png)

The band ratios (0.28 under the clock, 0.88 above the buttons) were measured on tall iPhones; the cover screen is much squatter. The clock turned out to end at 0.24, inside the existing 0.28, so the ratios stay.

Corners could not be one number: the hinge side is nearly square, the outside is round. The preview frame now takes a separate hinge radius and draws an `UnevenRoundedRectangle`.

![The wallpaper sheet on iPhone Duo — the preview frame is square on the left, round on the right](/blog/timetable-lock-screen-wallpaper/duo-sheet-preview.png)

One thing is unmeasured: the simulator's Lock Screen draws no flashlight or camera buttons, so the bottom of the band is unverified. And on a screen this short, a 08–20 timetable with title and widget row overflows the band slightly; turning the widget row off fits it. Both get rechecked on real hardware.

## 2026-10-05 — Collapsing the options made the preview grow "left to right"

Collapsing the options panel makes the preview bigger. It was supposed to grow from the centre; it looked like it unrolled from the left. Stretching the 0.3 s transition to 4 s and capturing the middle showed why.

![Before, mid-collapse — the frame is still narrow but the contents are already at full scale, so only the clock's "9" and one and a half widgets show](/blog/timetable-lock-screen-wallpaper/collapse-mid-before.png)

The phone-shaped frame was fine: centred, growing as the panel height eased. The contents weren't. Clock, widgets and the timetable card are positioned by a scale derived from measuring that frame with `onGeometryChange`, which never reports in-between values — it delivers the final size once, when the transition starts. So the contents jumped to full scale on frame one, pinned to the frame's top-left, and the growing clip revealed them from the left.

We had met this before on the print sheet and the fix was already in place for the panel height. What was missed is the second measurement, taken inside the stage that the first one sizes. Fixing only the source leaves the next measurement down the chain to snap the same way — and with top-leading contents inside a clip, it gets reported as "wrong direction", not "it jumps".

The fix is to apply the same curve where the frame size is received, skipping it for the very first measurement.

![After, same moment — clock, widgets and card scaled with the frame, centred](/blog/timetable-lock-screen-wallpaper/collapse-mid-after.png)

One more thing: dragging the preview is the point of this sheet, but the only explanation sat in small print under the options, and the options panel opens collapsed. There is now a "Drag to reposition" capsule on the card. It disappears on the first drag, is never in the saved image, and shrinks to just the arrow when the preview gets too narrow for the text. (Opening the options used to shrink the preview that far on an iPhone; that changed the same afternoon — see the last section.)

![The sheet opens with a "drag to reposition" capsule on the card](/blog/timetable-lock-screen-wallpaper/drag-hint.png)

## 2026-10-05 — If your widgets sit at the bottom, neither chip was right

The first post noted that iOS 26 can move the widget row to the bottom, and waved it off as something you could drag around. On a phone actually set up that way it isn't. "Yes" drew widget squares under the clock where there were none and pushed the card down; "no" started the card in the right place but let it run all the way to the flashlight and camera buttons, straight through the real widget row. Dragging fixes position, not **height**: hour rows are sized from the band, and a band that doesn't know about bottom widgets produces a card that's too tall.

The chip is now **top / bottom / none** — it asks where the widgets are, not whether they exist.

| Chip | Band top | Band bottom |
|---|---|---|
| Top (default) | below the widget row (37.5%) | above flashlight/camera (87.5%) |
| Bottom | below the clock (28%) | above the bottom widget row (78%) |
| None | below the clock (28%) | above flashlight/camera (87.5%) |

Top and bottom give the same band length, shifted up by one widget row. The silhouette's squares move with it. iPad landscape is unaffected; widgets live in the left column there.

A separate "position" row under the old chip lost: it would sit dead whenever widgets are off, and one three-way chip says the same thing.

The bottom row's top edge started as an estimate — the button line minus one widget row's height. It was checked against a real Lock Screen capture the same day (78.2%, see below). No screenshot this time either: the simulator wouldn't stay up.

## 2026-10-05 — Controls you use while looking at the preview don't belong in the collapsible options

Adjusting the photo meant expanding the options, tapping "Adjust Photo", and collapsing them again. The panel opens collapsed, and expanded it squeezes the preview to about 40pt wide on an iPhone — so the button was reachable only when the result wasn't visible. "Reset" lived in the same place.

Both now sit in one row right above the Save button, and stay there when the options are collapsed.

![The adjust row under the collapsed options: Timetable chip selected, Reset dimmed](/blog/timetable-lock-screen-wallpaper/adjust-bar-timetable.png)

![Photo chip selected and the photo zoomed: the card is translucent and Reset is active](/blog/timetable-lock-screen-wallpaper/adjust-bar-photo.png)

| Control | What it does |
|---|---|
| **Timetable** chip | Drag moves the timetable card up and down |
| **Photo** chip | Pinch to zoom, drag to move the photo; the card goes translucent |
| **Reset** | Resets only the selected one — photo to 1× centred, timetable to its starting position |

The row appears only with a photo background; with a solid colour there is just one thing to drag.

Two chips replaced a single toggle whose label flipped between "Adjust Photo" and "Done Adjusting" — you had to read it to know what a drag would move. Floating the buttons over the preview lost: they would cover the surface you drag and pinch on. And Reset follows the selected chip, which is how the timetable got a reset too. When there is nothing to reset it dims instead of disappearing, so the chips don't shift.

Still open: the pinch-and-drag instructions live in the options footnote, so they're hidden while collapsed.

## 2026-10-05 — Opening the options no longer shrinks the preview

The same afternoon: "the preview shouldn't change size just because I opened the options. Keep it, and let the open panel cover it."

The morning's fix was about *how* the preview grew and shrank. This one removes the growing and shrinking. The stage now leaves room only for the collapsed panel — the handle and the Save to Photos button — and the expanded options slide up over the lower part of the preview.

![Options collapsed — the preview fills the stage](/blog/timetable-lock-screen-wallpaper/options-collapsed.png)

![Options expanded — the preview is the same size in the same place, with the panel over it](/blog/timetable-lock-screen-wallpaper/options-expanded-over-preview.png)

The print and share sheets still give the stage whatever the panel gives up. They differ because of what the preview is: print can be zoomed and panned, share scrolls, so a smaller stage leaves the picture at its size. The Lock Screen preview is one phone screen fitted whole into the stage, so a smaller stage shrinks all of it — about 40pt wide on an iPhone with the options open.

The collapsed height is the handle (a constant 28pt) plus the measured button block. Subtracting the options list from the measured panel height wobbled mid-animation, and remembering the height "while collapsed" has nothing to remember when an iPad window rotates into this layout already expanded.

Anything you do directly on the preview — dragging the card, fitting the photo — moved out of the collapsible options in the previous section, so it is done with the panel collapsed. Once that adjust row is in, the collapsed height gains one more row.

## 2026-10-05 — The clock guide didn't match the real Lock Screen

The preview carries a faint date, a clock (a fixed 9:41 at this point, the current time since October 6), four widget squares and two circles for the flashlight and camera. None of it is in the exported image; it only shows where the system will draw things so you can drag the card clear. That guide was wrong.

How we found out was the useful part. A tester put a screenshot of their actual Lock Screen in as the background photo. Same device, same aspect ratio — so the real clock in the photo and our drawn clock sat in one image, on top of each other. Nothing lined up.

| | Real (share of screen height) | What we drew |
|---|---|---|
| Date | centred at 10.3%, short weekday | 11.5%, full weekday |
| Clock digits | 13.5% – 23.2% | 16.5% – 24.3% |
| Bottom widget row | top at 78.2%, spanning 8.5% – 91.5% of the width | top at 78.5%, bunched in the middle |
| Flashlight / camera | 87.5% – 94.5% | centred at 93.5%, smaller |

That capture was also the ruler: find the preview's edges, derive its height from the screen ratio, draw a line every 1% and read the enlarged crop. Error is within half a percent. Drawing the corrected values back onto the same capture put them on the real clock, widgets and buttons.

Three things changed: the guide now uses the measured values, the date uses the short weekday, and the flashlight/camera line moved from 88% to 87.5% — the only one that changes the exported image, by 4pt.

The 78.5% that the section above called an estimate measured at 78.2%. The number derived by subtraction held up; the ones typed in by eye did not. They now live as named values that both the guide and the band read, with a test pinning them to the measured table. Still unmeasured: widgets at the top, iPad landscape, other screen sizes.

## 2026-10-05 — Ratios measured on one phone were only right on that phone

Everything fixed in the previous section was "a share of screen height", measured on one device. To see whether it held elsewhere, we captured the simulator's Lock Screen on twelve iPhones and four iPads.

It doesn't. **The date and clock sit a fixed distance from the top**, not at a ratio. The date is about 21pt tall everywhere, and the gap from date to clock is 32.5pt on every iPhone. What moves is where that block starts, and it follows the device generation rather than the screen size.

| | Screen height | Clock bottom | If scaled by ratio |
|---|---|---|---|
| iPhone 16 | 852 | 198 | 198 |
| iPhone 17 Pro Max | 956 | 207 | 222 |
| iPhone 14 Plus | 926 | 229 | 215 |

One formula didn't survive either: the 13 mini and 11 Pro share a 375pt width and have different clock heights. So it is a table. Each entry in the device list carries its date centre, clock top and clock bottom, and both the safe band and the preview guide read them. Screens not in the table fall back to the old ratios.

![Left: the guide in the preview. Right: the same device's real Lock Screen — date and clock at the same height](/blog/timetable-lock-screen-wallpaper/guide-vs-real-14-plus.png)

Capturing the simulator's Lock Screen takes a UI test: press the lock button (`pressLockButton`), press Home once to wake the display, screenshot.

The simulator draws no flashlight, camera or widgets, so the bottom of the iPhone layout is the one real measurement restated as "points from the bottom edge" — an estimate, and labelled as one. iPad was measured from a real device's edit screen and is not a big iPhone: no flashlight or camera at all, and widgets sit in a narrow centred box.

Two options were built or scoped the same day and dropped. A clock-size control (iOS 26 lets the clock stretch past half the screen) — a big clock and a timetable don't belong on the same Lock Screen. And a bottom-buttons on/off chip — removing the buttons leaves the bottom widget row where it was, so the gain is 60pt. Only what moves the band a lot (widgets top or bottom) is a choice; the rest is fixed on the safe side and left to dragging.

iPad landscape is untouched. Without widgets the clock stays top-centre, not top-left as the guide draws it; with widgets they move to a left column, and where the clock goes then still needs a real capture.

## 2026-10-05 — The pinch engaged late, then the photo jumped

Spreading two fingers on the photo did nothing for a moment, then the photo grew in one frame before it started following. Lag and a jump look like two bugs; they were one.

`MagnificationGesture` reports scale relative to the finger distance **at touch-down**, but it only recognises the pinch after the fingers have moved a little. Whatever spread happened while it was deciding is already in the first value — 1.1 or 1.2, not 1.0. We multiplied that straight into the starting zoom, so the whole wait landed in the first frame. On a scaled-down preview fingers start close together, which makes it worse: at 40pt apart, 8pt of movement is 20%.

The fix is a baseline. Remember the first value the recogniser reports and divide every later value by it, so the moment of recognition is exactly the current zoom. The spread before recognition is dropped, as system zoom does.

- **No catch-up animation.** Easing the backlog in would soften the jump but leave the photo moving at a different speed from the fingers.
- **A zero threshold isn't enough.** `minimumScaleDelta: 0` engages slightly sooner; the recogniser's own decision time remains.
- The baseline is cleared on release, and also when the drag target is switched mid-pinch, where no end event arrives.

Why it slipped: pinch feel had been deferred to a device, and tests covered the math after the scale arrives, not where the recogniser's zero sits. Two-finger input still wasn't run in the simulator this time; only the math is under test. The print preview had the same structure and got the same fix.

**Zoom now centres between the fingers.** It used to centre on the photo, so enlarging a corner meant zooming and then dragging it back. That makes the pinch write the offset as well as the scale — the same value the drag writes — so both now add only the change since their previous value instead of recomputing from the start. At this point drag changes were ignored once a pinch was active, because we couldn't confirm which point the drag follows with two fingers down. That rule was removed on 2026-10-07 (see below); moving both fingers while zooming now works.

## 2026-10-06 — Dragging the photo past its edge resists instead of stopping

Drag the photo until its edge would come inside the screen and it no longer stops dead. It follows at about half speed, gets heavier, and springs back to cover the screen when you let go. The zoomed print preview does the same.

The two screens started from opposite places: the Lock Screen photo hit a wall, while the print preview slid out with no resistance at all and snapped back on release. Both now use the system scroll view's curve — past the limit by `x`, the picture moves `(1 − 1/(x·0.55/d + 1))·d`, where `d` is the container length on that axis.

**The catch was that drags are read as steps.** Drag and pinch both edit the same offset, so each reads the difference from its previous value. But rubber-banding is a function of how far the finger went. Add a step to the already-compressed value and the resistance compounds: one 60pt drag and three 20pt drags land in different places, and dragging back outruns the finger.

The fix is to invert the curve each step — recover the finger's position from the displayed one, add the step, compress again. The inverse is closed-form, so one stored value is enough.

- A separate "uncompressed" state lost: pinch edits the same offset, and two copies overwrite each other.
- Scaling each step by the local slope lost: at full stretch the slope is zero, so the photo would not come back either.
- The inverse is capped at 90% of the container length; beyond that the finger position runs to infinity.

One more case: with the photo pulled past its edge, a second finger landing made the pinch's hard clamp erase the overshoot in one frame. Pinch now sets the overshoot aside and puts it back; it is released once, on lift.

The saved image is unchanged — compositing still reads the hard limit only. Feel on a real device is unverified; the math is pinned by tests.

## 2026-10-06 — See it at real size before saving

There's now a full-screen preview button at the top right of the sheet, next to Share. It shows the clock and widget guide and the timetable card across the whole screen. When you're making a wallpaper for the device in your hand, the scale is exactly 1 — the size it will have on the Lock Screen.

![The wallpaper sheet — a two-arrow full-screen button sits left of Share at the top right](/blog/timetable-lock-screen-wallpaper/fullscreen-button.png)

The preview inside the sheet is one image scaled to fit, about two thirds of real size on an iPhone. That is enough to see whether the card clears the clock, but not whether subject names read at arm's length. Until now the first real-size look came after saving and setting the wallpaper in Photos.

![Full-screen preview — date, clock and widget guide plus the card fill the screen, with a brief "Tap to close" at the bottom](/blog/timetable-lock-screen-wallpaper/fullscreen-preview.png)

The screen is view-only. Tap anywhere to close; the hint fades after 2.5 seconds. The status bar is hidden so the status bar time doesn't sit on top of the guide clock. For another device, its screen is fitted on black at its own proportions.

What lost:

- **Showing the exported image itself** — pixel-exact, but without the clock and widgets, which are the point.
- **Dragging in full screen** — tap-to-close and drag would share one surface, without the chips that choose what you drag.
- **A close button** — something the real Lock Screen doesn't have, covering the preview.
- **Folding Share into a menu** — it would put Share one tap further away.

Both the sheet preview and the full-screen view draw through the same function, so they can't drift apart. Only the helper elements, like the drag hint, are left out in full screen.

## 2026-10-06 — Change the background from the corner of the preview

Changing the background colour or swapping the photo meant opening the collapsed options and finding the right row. Now a small tile at the bottom left of the preview always shows the current background: the colour, or the photo. Tap it and a flat colour opens the colour popover; a photo opens the picker for a different one. It is the same idea as the photo thumbnail in the iOS Lock Screen editor.

![A tile next to the flashlight guide at the bottom left shows the current background — here after picking green](/blog/timetable-lock-screen-wallpaper/background-thumbnail.png)

**The position couldn't copy iOS.** iOS puts the thumbnail above the flashlight button. Our card fills everything from under the clock down to the buttons, so in that spot the tile covered the "19:00" and "20:00" labels on the time axis. The preview is how you judge the result, so it moved beside the flashlight, on the button row, which is outside the band the card sits in by default. (It moved again the next day and now sits outside the preview image — see October 7 below.)

![The first position — the tile covers the time labels at the bottom left of the card](/blog/timetable-lock-screen-wallpaper/thumbnail-over-time-axis.png)

**The colour popover lost its "In Use" row.** On October 4 it reused the event colour popover as is: titled "Choose Style", with a row of this timetable's events on top. That row applies an event's title and colour together, and a background has no title, so the screen read as if it did something else. The same popover now has a colour-only mode: the title is "Background Color", and only the 20 basics and the user's custom colours remain. It is shorter by that row. It is still one palette, not two, so adding, editing and reordering colours can't drift apart.

![Background colour popover — only the Basic and Custom tabs, no event row](/blog/timetable-lock-screen-wallpaper/background-color-popover.png)

The rows inside the options stay. On iPhone the expanded panel covers the lower part of the preview, tile included, and the "Default" reset lives only in that row.

**The guide clock shows the current time.** The date was today's but the clock was a fixed 9:41, which looked odd at real size in the full-screen preview. It redraws each minute and, like the real Lock Screen, shows hours and minutes without AM/PM. 12- or 24-hour follows the device setting, not the sheet's time format chip, which belongs to the card's time axis.

One snag: the tile's accessibility identifier was invisible to UI tests, because the identifier on the preview container overrode its children's. The tile is now layered after that identifier, and a contract test pins the order.

## 2026-10-07 — Lift one finger mid-pinch and the other one drags

Pinch the photo, lift one finger, move the other: the photo used to keep zooming in and out instead of following. Photos and Maps switch to a drag at that moment and resume the pinch when the finger returns. Now this does too, and so does the print preview, which had the same problem.

| Fingers down | What happens |
|---|---|
| One | Drag |
| Two | Follows the midpoint and zooms around it |
| Two → one | Becomes a drag where it is |
| One → two | Becomes a pinch where it is |

**The pinch recogniser doesn't say how many fingers are down.** `MagnifyGesture` reports a scale and a start location, and it does not end when one finger lifts — the remaining finger keeps changing the scale. Our own rule was "ignore drag changes while a pinch is active", so that finger could only zoom. The two earlier fixes were built on that rule without asking whether it held with one finger left.

**So the amounts now come from the touch positions.** A passive layer sits under the preview: a recogniser on the window that never succeeds and takes no touches. It tracks the fingers that started inside the preview, and a small pure function turns positions into steps — translation for one finger, midpoint translation plus distance ratio for two. On the frame a finger lands or lifts it only re-bases; otherwise the midpoint's jump to the remaining finger would read as a drag.

The SwiftUI gestures stay, but only as a gate. They no longer supply values; they say whether the preview owns the touch. That keeps the existing arbitration — a one-finger drag before zooming still dismisses the print sheet, buttons over the preview still get their taps. Steps are applied only while the gesture is live.

Two alternatives lost. Replacing everything with UIKit pinch and pan recognisers gives the finger count for free but means rebuilding that arbitration, which has killed the print preview's pinch once before. Keeping SwiftUI's values and only peeking at the finger count fails because we can't tell which point the drag follows with one finger left.

Two things came along: moving both fingers while zooming now works, and the zoom centre is where the fingers are now, not where the pinch started. The first-value baseline from the earlier section is no longer needed.

Verification is partial. Neither the simulator nor UI tests can lift just one of two fingers, so the step function is unit-tested through pinch → lift one → drag → touch again, and a simulator run on the print preview confirmed pinch and drag still behave as before. The feel of lifting and re-touching is left for a device.

## 2026-10-07 — The tile leaves the image, and full screen loses its rounded corners

The background tile no longer sits on the preview. It is now outside the image, at its bottom left. Next to the flashlight guide it covered no text, but it was still on a picture whose job is to show the result, and a button that is not in the result reads like one more Lock Screen element. Only the result and the guide stay on the image; controls go outside.

![The background tile sits outside the preview image, level with its bottom edge](/blog/timetable-lock-screen-wallpaper/thumbnail-outside-preview.png)

A portrait phone preview leaves empty strips at the sides, but a landscape or iPad screen fills the width. So the side margin went from 12pt to 64pt on both sides, which always leaves a gutter for the 44pt tile and keeps the image centred.

**Full-screen preview is a plain rectangle.** It used to be clipped to the chosen device's corner shape, so while the cover slid up, black showed in the corners between the rounded image and the square cover. On your own device the screen already rounds the corners. The letterbox for other devices is unchanged.

## History

- 2026-10-03 — first version: safe band + drag, shorter rows, save via share sheet
- 2026-10-04 — Save to Photos button and photo add permission; share becomes secondary
- 2026-10-04 — Device dropdown (defaults to this device, matched by screen pixels) + photo background (`PhotosPicker`, no read permission)
- 2026-10-04 — Pinch/drag photo adjustment, background colour via the style popover, card shadow over photos (positive offset is down), iPad landscape, per-device corner radius, Open Photos, menu row moved — six PRs
- 2026-10-05 — iPhone Duo in the device list: cover screen only, inner screen as an alias, square hinge-side corners
- 2026-10-05 — Preview grows from the centre when options collapse (same curve on the second measurement); drag hint on the card
- 2026-10-05 — Widgets chip becomes top / bottom / none: bottom widgets trim the band's lower edge (78.5% is an estimate)
- 2026-10-05 — Drag-target chips (Timetable | Photo) and Reset moved out of the collapsible options into a row above Save; Reset applies to the selected one
- 2026-10-05 — Preview keeps its scale when options expand: the stage only clears the collapsed panel, the open panel covers the rest
- 2026-10-05 — Clock, widget and button guide now uses values measured from a real Lock Screen capture; button line 88% → 87.5%; short weekday in the date
- 2026-10-05 — Band and guide move from screen ratios to a per-device measured table (12 iPhones, 5 iPads, simulator Lock Screen captures); no flashlight/camera on iPad; clock-size and bottom-button options left out
- 2026-10-05 — Photo pinch no longer jumps at the start: later values are divided by the recogniser's first reported scale; zoom centres between the fingers (print preview too)
- 2026-10-06 — Photo drag (and print preview pan) rubber-bands past the edge and springs back: each step inverts the curve to recover the finger position
- 2026-10-06 — Full-screen preview button at the top right: guide and card at real size, view-only, tap to close, same drawing function as the sheet preview
- 2026-10-06 — Background tile at the bottom left of the preview (flat colour opens the colour popover, photo opens the picker); "In Use" row removed from the colour popover; guide clock shows the current time
- 2026-10-07 — Lifting one finger mid-pinch becomes a drag, touching again resumes the pinch (print preview too): amounts come from touch positions, SwiftUI gestures only arbitrate; two-finger move while zooming
- 2026-10-07 — Background tile moved outside the preview image, bottom left (side margins 12 → 64pt); full-screen preview is no longer clipped to the device corners
