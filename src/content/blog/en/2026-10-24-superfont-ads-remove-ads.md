---
title: "Remove Ads in an app with no Settings screen: where does Restore go?"
date: 2026-10-24T23:36:25+09:00
app: "superfont"
tags: ["devlog", "swiftui", "appstore"]
summary: "SuperFont now shows an AdMob banner at the bottom of the main screen, and a one-time purchase removes it for good. Copying SuperTimetable's setup broke down on one point — there is no Settings screen — and stacking the banner the obvious way buried a keyboard toolbar under the keyboard."
---

SuperFont's main screen now has an ad banner at the bottom. Tap "Use without ads" right above it, pay once, and the ads are gone for good.

## The banner lives on the main screen only

![A "Use without ads" line and a test banner stacked under the install button](/blog/superfont-ads-remove-ads/banner.png)

The layout comes from SuperTimetable: an app-drawn line ("Use without ads · price ›"), an anchored adaptive AdMob banner, then the home-indicator strip. The line sits outside the ad area in the app's own type, as AdMob policy requires. When no ad fills, the same slot shows a house banner instead of an empty strip.

The banner is stacked under the main screen, so the main screen gets shorter and the install button sits right above the ad. The install wizard covers the whole screen, so there are no ads while you install a font. Consent follows Google's order — UMP, then App Tracking Transparency, then the SDK — and waits until the splash animation is gone.

## Entry points open a sheet, not the payment sheet

![The Use without ads sheet: app mark, Remove ads button, Restore purchase, footnote](/blog/superfont-ads-remove-ads/remove-ads-sheet.png)

In SuperTimetable the entry point starts the purchase directly, and Restore and Ad privacy live in Settings. SuperFont has no Settings screen, but both are required: a non-consumable needs an in-app Restore button for review, and consent regions need a way to change consent. So both entry points open one sheet with Buy, Restore, and (in consent regions) Ad privacy. It costs one extra tap. A standalone Restore button had no room on the main screen; a whole Settings screen was too much for one feature.

## Stacking the banner buried the keyboard toolbar

To stop the keyboard from pushing the banner up over search results, the outer stack got `ignoresSafeArea(.keyboard)`. Build and 215 unit tests passed. A simulator capture didn't: the preview-text toolbar that should float above the keyboard was gone. Ignoring the keyboard at the root took the keyboard inset away from everything inside it, so the toolbar was drawn under the keyboard.

The fix leaves the root alone and collapses only the banner to zero height between `keyboardWillShow` and `keyboardWillHide`. The view stays alive, so it does not request a new ad when it comes back.

![The preview-text toolbar sits right above the keyboard](/blog/superfont-ads-remove-ads/editor-bar-above-keyboard.png)

The same capture caught a second one: an accessibility identifier on the banner container overrode the identifier of the button inside it. It now sits on the banner view itself.

## Where it stands

Ads are off on every simulator (UI tests and store captures run there); Debug builds show them with `-showsAds`. The price appears once the product exists in App Store Connect, and the App Privacy answers have to move from "no tracking" to tracking for ads.
