---
title: "The widget picker showed four coloured boxes — now the widget draws its own preview"
date: 2026-11-01T18:40:00+09:00
app: "timetable"
tags: ["devlog", "android", "design"]
summary: "The Android widget picker previews were hand-drawn vectors. They are now the real widgets rendered over a sample timetable: live and localized on Android 15, the same composition as a PNG below it."
---

Long-press the Android home screen, open the widget picker, and SuperTimetable's three widgets now look like themselves: a week grid with Math, English and Science blocks and a 09:30 now line, a today timeline reading "Now · Math", a red next-schedule card. Until this week the picker showed four coloured rectangles pretending to be a grid.

## The placeholder outlived the widgets

The provider XML pointed `android:previewImage` at three vector drawables drawn by hand during the first widget port. Weeks went into matching the widgets themselves to iOS; nobody reopened the picker.

iOS never has this problem: WidgetKit's `placeholder(in:)` returns a sample timetable and the gallery renders the real widget view. Android now works the same way.

![The today and week widgets in the picker, drawn by the widgets from the sample timetable](/blog/timetable-android-widget-picker-preview/picker-grid-widgets.png)

![The next-schedule preview: a red card, Now · Math, 09:00 – 10:30](/blog/timetable-android-widget-picker-preview/picker-next-widget.png)

## Two paths, one sample

On Android 15+ an app can register a preview with the launcher. Implement Glance's `GlanceAppWidget.providePreview` — the widget's usual composable fed the sample — and `setWidgetPreviews` hands the result to the system, in the device language. It runs once per app version and locale; `RATE_LIMITED` means try again next launch.

Android 14 and below still read `previewImage`. An instrumented test builds that file through the same `composeForPreview` call, inflates the RemoteViews, draws it and saves a PNG — English, light, Monday, one copy. When a widget changes, the test runs again in the same PR.

![The week widget PNG used below Android 15 — the same code, English](/blog/timetable-android-widget-picker-preview/preview-png-week.png)

The sample is one object with the iOS placeholder's titles, days, times and preset colours, and strings in all 18 locales, so the two paths cannot drift apart.

## The clock is pinned at 09:30

iOS uses the real clock in its placeholder, so an evening visit to the gallery shows "Done for today" and an empty card. Android pins 09:30 — inside the 9:00–10:30 Math block — so the now line, the capsule, "Now · Math" and a coloured card always show. The weekday stays real. The next-schedule countdown is left out: a chronometer would count from the real clock to a pinned time.

Eighteen localized PNGs would have covered older devices too, at the price of 54 files to re-render on every widget change; Android 15 already gets the localized live preview, so one English set it is.

## A 4×3 preview in a 4×4 slot

The provider declares the week widget as 4×3; the preview was drawn at that ratio. The Pixel launcher labels it "4×4" and shows a 4×4 slot, so the image sat centred with empty ground above and below. What the launcher places comes from `minHeight` and the device grid, not `targetCellWidth`. Drawing the preview at the measured 4×4 size (368×568dp) filled the slot.

## The test passed and the PNG was gone

The test wrote the file, asserted its size, passed — and `adb pull` found no folder. Gradle's `connectedAndroidTest` uninstalls the app when it finishes, and the uninstall deletes the app's external files. Tests that produce files need `-Pandroid.injected.androidTest.leaveApksInstalledAfterRun=true`. A second trap: debug builds keep versionCode 1, so a "re-register on version change" rule never refreshes the emulator's picker; debug registers on every cold start.

## Still open

The PNG path has not been seen on a real Android 14 device, and non-Pixel launchers may place the week widget at a different span.
