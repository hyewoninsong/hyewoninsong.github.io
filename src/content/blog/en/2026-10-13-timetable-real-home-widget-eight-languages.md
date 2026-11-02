---
title: "We shot the real Home Screen widget in eight languages, and three of them had different buttons"
date: 2026-11-02T13:40:00+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "SuperTimetable's widget card on the App Store is a real simulator Home Screen, not a composite. We turned on the wallpaper blur as an actual setting and ran the capture in eight languages. Japanese, French and Portuguese broke it, each for a different reason."
---

One of SuperTimetable's App Store screenshots shows the Home Screen widgets. The phone in that card is not drawn: a UI test drives the simulator's Home Screen, adds the widgets and takes the shot. This time we changed the wallpaper to the default iOS one with blur turned on, and captured the same scene in eight languages.

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

That day the iPhone set went up in all ten store locales. The iPad set still used the older lineup until the November 2 update below. Next time we add a language, the widget scene runs alone across every language first. It takes a minute each, and we would rather not learn it after an hour-long capture.

## 2026-11-02 — The widget card moved up, and iPad and Duo got real Home Screens too

The widget card moved from last place to fourth on iPhone and third on iPad and iPhone Duo. All three sets now follow the iPhone order and captions, so the first features you see no longer depend on the device you browse with. iPad and Duo also open with a new brand card.

The iPad card is a landscape Home Screen with six widgets: three weekly timetables on top, each one's day below, and the app icon at the lower left.

![Landscape iPad Home Screen with three weekly widgets above three today widgets](/blog/timetable-real-home-widget-eight-languages/ipad-widget-card-ko.png)

The Dock carried recent apps and an App Library icon. As with the blur, painting them out would break the glass, so we turned them off for real: `SBRecentsEnabled` and `SBAppLibraryInDockEnabled` in `com.apple.springboard`, then a reboot. The extra-large portrait widget was a candidate, but that size needs iOS 27, and the side-by-side layout shows more timetables.

The iPhone test needed three changes. Rotate only after reaching the Home Screen, or SpringBoard stays portrait. Pick the widget's remove button by position, because the iPad Dock's comes first. And stay on the right page: one swipe too far lands in Today View, where an added widget never reaches the Home Screen, or in App Library, where the same button offers to delete the app.

Duo was the hardest. SpringBoard gestures do not reach the open inner display, and inner widgets keep their own configuration. So widgets are added folded, and the language changes through a setting and a SpringBoard restart, because a reboot folds the device again.

We still could not give the two inner columns different timetables. That card joins the columns of two real Home Screens, captured with a different timetable in front. Every widget is really rendered, but this one image is not a single capture.

![Open Duo Home Screen with a different timetable in each column, next to the small folded screen](/blog/timetable-real-home-widget-eight-languages/duo-widget-card-ko.png)

The upload stopped once, on an Apple processing timeout, and resumed from the existing file IDs. Afterwards we compared all thirty sets against the local files by checksum and order. One known issue remains: in languages with long words, `Programming` breaks mid-word inside a widget cell. That is how the widget really renders, not a card problem.

## History

- 2026-10-13 — iPhone widget card moved to the blurred default wallpaper, captured in eight languages
- 2026-11-02 — Widget card moved up, iPad and Duo captured on real Home Screens, all three sets aligned
