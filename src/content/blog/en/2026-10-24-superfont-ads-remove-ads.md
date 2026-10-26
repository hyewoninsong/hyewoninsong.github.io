---
title: "Remove Ads in an app with no Settings screen: where does Restore go?"
date: 2026-10-26T11:03:06+09:00
app: "superfont"
tags: ["devlog", "swiftui", "appstore"]
summary: "SuperFont shows an AdMob banner and sells a one-time Remove Ads. With no Settings screen, Restore moved into a sheet. Two days later a rewarded video ad went in right before the profile download — why rewarded and not interstitial, and why an 8-second timeout stayed silent for 36 seconds."
---

SuperFont's main screen now has an ad banner at the bottom. Tap "Use without ads" right above it, pay once, and the ads are gone for good.

## The banner lives on the main screen only

![A "Use without ads" line and a test banner stacked under the install button](/blog/superfont-ads-remove-ads/banner.png)

The layout comes from SuperTimetable: an app-drawn line ("Use without ads · price ›"), an anchored adaptive AdMob banner, then the home-indicator strip. The line sits outside the ad area in the app's own type, as AdMob policy requires. When no ad fills, the same slot shows a house banner instead of an empty strip.

The banner is stacked under the main screen, so the main screen gets shorter and the install button sits right above the ad. At first the install wizard covered it, so there were no ads during an install; a day later the wizard got the same banner slot, since that is where people spend most of their time. Consent follows Google's order — UMP, then App Tracking Transparency, then the SDK — and waits until the splash animation is gone.

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

## 2026-10-26 — One rewarded ad, right before the profile download

A font installer is opened for a minute and closed. A banner barely gets seen. The one place where people wait on purpose is the moment before the profile download, so that is where a full-screen video ad now goes: watch it to the end and the profile is created. Remove Ads owners never see it.

It never appears unannounced. Tapping the download button shows an alert first — "One quick ad first. SuperFont is free thanks to ads." — with three choices: Watch ad, Use without ads (the existing Remove Ads sheet), Cancel.

![The pre-download alert: Watch ad, Use without ads, Cancel](/blog/superfont-ads-remove-ads/install-ad-prompt.png)

### Why rewarded, not interstitial

Only one AdMob format guarantees "to the end". An interstitial gets a close button after a few seconds. A rewarded interstitial is an automatic transition ad: Google requires a countdown intro screen and designs it to be skippable, so our alert and its intro would say the same thing twice. A rewarded ad starts when the user taps Watch and fires its reward callback only when the video finishes. The alert → confirm → ad sequence is the standard pattern for that format.

The reward is the profile. Close early and nothing happens; tap again and the alert comes back. The SDK already asks "you'll lose the reward" before closing, so the app does not repeat it. If no ad is available — no fill, offline, presentation failure — the install goes ahead. The ad is the price, not a precondition.

![After the test ad ends: "Reward granted" and a close button](/blog/superfont-ads-remove-ads/rewarded-ad-granted.png)

Once per flow: Download again and Reopen Safari inside the same wizard do not ask twice. The app does not count seconds; the ad decides its own length.

### An 8-second timeout that stayed silent for 36 seconds

The ad is preloaded when the download screen appears. If it is still loading when Watch is tapped, the app waits at most 8 seconds and then installs without it. That wait was written with `withTaskGroup`: one child awaits the load, another sleeps 8 seconds, `next()` takes the first, then `cancelAll()`.

In the simulator the status line sat on "Preparing the ad…" for over 36 seconds. The group scope does not close when `next()` returns; it closes when every child has finished. A child awaiting another task's `value` does not wake on cancellation, because `value` does not propagate it. So when the load never came back, the sleeping child finished and the group stayed open. The slow side won the race.

The fix is polling: keep the loaded ad in an actor property and check it every 200 ms until the deadline. The load is not cancelled, so a late ad serves the next attempt. Unit tests cover the gate decision only; the SDK runs in the simulator, and the capture caught it.

### Where it stands

The rewarded ad unit now exists in AdMob (reward amount 1, item `Reward` — the app only checks that the callback fired) and release builds carry its ID. If the cancel or close-early rate turns out high, the next decision is whether an early close should still install.

## History

- 2026-10-24 — bottom banner, Remove Ads sheet, keyboard toolbar pitfall
- 2026-10-26 — rewarded ad before the profile download, `withTaskGroup` timeout pitfall
