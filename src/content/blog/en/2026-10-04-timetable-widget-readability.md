---
title: "The small widget shows one card, not a cramped grid"
date: 2026-10-04T15:30:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The small Today widget gave up on a four-hour timeline grid in favor of a single card. Empty-day captions now name the next class day, the widget header opens display settings, and a lock-screen circular gauge turned out to render as a blank black square inside the app — SwiftUI's accessory styles only draw inside WidgetKit's own pipeline."
---

Pinned at its smallest size, the Today widget squeezed a four-hour timeline grid into a tile barely wide enough for a time column. Blocks rendered at 10pt; text was nearly unreadable. This round touched four spots in the widgets — all of them answers to "what can someone actually tell at a glance."

## What changed

| Spot | Before | After |
|---|---|---|
| Today widget, small | Four-hour timeline grid (10pt blocks) | One in-progress / up-next card |
| Today widget, empty day caption | "No classes today" | "No classes today · Mon 9:00" |
| Today / Full widget header | Tap opened only the timetable | Tap also opens display settings |
| Full widget intent | One toggle drove both the time line and today's day capsule | Split into two toggles |

![The small Today widget shows one card for the in-progress class — subject, time range, and a one-line next-up note](/blog/timetable-widget-readability/small-card-in-progress.png)

The small size no longer draws a grid at all. In progress, it's one card: subject, time range, a one-line note for what's next. Upcoming, it's just that class. Done for the day or nothing scheduled, it's a caption centered in the tile. Medium and larger widgets are unchanged — more room still means the grid tells more.

![On an empty day, the Today widget header caption reads "No classes today · tomorrow 09:00"](/blog/timetable-widget-readability/empty-day-next-class.png)

Weekends and days off left the grid standing alone with nothing to show. The caption now appends the next class day — searched across the whole timetable, up to 7 days ahead (including next week on the same weekday), in calendar order. It reads as an absolute weekday and time, not a countdown; if nothing turns up within the window, the old caption stays as-is.

![Tapping the grid's day header opens display settings — the widget header now opens the same sheet](/blog/timetable-widget-readability/header-tap-display-sheet.png)

Tapping the widget header (timetable name and weekday row) now opens the app straight into display settings — the same screen the app's own day-header and time-axis taps already open. Someone glancing at the widget and noticing the visible range is off no longer has to hunt for the setting inside the app.

The Full widget's single "show current time / today" toggle used to gate both the live time line and today's weekday capsule together — anyone who wanted the capsule but not the line lost both. They're now two separate intent parameters.

## Why this and not that

For the small card, trimming the grid's numbers further was on the table — shrinking the time column, shrinking blocks more. It wouldn't have helped; the grid would just get narrower, not more readable. A full layout swap was the only fix. A dedicated preview mirror for the small size was skipped, though — only the medium size ships in store screenshots, so there was no reason to build a preview nobody captures yet.

The empty-day caption risked echoing a format that was tried and rolled back the same day months earlier — a countdown like "starts in 1h 46m" that changed the widget's look too much. This one only appears when there's nothing left today, and it's an absolute weekday-and-time, not a countdown — the same choice the widget's alarm card made earlier (absolute fire time over relative).

Splitting the Full widget intent kept the existing Swift property name (`showCurrentIndicator`) intact. AppIntents remembers a person's widget configuration by property name, not by the title shown in the editor — renaming it would have reset everyone's existing setting back to default. Only the title was narrowed; a second parameter was added alongside it. The reload policy turned out to need only one of the two anyway: today's highlight only changes at midnight, so with the time line off, a single midnight entry already covers both states.

## What a circular gauge taught about rendering

The same pass added a circular shape to the lock-screen "next class" widget — a `Gauge(.accessoryCircular)` filling as the current or upcoming class progresses, with a live countdown or minutes-remaining label at its center.

Checking the shape by rendering it offscreen inside the app target produced a flat black square. No error, no warning — the PNG came out valid, just empty. Forcing tint, color scheme, and rendering-mode environment values made no difference.

The reason: WidgetKit-only gauge styles like `accessoryCircular` only draw when hosted inside WidgetKit's actual rendering pipeline — the vibrancy, monochrome, and system-tint context the lock screen, Dynamic Island, or Smart Stack supply. Without that host, the style silently composites nothing. It isn't the usual offscreen-render color mismatch; the style itself draws empty.

The project's default way of eyeballing a SwiftUI view — render it offscreen inside the app and read the PNG — had worked for every ordinary view so far, so it seemed safe to assume it would work here too. The failure never threw; it just produced a blank image, easy to mistake for "checked" unless someone actually opens the file. Accessory-family WidgetKit styles need either a real widget mounted in the Simulator or Xcode's canvas preview — an app-side render can't substitute.

## Where it stands

The circular gauge passed every test but hasn't been seen filling in on an actual lock screen yet — that's next. The same goes for the widgets' response to iOS 18's tint-only home screen theme: block backgrounds are wired to stay neutral while axis labels, capsules, and titles pick up the tint, but it hasn't been confirmed on a device with that theme turned on either.

## History

- 2026-10-04 — Small Today card, next-class-day caption, header tap to display settings, split Full widget intent, lock-screen circular gauge (unverified on device).
