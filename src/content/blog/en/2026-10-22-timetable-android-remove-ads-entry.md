---
title: "The people who saw ads were the ones who couldn't find Remove Ads"
date: 2026-10-22T20:50:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "SuperTimetable for Android sold Remove Ads at the bottom of Settings and in a house banner that only showed when no ad loaded. Anyone actually seeing ads never found it. It now sits in a line right above the ad and as the second card in Settings, and disappears once bought."
---

SuperTimetable for Android now shows a thin "Use without ads · price ›" line right above the bottom banner, and "Remove ads" is the second card in Settings. The purchase had existed for a week. Nobody could tell.

## It existed, which was not the same as being there

There were two ways to buy. A card at the very bottom of Settings, past timetable settings, screen, haptics and bulk removal. And the app's own banner in the ad slot, which only appears when Google sends no ad: offline, every consent purpose refused, or no fill.

So the person who saw ads normally, the one with a reason to pay, had exactly one way to find out: scroll Settings to the end. At the moment the ad annoyed them, there was no way out within reach.

## A line above the ad, a card near the top

![Right above the test ad, right-aligned, "Use without ads ›" in the app's blue. The ad keeps its own height](/blog/timetable-android-remove-ads-entry/banner-line.png)

A 28dp line now sits above the ad: right-aligned, in the app's primary colour, one tap to Play's purchase sheet. The price appears once Play reports it; until then it is just the title.

One constraint shaped it. AdMob does not allow tappable chrome that could pass for the ad to overlap it. So the line lives outside the `AdView`, the ad's height is untouched, and the text looks like any other app button rather than like the ad. The cost is 28dp of grid.

While the house banner holds the slot, the line goes invisible. That banner already is the same button, and two "Use without ads" stacked would look silly. It keeps its height though, so the grid never jumps as ads come and go.

![Settings sheet: under the "Timetable Settings ›" card and its footnote comes the "Remove ads" and "Restore purchase" card, then the Screen group](/blog/timetable-android-remove-ads-entry/settings-card.png)

The Settings card moved up to sit right under the first card. That is where someone goes after seeing the line, closing the app, and wondering later where it was.

## Once bought, it leaves Settings

Before, buying turned the row into "Ads removed" with a thank-you footnote. That is gone now: no card, no footnote, no "Restore purchase". There is no reason to keep showing someone what they already own.

Dropping the restore button is safe because restoring is automatic. Every time the app comes to the foreground it re-reads Play's purchase records, so a purchase on another device or a reinstall removes the ads on its own. While the card is still visible, "Restore purchase" is there too.

## What lost

A row in the more menu: four tool rows (settings, share, calendar, tutorial) turn into something else once a purchase row joins them. The first-run intro: it ends before any ad appears, so it would pitch a purchase to someone who has not seen an ad yet. A one-time popup, for the same reason. Rotating the house banner in every Nth refresh even when ads load: the line above the ad does the same job without giving up revenue.

## Same evening: the Settings row now looks like the ad's own

The first reaction after shipping: make the Settings button stand out, not like the other rows. It had moved, but it still looked like every other row — one line of text, a grey price.

![Settings sheet: on a light blue tint, the app icon, bold "Use without ads", a small pitch, and a filled blue "Remove ads" capsule on the right. "Restore purchase" below is a plain white row](/blog/timetable-android-remove-ads-entry/settings-promo-row.png)

So the buy row became a promo row: app icon, bold title, one-line pitch, the price in a filled blue capsule, on a 10% brand tint. Enough to set it apart from the white rows, not enough to fight the capsule. The vocabulary is the house banner's, so the line above the ad, the house banner and the Settings card read as one thing.

One string changed. The house banner says "this banner is gone for good"; in Settings there is no banner on screen, so it says "the ads are gone for good".

It is the only tinted row in Settings, and it stays the only one. One is what makes it visible.

## Where it stands

The emulator shows no price, since Play has no product there. The priced line on a real device, and Settings going quiet after a purchase, are next, with a license-tester account.

## History

- 2026-10-22 — line above the ad, Settings card moved up, gone once owned
- 2026-10-22 — Settings card restyled as a promo row
