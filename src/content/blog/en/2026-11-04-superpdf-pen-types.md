---
title: "Two pens, fountain and ballpoint — and PencilKit's point size 2 turned out to be width 0"
date: 2026-11-04T02:12:40+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "Handwriting now has a fountain pen with tapered ends and a ballpoint with uniform width, each with its own settings. The shaping rewrites point sizes after the stroke ends — and trusting point size as points made every stroke a hairline."
---

Handwriting in SuperPDF had one pen: PencilKit's default with three widths, shared with underlines. Now there are
two. A **fountain pen** whose strokes are thin at the ends and full in the middle, and a **ballpoint** that is the same
width everywhere. The fountain pen has three sliders — nib sharpness, pressure sensitivity, nib flatness — and width is
a continuous value from 0.2 to 2.8 mm.

## One pen button, the whole pen inside it

The width button in the second toolbar row became a pen button. It shows a small sample stroke drawn with the current
pen, so you can tell fountain from ballpoint before opening it. Tapping it opens a popover.

![Fountain pen settings — a large sample stroke, the two pen types, width, and three sliders](/blog/superpdf-pen-types/pen-popover-fountain.png)

| Setting | Meaning | Range |
|---|---|---|
| Type | Fountain (PencilKit `.pen`) / Ballpoint (`.monoline`) | two |
| Width | Rendered width. The three presets are the old thin/regular/bold (0.4 / 0.7 / 1.4 mm) | 0.2 – 2.8 mm |
| Nib sharpness | How much the ends taper. At 100 the tip is 15 % of the width | 0 – 100 |
| Pressure sensitivity | How much force or speed changes the width. 50 is what PencilKit measured, 0 is uniform | 0 – 100 |
| Nib flatness | 0 is a round nib, 100 a flat nib held at 45° — width depends on stroke direction | 0 – 100 |

Each type keeps its own width. Switching to ballpoint hides the three sliders; they mean nothing for it.

![Ballpoint settings — a uniform sample line and only the width control](/blog/superpdf-pen-types/pen-popover-ballpoint.png)

Three strokes on the same page: fountain 0.7 mm, fountain 1.4 mm with sharpness and flatness at 100, ballpoint 1.4 mm.

![Three strokes — the fountain pen tapers, flatness 100 splits width by direction, the ballpoint is uniform](/blog/superpdf-pen-types/three-strokes.png)

## The properties come from rewriting point sizes after the stroke ends

`PKInkingTool` takes an ink type and a width, nothing else. But PencilKit stores a stroke as points, each with a
`size`, and renders at that size — the live tool fills it in from force and speed. We borrow that slot. When the finger
lifts, the new stroke is pulled from the canvas, every point gets a new width (base × taper × pressure × direction), and
the rewritten stroke is swapped back in. Canvas and saved ink are the same stroke, and because the width is baked into
the ink, changing the settings later does not touch what was already written.

Alternatives that lost: PencilKit's `.fountainPen` ink already varies with direction, but it cannot expose sharpness,
pressure and flatness separately. A custom canvas would lose Pencil latency, prediction and palm rejection. Shaping
during the live stroke is not possible; the live render belongs to the tool, and the change at lift-off is only the
tapering of the ends.

## Point size 2 was not 2 pt — it was 0

The first build put a 2 pt width straight into `size` 2. The popover preview looked right; the strokes on the page were
hairlines. The unit test "PencilKit renders at point size" was green, because it only checked that tips were thinner
than the middle — a proportion, not an absolute.

So I rendered a stroke at point size s and counted inked pixels in one column:

| s | 1 | 2 | 2.5 | 3 | 4 | 6 | 8 | 12 |
|---|---|---|---|---|---|---|---|---|
| rendered width (pt) | 0 | 0 | 1 | 2 | 4 | 8 | 12 | 20 |

**Width = 2s − 4.** Anything at s ≤ 2 draws nothing, and `.pen` and `.monoline` behave identically. The live tools are off
too: `.pen` at width w emits about w/2 + 2 at normal speed, `.monoline` emits 1.5w. Widths now live in rendered points
everywhere and convert with w/2 + 2 only at the ink boundary; the ballpoint's live tool width is (w + 4)/3 so the stroke
looks the same before and after lift-off. An image test guards the relation. If an OS update changes it, that test
breaks first.

## What is left

Pressure sensitivity cannot be judged in the simulator; synthetic drags arrive with constant point sizes. Comparing
0 / 50 / 100 with a finger and a Pencil is device work.
