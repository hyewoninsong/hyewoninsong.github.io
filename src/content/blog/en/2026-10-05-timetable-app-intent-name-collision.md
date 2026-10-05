---
title: "Adding one Siri intent removed the timetable picker from our widgets"
date: 2026-10-05T18:53:53+09:00
app: "timetable"
tags: ["devlog", "swiftui", "data"]
summary: "A day after we added Siri intents to the app, the Today widget's edit screen lost its timetable picker. The app and the widget extension declared an intent with the same type name, and App Intents uses that bare name as the identifier. The same day, the watch app learned to show the current and the next event together."
---

Long-press the Today widget, tap Edit, and there should be a row for choosing which timetable it shows. That row was gone. The full-week widget was fine; only the Today widget and the lock screen "next event" widget were affected. No build warning, no log.

## Two targets, one type name

The day before, we had added four Siri and Shortcuts intents to the app. One of them, "today's classes", was a type called `TodayScheduleIntent`. The widget extension already had a type with that name: the configuration intent that stores which timetable a widget displays.

- Widget extension: `TodayScheduleIntent: WidgetConfigurationIntent`, with one parameter, the timetable.
- App: `TodayScheduleIntent: AppIntent`, with no parameters.

Different targets are different modules, so Swift sees no conflict. We even wrote a comment saying so. For the compiler, it was true.

## App Intents drops the module from the identifier

Each target's build emits an intent metadata file. In it, the intent's identifier is just `"TodayScheduleIntent"`, with no module. An installed app and its extensions share one identifier space, and when two definitions collide the system picks the app's. That one has no parameters, so the widget's edit screen had nothing to show.

The full-week widget survived because its configuration intent's name existed in only one place.

## We renamed the app side

The identifier is also a storage key, so which side to rename matters.

- Rename the widget's intent, and every widget already on a home screen resets to defaults.
- Rename the app's intent, and any shortcut a user built with that action breaks.

The Siri intents had not shipped yet, so the app side became `TodayClassesIntent`. After release, this would have been a real trade-off.

A test now collects intent and entity type names from both targets' sources and fails if they intersect. The compiler will not enforce this rule, so a test does.

## Why it went unnoticed for a day

We verified what we had added: the spoken answers, the Shortcuts registration. The existing widget's edit screen was outside the change, so nobody opened it. Opening it is now part of the procedure whenever an intent is added.

## The watch app shows now and next together

The first version of the watch app borrowed the lock screen widget's rule of drawing one card: the class in progress, or else the next one. During a class, the next class was demoted to a small row, and a second overlapping event did not look in progress at all.

![The watch app with a card for the class in progress and, right below it, a same-sized card for the next class](/blog/timetable-app-intent-name-collision/watch-ongoing-and-next.png)

A glance at the wrist asks both questions: what am I in, and what is next. A lock screen widget has room for one answer; a scrolling watch screen does not have that limit. Every event in progress now gets a card, followed by a card for the next one. The complication on the watch face still shows a single event.

## Where it stands

We confirmed in the build output that the identifiers no longer overlap. Seeing the picker row back in the widget editor waits for the next test build on a device.
