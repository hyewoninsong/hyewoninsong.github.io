---
title: "A block put in the drawer drops into the drawer button"
date: 2026-09-21T14:11:25+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "Putting a block in the drawer used to make it vanish while a button appeared in the corner, with nothing connecting the two. Now a ghost of the block flies to the button and drops in, and taking it out rises from the same button and lands on the timeline. The haptic fires on arrival, not on the tap."
---

Putting a block in the drawer now lifts it off the timeline, carries it to the drawer button in the bottom right, and drops it in. The button bounces and a small "Put in the drawer" label shows above it for a moment. Taking a block out is the reverse: a chip rises out of the button, grows into a block on its way, and settles where it was placed. The point is that someone using the drawer for the first time learns what it is and where it lives from watching it once.

## Nothing connected the vanishing and the appearing

The drawer parks a block off the timeline. Choose "Put in drawer" from the block menu and the block leaves the timeline; a button with a count badge stands in the bottom right whenever the drawer is not empty. Correct, but it was two separate pictures. The block **disappears**, a button **appears**, and nothing on screen said these were the same event.

Taking out was the same. Tap a row in the drawer sheet and the sheet slides away, but the block is **already** sitting on the timeline behind it. It never felt like it came out of anywhere.

## Into the button and out of it

One ghost does the work: a view with the block's color, glyph and title that flies between the timeline slot and the button in 0.55 seconds.

| | Starts | Path | Ends |
|---|---|---|---|
| Put in | at the block, block-sized | shrinks to a 26pt chip while moving right | **drops straight down** into the button |
| Take out | at the button center, as a chip | **rises straight up**, then drifts to the slot growing into a block | settles on the slot |

![The block has shrunk to a chip and is dropping into the drawer button from directly above. The tray icon shows a down arrow](/blog/planner-drawer-animation/dropping-in.png)

Straight down and straight up match the arrows on the tray icon. While the flight runs, the button's symbol switches to `tray.and.arrow.down` or `tray.and.arrow.up`, then returns to `tray.full`. What the icon says and what the ghost does are the same thing.

The ghost layer sits **below** the floating buttons, so the ghost slides under the glass circle and disappears, and on the way out it emerges from under it. Drawn on top, it would have read as "vanished on the button". One layer's difference makes "into".

![After arrival. The "Put in the drawer" label floats above the drawer button and the badge shows 1](/blog/planner-drawer-animation/put-in-label.png)

On arrival the button scales to 1.18 once and the label stays 1.8 seconds. The bounce lasts 0.4 seconds and is easy to miss; the one-line label is what gives the corner button its name.

![Taking out. A small chip is rising from the drawer button, whose icon now shows an up arrow](/blog/planner-drawer-animation/rising-out.png)

The haptic moved from the menu tap to the **arrival**. What the finger feels and what the eye sees should be the same instant.

## After the sheet is gone, with the block hidden

Taking out is the tricky direction. The moment the row is tapped, the block already exists on the timeline. Left visible, it would show behind the dismissing sheet and the ghost would land on something already there. So the block is kept transparent until the landing. The timeline measures that hidden block's on-screen rectangle and reports it as the destination; the sheet's `onDismiss` reports that the sheet is fully gone. The flight starts only when both are known, because the drawer sheet opens at medium height and the button would be hidden behind it.

A hidden block must never stay hidden. If the flight has not started within three seconds, the effect is dropped and the block simply appears.

So that nothing jumps when the ghost is swapped for the real block, the ghost draws its title row with the same check-circle glyph, spacing and padding as a block. The first version drew only the title, and the text hopped right by the glyph's width at the landing.

## What lost

`matchedGeometryEffect` was the obvious candidate and did not fit: the block lives in scroll content, the button in a floating overlay that disappears when the drawer is empty, so there is no moment when the pair exists. It also cannot curve the path or morph the block into a chip. Instead an `Animatable` view animates a single progress value and derives rectangle, corner radius and alpha from it. The path is a quadratic Bézier whose control point makes the last leg (put in) or first leg (take out) vertical. A spring would overshoot past the computed path, so a timing curve is used.

Animating only the put-in was considered and rejected: the button would read as the place things go, not the place they come back from. The toolbar's tidy-up menu also has a drawer item, but a menu item has no location; the floating button is the only thing that is always in the same place.

One slip on the label: raising it above the button with `alignmentGuide(.top)` inside the overlay did nothing on the glass capsule and the label sat on top of the button. A screenshot caught it. It is now a `.bottomTrailing` overlay with bottom padding equal to the button's diameter.

## Where it stands

Putting the first block in overlaps the button's appearance with the flight. It reads as the button standing up to receive it, so it stays.

## History

- 2026-09-21 — Ghost flight both ways, arrival label, haptic moved to arrival.
