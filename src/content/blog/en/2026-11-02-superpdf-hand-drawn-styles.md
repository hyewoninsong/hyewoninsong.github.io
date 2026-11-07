---
title: "Underlines were ruler-straight. Now four marks look hand-drawn, and you pick the style after you draw"
date: 2026-11-07T18:41:09+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "SuperPDF grew from two line styles to five: highlighter, underline, strikethrough, circle, box. The lines wobble like a pen stroke with a per-highlight fixed seed, and a tooltip opens right after you draw so you can switch."
---

SuperPDF has five line styles: highlighter, underline, strikethrough, circle, box. You pick one in the bottom tool row before drawing, and change a drawn mark from the tooltip that opens when you tap it. The four line styles are no longer ruler-straight. They wobble slightly and overshoot at the ends, the way a pen does on paper.

## Five styles, all per line

There were two styles, a filled highlighter and an underline. Strikethrough, circle and box are new, and every one of them is **per line**. Select three lines and choose circle, and each line gets its own oval rather than one big oval around all three.

![Strikethrough, circle and box drawn one per line; the circle is selected with its range handles](/blog/superpdf-hand-drawn-styles/circle-line.png)

Line weight (thin, regular, bold) now applies to all four line styles. The storage model did not change. Styles are stored as strings, so an older build that meets a new value simply shows it as a highlighter.

## The wobble is a fixed random seed per highlight

| Style | How it is drawn |
|---|---|
| Underline, strikethrough | A uniform-width, round-capped pen stroke with at most one and a half gentle bends; starts 0.5–2pt early, ends 0.5–3pt late. |
| Circle | Starts at the top left, goes once around plus 20–35 degrees, drifts slightly outward, and the tail lifts above the first stroke. Round ends, tilted a few degrees. |
| Box | Four separate strokes, each corner overshooting by 0.5–2pt. |
| Highlighter | Unchanged: a translucent rectangle. |

The first version drew underlines as a ribbon, thicker in the middle. Looking at the Notes screenshot again, its underline is a uniform pen line, and the hand-drawn feel comes from one gentle bend, not from jitter. Same day, the ribbon became a stroke and the wobble frequencies dropped.

The seed is the **highlight's id**. Fresh randomness on every draw makes lines shiver on scroll and zoom, and the same underline would look different on the paged board and the scroll board. Seeded by id, it is the same shape everywhere, every time. The amplitude is tied to the line weight and stays around 1pt, which is as far as it can go before a page with dozens of underlines looks messy.

Paths are built in a "line space" whose origin is the top-left of the text line, y pointing down, in screen points. The caller supplies the transform into the view. Rotated scans still get "below the line" right, and the wobble stays the same size on screen at any zoom.

## Pick after drawing, and the pick becomes the default

Before, you chose the style in the toolbar **before** drawing. Changing a drawn line meant switching to the select tool and tapping it again. So the tooltip opened the moment you lifted your finger (retired on November 5, see the last section).

![The settings row of the underline tool with five style buttons](/blog/superpdf-hand-drawn-styles/style-row.png)

Drawing speed is unchanged. The stroke commits immediately with the last style used; the tooltip is there only if you want something else, and it goes away when you draw the next line. Whatever you pick there, style or weight, becomes the default for the next stroke. If you switched to circle, the next line is a circle too.

## Five buttons did not fit an iPhone

The tooltip overflowed: an iPhone in portrait leaves 378pt, and five styles plus three weights, color, delete and a menu add up to 483pt. Two fixes: the weight picker collapsed into a single button with a popover, like the color button, and the tooltip uses `ViewThatFits` to fall back to two rows with the five styles on top. Landscape goes back to one row.

![The two-row tooltip: five styles above, weight, color, delete and menu below](/blog/superpdf-hand-drawn-styles/tooltip-two-rows.png)

## What lost

- One big circle around a multi-line selection lost to per-line marks; per line, the rect model, the range handles and PDF export all stay as they are.
- Collapsing the style buttons into a popover too lost; the width problem would be solved but the "see your options right after selecting" moment would be gone.
- Storing the strokes as PencilKit ink lost; it would change the data model and the range handles could not stretch it. Paths are regenerated from style and seed every time.

## One wrong turn

The circle's outward drift was first expressed as a fraction of the radius. On a long single-line oval that let the horizontal radius grow by 15pt, because a ratio sized for a 10pt vertical radius was multiplied by an 83pt horizontal one. The drift is now an absolute number of points. A test that fails when a circle leaves the line margin by more than 6pt caught it.

On export, a box becomes a PDF `/Square` annotation, and so does a crop. To tell them apart on re-import, the box writes its style name into `/Subj`. The hand-drawn shape itself is not written to the PDF; other apps see straight lines.

## 2026-11-03 — The circle had pointed ends

Around a long sentence, the circle pinched into needle points at both ends, while the one in Notes stays round. That is a property of ellipses: the radius at the tip is `ry²/rx`, about 0.7pt on a 600pt line, and it gets worse as the line grows.

So the outline is no longer an ellipse. It is a flat ellipse pushed outward by a fixed distance, which keeps the tip radius close to that distance at any length while the sides keep their gentle curve. The outer size is unchanged, so margins and PDF export stay as they were.

![A circle around a long line of text, with round ends and softly curved sides](/blog/superpdf-hand-drawn-styles/circle-round-ends.png)

Points had to change too. Even angle steps crowd the round tip into a sliver of the sweep and turn it into one kink, so a point now lands every 5pt or every 7 degrees or so of turning.

Pushing out by 80% of the vertical radius looked like a pill; 55% looked like the Notes oval. The overlap moved from the left end to the top side, which left the inward tail poking out like an arrowhead and scratching the text, so the tail now lifts outward.

![Circles from 16pt to 620pt wide, all with round ends](/blog/superpdf-hand-drawn-styles/circle-widths.png)

A superellipse lost because its exponent has to be tuned per aspect ratio, and straight sides joined to half circles lost for looking ruler-made. Paths are not stored, so circles you already drew get the new shape too.

## 2026-11-03 — You set the wobble

Some people like the hand-drawn look; others want a straight line under a number in a table, and some want it rougher. The wobble is now a setting next to weight: under the three weights in the weight popover there is a Wobble slider from 0 to 100, with a sample stroke drawn at the current value.

![The weight popover with a Wobble slider at 100 and a sample stroke above it](/blog/superpdf-hand-drawn-styles/wobble-slider.png)

Change it in the underline tool's settings row and it applies to marks you draw next, and is remembered. Change it in a selected mark's tooltip and only that mark changes, as one undo step.

0 is ruler-straight, 50 is exactly the old shape, 100 is twice as loose:

![Wobble 100: a tilted circle with a long tail](/blog/superpdf-hand-drawn-styles/wobble-100.png)

![Wobble 0: the same line inside a clean, round outline](/blog/superpdf-hand-drawn-styles/wobble-0.png)

Every random-derived deviation is multiplied by value / 50 without changing the order the random numbers are drawn, so existing marks at 50 are untouched. The value lives per mark as a small versioned JSON in a slot line marks never used, instead of a schema bump; a single global setting lost because it would reshape old books' marks too.

At first the slider was invisible on iPhone: the popover's arrow was pinned to the top, so it tried to open below a tooltip that already sat near the bottom of the screen and got squashed. Letting the system pick the arrow edge fixed it, and a UI test now drags the slider both ways.

## 2026-11-05 — No tooltip on a fresh mark

Three days later, "pick after drawing" is gone. Lift your finger and the new mark gets its two range handles, nothing else. It is drawn exactly as the bottom tool row says.

![A fresh highlight with only its two handles, no tooltip; the highlighter tool is on in the bottom row](/blog/superpdf-hand-drawn-styles/new-underline-handles-only.png)

The screen changed in between: tools moved to one row at the bottom, and tapping a tool turns that row into its style, weight and color settings. With settings always in reach, choosing before drawing is natural, and a tooltip popping up after every stroke only re-asked what you had just chosen. The handles stayed, because a range that is a word short is something you notice right away. The tooltip now opens only when you tap an existing mark, and what you pick there changes that mark only; the bottom tool row sets the default. UI tests draw on both the paged and the scroll board and check that no tooltip appears.

## 2026-11-07 — Pen shapes for marks: ends that taper

Until now all four line marks were even-width, like a ballpoint. The handwriting pen already had fountain and ballpoint; the marks did not. The weight popover now has the same choice under the wobble slider.

![Weight popover with ballpoint and fountain options, nib sharpness and nib flatness sliders, and tapered underline and circle samples](/blog/superpdf-hand-drawn-styles/pen-shape-popover.png)

- **Ballpoint** — even width, exactly as before, and the default.
- **Fountain** — *nib sharpness* thins both ends (down to 15% of the width at 100); *nib flatness* imitates a flat nib held at 45°, so width changes with direction. On a circle that reads like a brush stroke.

![A fountain-pen circle whose tail thins out](/blog/superpdf-hand-drawn-styles/fountain-circle.png)

It uses the same width formula as the handwriting fountain pen, minus pressure: a mark is computed from the text line, so there is no force to read. Fountain marks are drawn as filled outlines with per-point width instead of a stroked line, computed in screen space so a rotated scan still gets a screen-aligned nib. The setting lives next to the wobble in the mark's small versioned JSON; older marks read as ballpoint, and a test checks the ballpoint path is unchanged point for point. Not yet tried with a Pencil on a real device.

## History

- 2026-11-02 — Five line styles, hand-drawn marks, a tooltip after drawing
- 2026-11-03 — Round ends on the circle, overlap on the top side
- 2026-11-03 — Wobble slider (0–100), popover arrow no longer pinned
- 2026-11-05 — Fresh marks get handles only; the tooltip is for tapped marks
- 2026-11-07 — Pen shapes for marks: ballpoint / fountain (nib sharpness, flatness)
