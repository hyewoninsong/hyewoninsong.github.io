---
title: "One reminder became three alarm slots"
date: 2026-09-21T08:25:08+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "alarmkit"]
summary: "The single reminder option mixed up two different things — which time to anchor on, and how far ahead to fire. So 'ring at the start and at the end' could not be expressed at all."
---

A block in Daily Planner could carry exactly **one** reminder. Now it carries three: a pre-alert, one at the start time, one at the end time. Each one turns on and off independently and gets its own sound. Delivery moved from notifications to **AlarmKit**, so an alarm now behaves like a Clock app alarm — it breaks through the silent switch and Focus, and takes over the screen.

## One list, two different questions

The old options were: None / At start / 5·10·15·30·60 min before / At end. It reads tidily as a single menu, but it flattens two separate questions into one list — **which time to anchor on** and **how far ahead to fire**. Storage followed that shape: one offset, one "is this the end time?" boolean.

Which meant "ring when I start *and* when I should stop" was **not expressible**. That is the most natural thing to ask of a planner. When picking one option means giving up another, the problem is not a missing option — it is the model.

## Three slots, one of them picks a time

| Slot | Fires at | Picks a time | Sound |
|---|---|---|---|
| Pre-alert | start − N min (5·10·15·30·60) | yes | per slot |
| Start time | start, exactly | no | per slot |
| End time | end, exactly | no | per slot |

Start and end are pinned to times the block already has. Allowing "N minutes before" on them too would let you build a 10-minutes-before alarm in two different slots, and the word "pre-alert" would stop meaning anything. Time selection lives in one place.

![The alarm screen. Turning on the pre-alert opens timing and sound below it](/blog/planner-three-alarm-slots/alarm-slots.png)

The edit sheet shows the enabled slots as one summary line — `10 min before · End time`. There is no room to expand all three, and most people set them once and never look again.

## The sounds had to be built and shipped

Building "a different sound per slot" hit a wall. This is the only door AlarmKit gives you:

```swift
public static func named(_ name: String) -> AlertSound
```

That `name` is **a sound file inside the app bundle**. There is no API to reference a system alarm tone by name, and no way to enumerate them. Ship no audio and your only choice is the default — the feature does not exist.

So five tones got synthesized and bundled: a bell with metallic partials, a droplet as three short pitch-sliding sweeps, a marimba arpeggio, a square-wave beep, and a rising harp figure. Python generates the waveform, `afconvert` freezes it to `.caf`. Same rules as notification sounds — linear PCM, under 30 seconds. They loop while ringing, so each is 2–4 seconds and fades to silence.

![The sound menu. Everything but the default is a bundled tone](/blog/planner-three-alarm-slots/sound-picker.png)

Picking one plays it once, right there. Nobody can tell "Bell" from "Chime" by reading the word.

If a file name drifts out of sync with the bundle, compilation succeeds, scheduling succeeds, and **the sound silently falls back to the default**. A test now asserts that every file the sound list names actually exists in the bundle.

## Why three fixed slots and not an "add alarm" list

A free-form list was on the table. It drags in a whole list-editing UI — add, delete, reorder — and the count limit ends up arbitrary anyway. Slots carry their meaning in their names, which is what makes the one-line summary readable: `10 min before · End time` beats "2 alarms".

Attaching alarms to the **todo** instead of the block was also considered. A todo has no time. "Start time" would mean a different moment in every block, and there would be no obvious place to change it.

Running notifications alongside AlarmKit — falling back when permission is missing — got dropped too. Two delivery paths for one job means two sets of cancel and de-duplication logic. If permission is missing, saying so on screen is the honest answer.

## The first alarm silently never gets scheduled

Here is the order of events the first time someone turns on a slot: the toggle flips, the alarm gets scheduled, *then* permission is requested. The schedule throws because permission is not there yet, and we swallow it — leaving the setting alone is correct. But when permission is granted a moment later, **nothing reschedules.**

The screen says the alarm is on. There is no alarm. That is the kind of bug you discover at the time it was supposed to ring. Now the moment authorization flips to granted, that block is scheduled once more.

Alarm IDs do not get stored either. A block owns three slots, so it owns three IDs; putting them in the model means re-issuing them by hand on every duplicate, undo, and repeat-placement path. Deriving them from the first 16 bytes of `SHA256(block id | slot)` gives the same value across app launches. Only one thing has to hold: block IDs are unique.

## Limits belong at the input, not in storage

The same session added caps: 10 profiles, 40 characters for a todo title, 500 for a block note. Choosing the numbers is easy. The hard part is **data saved before the limit existed**.

Truncating in the decoder or the store means the next save overwrites the trimmed value, with no way back. So the only place that trims is the input field, and existing over-long values sit behind a one-way ratchet — they can shrink but not grow, and once they drop under the limit the limit becomes the ceiling. Length counts grapheme clusters, so an emoji never gets cut in half.

## A row that did nothing when tapped

The alarm row got built, and a test tapped it. The element was found, `tap()` returned without error, and **the screen did not change** — the before and after screenshots matched pixel for pixel.

A card row in this app has no background of its own; the background is painted once across the whole card. And `.buttonStyle(.plain)` strips the hit region the default button style provides, leaving **only what the label actually draws** as the hit target. Giving the `Text` a `maxWidth: .infinity` widens the frame, not the glyphs. So the middle of the row — between the left title and the right value, exactly where a thumb lands — was dead.

`.contentShape(Rectangle())` fixes it in one line. The lesson is in how it was found, not in the fix: `XCTAssertTrue(row.exists)` passes, and so does `tap()`. **If the before and after screenshots match, that is not a result — it is a failure.**

## Where it stands

There is no widget extension, so there is no Lock Screen countdown Live Activity. The alert screen is drawn by the system, so ringing works regardless. Whether all three slots actually fire on time needs a real device: the simulator offers no way to reset AlarmKit permission short of erasing it, which makes a single denial expensive.
