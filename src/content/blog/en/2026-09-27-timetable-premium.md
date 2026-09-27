---
title: "Adding a paid tier to the timetable app — and what we chose not to lock"
date: 2026-09-27T23:57:00+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "One purchase unlocks multiple timetables, alarms, and custom colors. Editing and sharing stay free, and everyone who already installed the app gets it all for free."
---

The timetable app now has a one-time Premium unlock. Making, editing, and sharing a timetable stays free. Only a second timetable, alarms, and self-made colors sit behind the purchase.

## A locked feature turns into the paywall when you tap it

Locked controls aren't grayed out. They stay where they are and swap their icon for a lock: the alert row shows "None" with a lock, and the same goes for "New Timetable" and the `+` in the style picker.

![The alert row shows None and a lock instead of a menu](/blog/timetable-premium/alarm-locked.png)

Tapping one opens the paywall, and **the feature you just tapped is listed first.** The paywall never shows up on its own. It doesn't appear on first launch or after the tutorial.

![Paywall listing three benefits with a one-time purchase note](/blog/timetable-premium/paywall.png)

| Feature | Free | Premium |
|---|---|---|
| Timetables | 1 | Many (add, duplicate, import) |
| Alarms | — | Weekly alarm before each class |
| Colors | 20-color palette + 1 custom color | Unlimited custom colors |
| Editing, sharing, printing, widgets | All | All |

## Why these three, and why not a 7-day trial

Students start a new timetable every semester, which makes that the most natural moment to pay. Alarms help every single week. Custom colors get a free taste: one sample color is already in the Custom tab, ready to edit, and the second one opens the paywall. Sharing stays free, and without a watermark, because a timetable image sent to a friend is the app's best ad. Widgets stay free because they're what keeps people using the app day to day.

We considered a full 7-day trial followed by a paywall. It doesn't fit this app's rhythm. The need for a second timetable arrives months later, and a weekly alarm rings only once per class in 7 days. The rule we settled on: **gates only block creating new things.** Existing timetables, alarms, and colors are never locked or deleted, even after a refund.

## Existing users keep everything

`AppTransaction` tells us which build a user first installed. Anyone who installed before the paid version gets Premium for good. There's no receipt server. StoreKit 2 verifies Apple-signed transactions on the device, which is enough for a single product with no cross-platform purchases.

## What bit us

- **`originalAppVersion` is a build number, not a version.** On iOS it's `CFBundleVersion`. We read the cutoff (build 238) straight from App Store Connect, since our build numbers auto-increment on every TestFlight upload. In the sandbox the value is "1.0", so we only apply the cutoff to real App Store installs.
- **Capture mode was calling StoreKit.** A "Sign in to Apple Account" alert covered the simulator and stole taps from the UI tests. It would have ruined the automated store screenshots too. Capture and UI-test modes now skip StoreKit entirely.
- **`xcodebuild test` doesn't inject the scheme's local StoreKit configuration.** The simulator log showed `storekitd` going to the real sandbox server and getting an empty product list. To see a priced paywall locally, run the app from Xcode.

## Where it stands

The code is ready. What's left is creating the product and setting the price in App Store Connect. The first in-app purchase goes through review together with a new app version.
