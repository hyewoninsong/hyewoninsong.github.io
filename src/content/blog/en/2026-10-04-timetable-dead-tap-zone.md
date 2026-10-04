---
title: "The class right below wouldn't select — a 100pt band left behind by a removed feature"
date: 2026-10-04T00:54:23+09:00
app: "timetable"
tags: ["devlog", "gesture", "uikit"]
summary: "With one class selected, tapping the class directly beneath it did nothing. The gesture was fine; a hit-test for a long-removed quick-edit sheet was still returning early with an empty callback."
---

With Friday period 2 selected, tapping period 3 right below it did nothing. Monday period 2, two columns away, selected fine. The cause wasn't the gesture layer — it was the hit-test for a feature we removed weeks ago, still alive with its callback emptied out.

## Only adjacent classes were dead

![Friday period 2 selected; tapping period 3 directly below does not move the selection](/blog/timetable-dead-tap-zone/neighbour-tap-ignored.png)

With nothing selected, every class responds to a tap. Once one is selected, only classes **in the same column and touching it** stop responding — no haptic, no selection change. Anything one slot away or in another column works.

## The tap handler is a return chain

One UIKit tap recognizer takes the point and asks in order: locked-popup? floating button beside the selected block? **handle band above or below the selected block?** selected block tapped again? another block? empty space? The first match returns.

Step three was the culprit. During single selection it treated 100pt above and 100pt below the block as a "time handle zone", called `onStartTimeHandleTap` / `onEndTimeHandleTap`, and returned. Those callbacks used to open a small sheet for editing just the start or end time. That sheet was folded into the main edit sheet, and the call site replaced the callbacks with `{ _ in }`. It compiles, no warnings — but the hit-test stayed, so any tap in the band exited the chain having done nothing. The step that looks for neighbouring blocks sits below it and never runs.

The numbers explain why the period-axis grid showed it so clearly: a 50-minute period renders about 113pt tall, the band is 100pt. Almost the entire neighbour sat inside the dead zone.

## Removed, not narrowed

Three options: shrink the band to the drawn handle, yield when another block occupies the spot, or delete the check and its callbacks entirely. The first two keep a hit-test that has no action behind it. Handles were already owned by the pan recognizer; taps now go straight to block hit-testing. Deleting it exposed the callback plumbing spread across four files — declarations, parameters, the empty closure, a stored property on the block view — which is exactly why "removing" it at the call site alone looked finished.

## Why it slipped through

- Emptying a closure satisfies the compiler; there is no unused-parameter warning.
- The decision record from the day tap-to-select was added said "if the handle band covers a neighbour, the handle tap wins" — true then, because the tap opened a sheet. The record outlived the feature.
- Visual probes tapped a single selected block. A hit-test that extends **outside** the block only shows up when a neighbour exists.

A source-contract test now asserts the callback names are gone from the grid files and the tap handler has no band check. The rule: when a tap target loses its action, delete its hit-test in the same commit.

## History

- 2026-10-04 — removed the 100pt handle band and its callbacks; added the source contract.
