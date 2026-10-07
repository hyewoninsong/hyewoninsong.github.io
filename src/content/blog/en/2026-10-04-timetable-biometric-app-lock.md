---
title: "Adding App Lock, one flag ended up covering two different moments"
date: 2026-10-07T10:31:00+09:00
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

(2026-10-05: this call was reversed a day later. Covering and requiring authentication are now
separate states — see "One flag was not enough" below.)

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

(2026-10-07: the lock screen is no longer a layer in this view tree but a dedicated window. The
banner still sits above the lock; the lock now appears instantly and the window does the fade-out —
see "Above everything" below.)

## Where it stands

The first round assumed Face ID enrollment in the simulator was menu-only, and verified just the
overlay and its animation. That gap came back as a bug report the next day (below). A simulator UI
test now drives the on and off round trip through a real prompt. The cold-launch cancel and grace
bypasses are covered by state tests only, and none of this has been rerun on a physical device yet.

## 2026-10-05 — One flag was not enough: the Face ID prompt deactivates the app too

A day later a report came in from a real device. Turning App Lock off showed an "Authentication
Failed" alert even though Face ID had passed, and the switch snapped back on. Turning it on worked.

![The "Authentication Failed" alert over Settings — the App Lock switch is still on](/blog/timetable-biometric-app-lock/auth-failed-alert.png)

The cause was the decision described above. The system Face ID prompt sits above the app's window,
so showing it moves `scenePhase` to `.inactive`, and dismissing it brings `.active` back. A lock
that covers the screen on `.inactive` takes that path for a prompt it raised itself.

| # | What happened |
|---|---|
| 1 | The switch is turned off, so Settings raises the prompt |
| 2 | The scene goes `.inactive`, so `isLocked` becomes true to hide the snapshot |
| 3 | The lock screen appears and starts its automatic authentication |
| 4 | The second evaluation overlaps the first, and the Settings one comes back failed |

Turning it on never reaches step 2 because the lock is still off. Two more holes had the same root.
Cancelling Face ID on a cold-launch lock screen dropped the lock, because the following `.active`
read as "just peeked at the switcher". With a 1 or 5 minute grace period, backgrounding a locked
app once more reset the timestamp and it unlocked on return.

### Same picture on screen, different right to dismiss it

There are now two states.

| | Covered | Needs authentication |
|---|---|---|
| Raised by | inactive or background, launch lock, grace expired | launch lock, grace expired |
| Cleared by | returning with no pending requirement, successful authentication | successful authentication only |

The lock screen's automatic prompt follows "needs authentication", not "covered". Returning to
the foreground leaves a pending requirement alone. Authentication calls cannot overlap. Pulling
down Control Center no longer raises Face ID either.

Skipping the cover while a Settings prompt is up lost because the switcher thumbnail would go
uncovered. Serialising the prompts alone lost because both bypasses would remain.

### Why it was missed, and what catches it now

The first round verified a forced lock-screen capture and the grace-period function. No test ever
raised a real prompt, and trying only the "on" direction by hand passes.

The simulator can run this path. Face ID enrollment and matching are Darwin notifications, and a UI
test runner lives inside the same simulator, so it can call `notify_post` itself: set the state of
`com.apple.BiometricKit.enrollmentChanged` to 1 and post it, then post
`com.apple.BiometricKit_Sim.pearl.match` to pass. On the old code the round trip ended with one
alert and the switch still on. On the new code it ends with no alert and the switch off.

The lock state object now takes its settings, authenticator and clock as inputs, so tests replay
the scene transitions in order while an authentication is in flight. Those tests guard the two
bypasses.


## 2026-10-07 — "Above everything" was never a view-hierarchy promise: the lock screen sat under the sheet

A report came in: leave Settings open, lock the device, come back — Face ID runs, but there is no lock
screen, just Settings. Then a screenshot: with the toolbar menu open, the menu floats on top of the
lock screen.

![The toolbar menu still floating over the lock screen — its rows cover "Timetable Is Locked"](/blog/timetable-biometric-app-lock/menu-over-lock.png)

The lock state was fine. It locked, drew the lock screen, and started authentication. Only the picture
was hidden. The lock screen was the top layer of the root `ZStack`, and SwiftUI's `.sheet`, `.alert`,
`.popover` and `Menu` are not siblings in that tree — they are presentations stacked above the root.
No `zIndex` inside the root reaches over them. "Covers the whole window" really meant "covers the root
content".

### The lock screen became a window

Each scene now gets a dedicated `UIWindow` for the lock screen, one level above normal windows
(`.alert + 1`). A hidden `UIView` in the scene root's background finds its `UIWindowScene` and shows
or hides that window; on iPad, every window gets its own.

![Back from the Home Screen with Settings still open — the lock screen covers the sheet, with the Face ID prompt on top](/blog/timetable-biometric-app-lock/lock-over-sheet.png)

| | Choice | Why |
|---|---|---|
| Appear | Instantly, no curve | It must be opaque before the app-switcher snapshot |
| Dismiss | 0.25 s fade | No hard cut right after authenticating |
| Alarm banner | Drawn again by the lock window, above the lock | The root's banner is now covered; a ringing alarm must stay stoppable |
| Keyboard | Dismissed when the lock requires authentication | A hidden field must not keep taking input |
| After unlock | The sheet or menu is still there | The lock must not throw away what you were editing |

A separate window does not inherit the scene root's SwiftUI environment, so the app's light/dark
setting goes in through `overrideUserInterfaceStyle`.

Two alternatives lost. Adding a lock layer to every sheet misses the next sheet someone adds, and
cannot be done for system menus at all. Dismissing everything on lock discards work in progress.

### Proof of a cover is not "it exists" but "what is under it cannot be tapped"

The Face ID round-trip test from two days earlier ran inside the Settings sheet and still missed
this: it checked the switch value, the alert count, and that the lock screen *existed*. A lock screen
buried under a sheet still exists in the accessibility tree.

The new tests check `isHittable`: with a sheet open, and with the menu open, go Home and come back,
then confirm the Unlock button can be tapped and the switch or menu row underneath cannot. After the
fix both cases pass in the simulator. The tests were not run against the old code — the evidence for
"before" is the screenshot above.

Not yet exercised: iPad multi-window, locking while an alarm is ringing, locking with the keyboard up,
and a real device.


## History

- 2026-10-04 — added App Lock (Face ID/Touch ID/passcode), off by default.
- 2026-10-05 — turning the lock off failed with "Authentication Failed"; covering and requiring authentication became separate states.
- 2026-10-07 — the lock screen sat under open sheets and menus; it moved to a dedicated window.
