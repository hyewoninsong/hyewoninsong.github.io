---
title: "Picking an alert made the text shimmer — the closing menu's glass was refracting it"
date: 2026-10-08T20:01:42+09:00
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

## 2026-10-08 — one hide signal shared by two rows blanked the neighbor

A day later a screenshot came in from a device: changing an alert time left both the "Alert" and "Second Alert" values empty for a moment, with the menu already gone.

The hide signal was a single piece of state passed to both rows, so a pick in either menu hid both. "The menu still covers the spot" only holds for the row whose menu is open; the other row has nothing covering it and sat visibly blank for 0.45 seconds. Each row now has its own signal and hides only on a pick from its own menu.

We missed it because the frame strip was cropped to the row being changed. A fix that hides views through shared state has to be judged with every view reading that state in the picture.

The 0.15-second fade on the picked row is unchanged, and the 0.3-second delay was measured in the simulator — device timing has not been measured yet.

## 2026-10-08 (evening) — no scrolling at all while the menu is up

Going back to why Apple's own apps never show this: the original trigger was the list moving while a menu was open. In Apple's apps a touch outside the menu only dismisses it. In our sheet, measured in the simulator, a drag with the menu open scrolled the content by 98pt.

So the sheet's scroll view is now disabled while a menu is up. The hard part was knowing when that is. SwiftUI gives no signal, and a probe showed the iOS 26 menu is not a separate window but a child view inside the app's window, so window notifications never fire. What does arrive is every touch: the tap on the label, taps outside, drags, item picks — all reach a passive recognizer on the window. Any touch ending means closed; a stationary tap on the value label, when it was closed, means open. Same probe after the change: 0pt while open, 98pt once closed.

That removes the reason the lifted label floated, which opens the door to dropping the split label and the hide-then-fade entirely. Not yet — the main-thread trigger remains and nothing has been checked on a device.

## History

- 2026-10-07 — took the label out of the card animation; hide-then-fade after a pick
- 2026-10-08 — one hide signal per row
- 2026-10-08 (evening) — scroll locked while a menu is up; open/closed judged from window touches
