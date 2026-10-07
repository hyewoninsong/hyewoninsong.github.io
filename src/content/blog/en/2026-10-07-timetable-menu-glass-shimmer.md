---
title: "Picking an alert made the text shimmer — the closing menu's glass was refracting it"
date: 2026-10-07T23:22:38+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Choosing '10 minutes before' made the value label glitch for a fraction of a second. Two causes: a card animation interpolating the text, and the iOS 26 menu glass refracting the label underneath as it closed."
---

In the event editor, picking an alert time made the value text ripple and glitch for about 0.2 seconds. Now the menu closes and the new value simply fades in.

## You only see it frame by frame

Screenshots are taken after the screen settles, so we recorded the simulator and laid out every frame of just that row.

![Before — the old and new values overlap, then the glyphs warp](/blog/timetable-menu-glass-shimmer/frames-before.png)

Two things were stacked: about six frames where the old and new strings dissolve into each other, then about nine frames where the new text is in place but its strokes bend.

## The dissolve: a card animation was carrying the text

The alert card animates rows in and out with `.animation(.spring, value:)`. The value label sat under that modifier, and SwiftUI's `Text` interpolates between strings inside an animated transaction. Adding `.animation(nil, value: text)` to the label removed the dissolve. The warping stayed.

## The warp: glass refracting what lies beneath

On iOS 26 a menu closes by shrinking its glass panel back into the label. That glass lives in a separate window and bends whatever is under it. A plain `Menu` hides its label during this. Ours did not: to stop the value from floating away while scrolling with a menu open, we draw the visible value outside the menu and hand the menu a transparent copy. That left readable text under the glass.

## What we tried

- **Going back to a plain menu** — fixes the refraction, brings back the floating label. Not an option.
- **Enlarging the transparent label** — no change; the glass shrinks smaller than its target.
- **Detecting dismissal** — `onDisappear` on menu content never fired.

The only signal left is the item's action. On selection we hide the visible value without animation, then fade it back in after 0.3 seconds. The menu still covers the spot when it hides, so the disappearance is never seen.

![After — the glass clears, then the new value appears cleanly](/blog/timetable-menu-glass-shimmer/frames-after.png)

## What remains

Dismissing the menu by tapping outside gives no signal, so the refraction is still there in that case. The lesson: don't leave readable text under a closing glass menu, and verify motion with frames, not screenshots.
