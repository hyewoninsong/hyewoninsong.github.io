---
title: "Adding App Lock, one flag ended up covering two different moments"
date: 2026-10-04T19:20:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Added Face ID app lock. Hiding the app-switcher thumbnail and deciding whether to re-prompt on return are two different questions — they ended up collapsing into the same flag."
---

Once the app started holding friends' timetables too, there was a real reason to hide it on its
own, separate from the device's own lock screen. So App Lock shipped: Face ID / Touch ID / passcode,
off by default. Turn it on, and leaving the app and coming back brings up a full-screen lock over
everything.

## Authenticate for both directions

Toggling it isn't instant. Turning it on asks for authentication first, and only flips once that
succeeds. Turning it off asks too — locking yourself out and someone else switching it off both
needed the same gate. A grace-period row (immediately / 1 minute / 5 minutes) only shows up once
the toggle is on; immediately re-prompts every time the app comes back from the background, 5
minutes forgives a quick errand.

![Lock screen, light — Face ID glyph, "Timetable Is Locked", an Unlock capsule](/blog/timetable-biometric-app-lock/lock-screen-light.png)
![Lock screen, dark — same layout holds in dark mode](/blog/timetable-biometric-app-lock/lock-screen-dark.png)

The lock screen shows the device's actual biometry kind instead of a generic padlock — Face ID
glyph and name on a Face ID device, Touch ID on a Touch ID device. Those three names (Face ID,
Touch ID, Optic ID) are Apple's own proper nouns, so none of the eight locales translate them —
only the surrounding sentence does.

## Two questions, one flag

Building it surfaced two different moments that both ask "should this be hidden right now?"

One is the **app-switcher thumbnail**. iOS snapshots the screen the instant the app goes inactive
(`scenePhase` hitting `.inactive`), regardless of grace period — that frame can never show the
timetable. The other is **whether to re-authenticate**: once the app fully backgrounds and comes
back, the grace period decides whether to skip the prompt or show it again.

The first instinct was two separate state values. But both resolve to the same visible result — an
opaque overlay covering the content — so they collapsed into one `isLocked` flag. What differs is
only *when* it flips true: unconditionally on `.inactive`, and via a grace-period check on
`.active`. That check is a single pure function, `shouldLock(lockedAt:now:grace:)` — three inputs,
one output, easy to pin down with boundary-value tests.

The toggle got a similar simplification. A SwiftUI custom `Binding` that only commits after
authentication looks natural, but this app had already hit a race once with a segmented picker
whose custom `Binding.set` mutated other state inline — taps got silently dropped. So the toggle
binds a local `@State` directly and reacts to the change in `.onChange`, committing the real
setting only after the async authentication resolves. Until then the switch visibly does not move
— whatever the user sees during the system Face ID animation is still "not on yet."

## The alarm rings above the lock

A same-day change to the ringing-alarm banner's animation touched the same file. To avoid the
overlap, the lock overlay went in as its own layer, with declaration order alone putting the alarm
banner above it. An alarm still needs to be silenced while the app is locked, so the banner stays
on top — and it keeps showing the real schedule title rather than a redacted placeholder. A version
that replaces the title with a generic label was considered and shelved; a new state value felt
like too much for one banner.

That overlap also meant dodging a pitfall the other change had just hit. The overlay fades in and
out with `.transition(.opacity)`, but a plain assignment to `isLocked` doesn't replay that
transition — `.transition` only plays when the state change that inserts or removes the view
happens inside an animation transaction. The alarm banner had hit and fixed the exact same symptom
earlier that day, so the lock state's assignment went straight into `withAnimation` from the start.
Two confirmations in one day that a view-side `.animation(value:)` doesn't reliably drive a
conditional view's appearance or disappearance.

## Where it stands

The simulator has no command to toggle "Face ID enrolled" — that's Simulator.app's Features menu,
GUI only. So this round verified the overlay itself: it appears, animates, and the settings UI
behaves. The actual success/cancel paths through real biometric authentication still need a check
on a physical device.

## History

- 2026-10-04 — added App Lock (Face ID/Touch ID/passcode), off by default.
