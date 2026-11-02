---
title: "Underlines were ruler-straight. Now four marks look hand-drawn, and you pick the style after you draw"
date: 2026-11-03T00:25:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "SuperPDF grew from two line styles to five: highlighter, underline, strikethrough, circle, box. The lines wobble like a pen stroke with a per-highlight fixed seed, and a tooltip opens right after you draw so you can switch."
---

Draw across a line of text in SuperPDF, lift your finger, and a small tooltip appears next to it with five styles: highlighter, underline, strikethrough, circle, box. The four line styles are no longer ruler-straight. They wobble slightly and overshoot at the ends, the way a pen does on paper.

## Five styles, all per line

There were two styles, a filled highlighter and an underline. Strikethrough, circle and box are new, and every one of them is **per line**. Select three lines and choose circle, and each line gets its own oval rather than one big oval around all three.

![Strikethrough, circle and box drawn one per line; the circle is selected with its range handles](/blog/superpdf-hand-drawn-styles/circle-line.png)

Line weight (thin, regular, bold) now applies to all four line styles. The storage model did not change. Styles are stored as strings, so an older build that meets a new value simply shows it as a highlighter.

## The wobble is a fixed random seed per highlight

| Style | How it is drawn |
|---|---|
| Underline, strikethrough | Three low-frequency sine waves added together; starts 1–2pt early, ends 1–3pt late; a ribbon that is thicker in the middle. |
| Circle | Starts on the left, goes once around plus 15–30 degrees, drifting outward by the stroke width so the end passes over the start. |
| Box | Four separate strokes, each corner overshooting by 0.5–2pt. |
| Highlighter | Unchanged: a translucent rectangle. |

The seed is the **highlight's id**. Fresh randomness on every draw makes lines shiver on scroll and zoom, and the same underline would look different on the paged board and the scroll board. Seeded by id, it is the same shape everywhere, every time. The amplitude is tied to the line weight and stays around 1pt, which is as far as it can go before a page with dozens of underlines looks messy.

Paths are built in a "line space" whose origin is the top-left of the text line, y pointing down, in screen points. The caller supplies the transform into the view. Rotated scans still get "below the line" right, and the wobble stays the same size on screen at any zoom.

## Pick after drawing, and the pick becomes the default

Before, you chose the style in the toolbar **before** drawing. Changing a drawn line meant switching to the select tool and tapping it again. Now the tooltip opens the moment you lift your finger.

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
