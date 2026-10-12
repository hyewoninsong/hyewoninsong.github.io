---
title: "The lock ripple lost its color: glass rings that bend the grid instead of drawing on it"
date: 2026-10-12T10:20:00+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Trying to edit a locked timetable used to send black rings out from the lock button. They are now colorless Liquid Glass rings, and the ripple is the grid bending underneath them. Why glass beat a distortion shader, and how to put glass on a ring with a hole in it."
---

SuperTimetable lets you lock a timetable. Long-press an event while it is locked and nothing lifts. The lock button shakes and a ripple spreads out from it. Until today that ripple was three black rings drawn across the event blocks. Now it has no color at all: the grid under each ring bends for a moment and settles.

## A ripple should refract, not draw

The old ripple was three circles growing out of the lock, 0.2 seconds apart, stroked 3pt in the text color. A month ago they were blue. We changed them to ink because nothing drawn on top of event blocks uses the accent color.

Ink was still wrong in a quieter way. A ripple on water doesn't cover what is under it. It distorts it. Ours drew a line across your Monday.

Here is the new one, slowed down six times and caught mid-flight.

![Light mode. Glass rings spreading from the lock bend the corner of a blue block and the 17:00 label.](/blog/timetable-lock-ripple-glass/glass-light.png)

The bottom corner of the blue block is pulled along the arc, and the end of the "17:00" label smears. Nothing is painted. Everything you see was already on the grid.

![Dark mode. The same rings read mostly through their edge highlights.](/blog/timetable-lock-ripple-glass/glass-dark.png)

| | Before | After |
|---|---|---|
| Center | Ink fill at 0.35 opacity | Glass disc |
| Three rings | 3pt ink stroke | 5pt glass ring |
| Static ring under Reduce Motion | Ink stroke | Same glass ring |
| Timing and size | 0.2s apart, 1s, 0.8x to 3.2x | Unchanged |

## Why glass and not a shader

- **Lower the opacity.** Cheapest. A black line becomes a gray line and still paints over the blocks. Faint is not the same as transparent.
- **A distortion shader on the whole screen.** The ripple is drawn by a layer at the root of the screen, outside the navigation stack, because toolbars clip anything that spills past an item. A `layerEffect` shader needs everything under it to be SwiftUI-rendered, and the grid's drag handling and the toolbars go through UIKit. Parts of the screen would not ripple.
- **Glass.** `glassEffect` has the system sample whatever is behind it, SwiftUI or UIKit. The ripple layer was already on top of everything, so only the shape had to change.

The ring is one `Shape` with a hole: a circle path inset by half the line width, turned into its outline with `strokedPath`, handed to `glassEffect(.clear, in:)`. Two things needed checking. Does glass stay on the stroke and leave the hole open? Do the existing `scaleEffect` and `opacity` animations still apply to glass? Both do. The outer rings fade in the captures, and the animation code did not change.

The ring went from 3pt to 5pt. An ink line reads at any width. Glass needs room for the bend to show.

## Seeing a one-second animation

One ripple lasts a second, and a screenshot takes about half of that. We multiplied the animation duration by six with a temporary factor and took eight screenshots back to back right after the long press. Each image above is two of those frames side by side. The factor was removed afterwards.

## What is left

It is not perfectly transparent. Glass brings an edge highlight and a soft shadow, and the shadow is heavier in the captures than we expected. Over an empty white cell there is nothing to bend, so the edge is all you get. iPad has no haptics, which makes this ripple the only "it's locked" signal there. If it reads too weak at real speed or on iPad, the ring gets thicker before any color comes back.
