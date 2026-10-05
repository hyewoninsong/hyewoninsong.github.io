---
title: "Turning Sound off doesn't silence your alerts — where we drew the line"
date: 2026-10-05T11:06:23+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "SuperTimetable now has Sound and Haptics switches. Haptics stops every vibration the app makes; Sound stops in-app sounds only. Why schedule alerts are not tied to that switch, and how 60 scattered haptic calls became one gate."
---

You can now turn off the app's vibrations and sounds in Settings. If the tick under your finger every time you drag an event bothers you in a quiet lecture hall, switch Haptics off and keep everything else.

## Two switches, both on by default

They sit in the General card, right under Current Time Indicator.

![Sound and Haptics switches, both on, in the General settings card](/blog/timetable-sound-haptic-switches/switches-on.png)

| Switch | Off stops | Stays |
|---|---|---|
| Haptics | Ticks for selecting, dragging and resizing, the bump when an event hits a wall, chips and color picking, success and warning buzzes | The system switch's own click |
| Sound | The preview you hear when choosing an alert sound | The sound of a schedule alert going off |

Changes apply immediately and survive a relaunch.

![Both switches off — the Sound row says schedule alerts still ring](/blog/timetable-sound-haptic-switches/switches-off.png)

## Why Sound does not mute alerts

The app makes two kinds of sound: the preview while you pick an alert tone, and the alert itself before a class starts.

Muting both with one global switch looks more honest to the label. But an alert is something you turned on for a specific event. If you set "10 minutes before" on a 9 a.m. class and forgot you switched Sound off a month ago, the alert passes silently — and the cause lives on a different screen from the one where you set it. For a timetable app, an alert that doesn't ring is the most expensive failure there is.

So the rule is: **Sound only covers what the app plays while you are using it.** To silence an alert, turn off that event's alert. The Sound row says so in one line, so nobody has to guess.

What lost:

- **One merged "Feedback" switch** — people often want no vibration but still want to hear a tone before choosing it.
- **Sound mutes alerts too** — the reason above.
- **Hiding Haptics on iPad** — Apple Pencil Pro and Magic Keyboard do produce haptics.

## One gate for every vibration

There was nothing to check when we went to turn haptics off: more than 60 direct `UIImpactFeedbackGenerator(...).impactOccurred()` calls across the grid, the color popover, chips and the paywall. An `if` at each site works today and breaks the day someone adds a new one.

Now every vibration goes through `Haptics.impact`, `Haptics.notify` or `Haptics.selection`, and the switch is read once inside. Two exceptions are wrapped in `Haptics.isEnabled`: the wall-contact feedback that scales intensity with drag speed, and SwiftUI's `.sensoryFeedback`, which now returns `nil` from its closure form.

The rule is a test, not a note: it scans the app source and fails on any direct generator call outside the gate, skipping comments.

## Where it stands

The simulator has no Taptic Engine, so the automated check covers the switch values and persistence. Whether the phone actually goes still is a device check. And with haptics off, the screen is the only signal left — each cue that vibration used to carry needs a visible one.
