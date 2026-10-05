---
title: "In-app event artwork leaves room for the title the store draws"
date: 2026-10-05T21:40:00+09:00
app: "timetable"
tags: ["devlog", "appstore", "design"]
summary: "Card and detail-page images for three SuperTimetable in-app events — period timetables, free-time matching, lock-screen wallpaper. A week earlier the rule was 'no text in the image because the store overlays the title'. Looking closely at a well-made event from another app reversed it."
---

App Store product pages have an "Events" section next to the screenshots: a landscape card when collapsed, a portrait page when tapped. SuperTimetable shipped three features that deserved one each — period-based timetables, finding free time with friends, and saving the timetable as a lock-screen wallpaper — so each got a card (1920×1080) and a detail page (1080×1920).

The first version, a week earlier, was a gradient with one app screen and no text. The store overlays the event title and description on the image, so any text in the image would collide with it. That reasoning turned out to be half right.

## The store only draws in two places

I opened an app that uses events well, captured its collapsed card and expanded page, and measured where the store's text actually lands.

| Surface | What the store overlays | What the image may use |
|---|---|---|
| Collapsed card (16:9) | Badge, title, one-line description at the bottom left, over a gradient on the lower third | Top left and the whole right side |
| Expanded page (9:16) | "Available now" badge top left, close button top right, title and description on the lower third | From ~200px down to the top of the lower third |

So text is fine — it just has to avoid those zones. The reference app put its own headline large at the top of the page, fanned several phones across the middle, and kept the bottom light so the store's title could sit on it.

![Period timetable event card — headline top left, two phones on the right, bottom left kept clear](/blog/timetable-appstore-events/period-card.png)

The card now has the headline top left, two black-bezel phones on the right bleeding off the bottom, and nothing in the lower-left third. The page has the headline centered near the top, phones below it running off the bottom, and the last 600px fading to the ground color.

![Lock-screen wallpaper event page — headline, phone, fade](/blog/timetable-appstore-events/lockscreen-details.png)

## The headline in the image must not repeat the event title

Once text was allowed, the next problem showed up: the event title is "Period timetables are here", and if the image also says "period timetable" the expanded page shows the same phrase twice, stacked. The image headline has to say what the title cannot.

| Event | Headline in the image | Store title |
|---|---|---|
| Period timetable | 1st period to 7th | Period timetables are here |
| Free time | When are we all free? | Find free time with friends |
| Lock screen | Your timetable on the lock screen | Make a lock-screen wallpaper |

The image carries the feeling, the title carries the name. Each image also got a smaller subtitle with the plain description.

![Free-time event card — heat map phones on a green ground](/blog/timetable-appstore-events/freetime-card.png)

Each event got its own ground color. The screenshot set is all white, but events sit side by side in a horizontal list, so blue, green and coral read better than three of the same. The phone frame — bezel, Dynamic Island, shadow, all measured from other apps' store cards while making the screenshots — was reused as is.

## Two things that went wrong while capturing

The screens inside the phones come from UI tests on the simulator.

**There was no period timetable in the sample data.** The screenshot fixture only has two time-based timetables, and I needed a school week with Korean, Math and English filling periods 1 to 7. Rather than build it in the app by hand, I pulled the file the app saves, added a period timetable to it, and put it back. It vanished on the next run: `xcodebuild test` reinstalls the app every time, and the app's data container gets a new UUID, taking the injected file with it. The fix was a 20-second pause at the start of the test while an outside loop finds the new container path and writes the file in. Any other test in the same run that re-seeds sample data would overwrite it, so each capture ran alone.

**The lock-screen preview had a "drag to position" capsule on it.** It is a first-time hint that stays until the user drags the timetable card once; waiting does nothing. A tiny drag before the capture cleared it. I only learned the condition by reading the code.

## Where it stands

All six images are done; uploading to the store waits for a check. The lock-screen event, unlike the other two, has no deep link yet for its "Open" button, which needs adding before the event goes live.
