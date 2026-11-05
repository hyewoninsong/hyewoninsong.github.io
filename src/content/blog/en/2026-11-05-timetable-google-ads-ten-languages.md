---
title: "Ads in ten more languages — one campaign per language, and an Arabic recording that Esc killed three times"
date: 2026-11-05T10:57:37+09:00
app: "timetable"
tags: ["devlog", "android", "appstore"]
summary: "App campaigns do not translate assets, so each language got its own campaign. Thirty foldable two-posture videos later: Esc closed the edit popover only on the unfolded screen, and six captures had the wrong height for days."
---

SuperTimetable for Android now has a Google Ads campaign draft for each of the ten languages added in 1.2.6: Arabic, German, Hindi, Indonesian, Italian, Russian, Thai, Turkish, Urdu and Vietnamese. Each has 5 headlines, 5 descriptions, three ad images (landscape, square, portrait) and three videos in the same ratios. Thirty videos went to YouTube unlisted in one sitting. They are drafts; the owner picks the day.

## One campaign per language, because App campaigns do not translate

The cheap option was adding the countries to the English campaign. It fails for one reason: the language setting of an App campaign is a targeting filter, not a translation. Someone in Indonesia would see the English ad under a store page we had already translated. So: ten campaigns.

Google's suggested cost per install ranged from ₩54 (India) to ₩455 (Italy); most sat between ₩105 and ₩232. Budgets are placeholders.

The Russian campaign does not target Russia, where Google Ads does not serve. It targets Kazakhstan, Uzbekistan, Kyrgyzstan and Belarus instead.

## Why not reuse the Play preview video

There was already a Play Store preview: one landscape cut, one phone. Two things ruled it out. The ad images show a Pixel Fold folded and unfolded, and a single-phone video does not match them inside the same ad. And with square and portrait left empty, ad strength never leaves "Average". So the same scenes were recorded on a foldable emulator in both postures and composed side by side in all three ratios.

![German portrait ad — folded and unfolded phones in one scene](/blog/timetable-google-ads-ten-languages/ad-german-portrait.png)

## Arabic and Urdu are mirrored, ads included

For the two right-to-left languages the images flip: text right-aligned, phones on the left, like the store cover.

![Arabic landscape ad — text right-aligned, devices on the left](/blog/timetable-google-ads-ten-languages/ad-arabic-landscape.png)

The videos follow the same rule. The two screens swap (unfolded left, folded right) and captions sit in the mirrored corner. The Arabic time axis uses Arabic-Indic digits (١٢:٠٠). Urdu uses Noto Nastaliq one size smaller with 1.8x line pitch, because Nastaliq descends and Latin line spacing lets one line's tails cover the next.

![Urdu portrait video — folded screen with a Nastaliq caption](/blog/timetable-google-ads-ten-languages/video-urdu-portrait.png)

## Esc closed the edit popover, but only unfolded

The Arabic unfolded recording died three times at the style scene with no popover on screen. The folded recording was fine. Re-measuring coordinates changed nothing.

After typing the title, the recorder pressed Esc "to dismiss the keyboard". On the folded screen that is what it does. On the unfolded screen the title goes in through `set_text`, so no keyboard was ever raised, and Esc went to the app instead. In the regular-width layout the app's keyboard shortcut table maps Esc to "deselect", and deselecting closes the edit popover. The folded layout edits in a full-height sheet where the same Esc only hides the keyboard. Same key, different destination per posture.

`dumpsys input_method` could not arbitrate: it reported the keyboard as shown even when none was. The fix is blunt: never send Esc in the unfolded posture. The lesson: a scene that fails in one posture only is an input-path difference, not a coordinate.

## Six "phone screen" captures were the wrong height

Six older locales' folded captures were 1080x2340 instead of 1080x2092, unnoticed for days because each looked like a phone screen.

The Pixel Fold emulator stores the `wm size` override per physical display. The restore ran right after the unfold command, before the posture switch had finished, so the override landed on the outer display, and every later `wm size reset` touched only the inner one. Fixes: wait after switching posture, handle the override per posture, abort the capture when the still is not 2092 tall, and check captures by pixel size rather than by eye.

The same recorder was also waiting for a delete-confirmation dialog removed the day before, and looking for Latin-digit hour labels Arabic does not have. A recording script is a list of assumptions about the app, and nothing runs it when the app changes.

## Where it stands

Ten drafts sit in the account. A draft reopened from the campaign list can lose its publish button, so on launch day they get published as they are or rebuilt. What the real cost per install does to Google's estimates is the next post.

## History

- 2026-11-05 — ten language campaign drafts, 30 two-posture foldable videos, the Esc and `wm size` pitfalls
