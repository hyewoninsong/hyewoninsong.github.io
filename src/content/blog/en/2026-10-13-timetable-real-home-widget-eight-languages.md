---
title: "We shot the real Home Screen widget in eight languages, and three of them had different buttons"
date: 2026-10-13T04:20:57+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "SuperTimetable's widget card on the App Store is a real simulator Home Screen, not a composite. We turned on the wallpaper blur as an actual setting and ran the capture in eight languages. Japanese, French and Portuguese broke it, each for a different reason."
---

The last of SuperTimetable's ten App Store screenshots shows the Home Screen widgets. The phone in that card is not drawn: a UI test drives the simulator's Home Screen, adds the widgets and takes the shot. This time we changed the wallpaper to the default iOS one with blur turned on, and captured the same scene in eight languages.

![Store card with two timetable widgets on a blurred default wallpaper](/blog/timetable-real-home-widget-eight-languages/widget-card-ko.png)

## The blur is a setting, not a filter

Blurring the background of a finished screenshot is the obvious shortcut. We skipped it. Widgets and the Dock are translucent glass, so the wallpaper shows through them. Blur only the background and the glass no longer matches what is behind it.

iOS has a real blur option for the Home Screen wallpaper. Getting to it in the simulator took two tries.

| Attempt | Result |
|---|---|
| Long-press the Lock Screen, "Customize" the existing wallpaper | Opens the Lock Screen editor only. No Home Screen choice |
| **Add a new** wallpaper, then pick "Customize Home Screen" | Opens the Home Screen editor, which has "Blur" |

So the test adds the default wallpaper again from the gallery and enables blur from there. It runs once per device, and the wallpaper survives a language change.

## Change the language and the Home Screen's buttons change shape

An app follows a launch argument for its language. The Home Screen follows the system language, so each capture switches the simulator's language and reboots.

Korean, English, Chinese and Spanish passed. Three languages failed on the widget card only.

- **Japanese**: the confirm button for removing an old widget is a single word we did not have in our label table. The alert stayed on screen in the shot.
- **French**: in edit mode, the top-left button is a bare "+" instead of a word. It does not show up in the button query at all, and it opens the widget gallery directly with no menu. The gallery's large add button is also worded differently from the menu item.
- **Portuguese**: the menu item is capitalised differently from our table.

![French Home Screen in edit mode: the top-left control is a plus button, not a word](/blog/timetable-real-home-widget-eight-languages/home-edit-plus-button.png)

Adding more labels fixed Japanese and could not fix French: a button with no text has no text to match. The test now trusts position first. It taps the top-left control by coordinate, finds the gallery's add button as "the wide button in the lower part of the screen", and compares labels case-insensitively.

One more lesson: a failed attempt leaves the gallery open with the search text typed, so the next attempt types it twice and fails for an unrelated reason. Saving the screen and the accessibility tree per attempt is what exposed the first failure.

## Captions follow the words on screen

The framing tool never wraps or shrinks text, so captions that were too wide were rewritten instead of scaled down. Where a headline used a different word from the option visible in the phone right below it (French and Portuguese), the headline changed to match the screen.

![Widget cards in Korean, English, Japanese and Simplified Chinese](/blog/timetable-real-home-widget-eight-languages/widget-cards-four-languages.png)

## Where it stands

The iPhone set is live in all ten store locales. The iPad set and preview video still use the older lineup. Next time we add a language, the widget scene runs alone across every language first. It takes a minute each, and we would rather not learn it after an hour-long capture.
