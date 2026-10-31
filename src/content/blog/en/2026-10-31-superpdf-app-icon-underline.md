---
title: "The app icon lost its mind map: one page, one underline"
date: 2026-10-31T16:20:00+09:00
app: "superpdf"
tags: ["devlog", "design"]
summary: "A page with three coloured dots branching off it collapsed to just the dots at 60pt. The new icon is a folded-corner page filling the canvas with a single yellow stroke under the middle line. Why the highlighter fill and the blue stroke lost."
---

SuperPDF's icon used to show a PDF page with a line running out to a blue root node and three coloured children. That was the September app, where underlines fed a mind map. By October the app's centre of gravity had moved to drawing coloured underlines while reading, so the icon now shows only that one action.

![The new icon: a page with a single yellow underline](/blog/superpdf-app-icon-underline/icon-underline.png)

## Draw only what survives at 60pt

At 1024pt the old icon told the whole story. On the home screen it is 60pt, and there the page became a grey smudge and only the dots were left. Nothing said "draw a line".

The new icon has three things: a folded-corner page at 660×820 on the 1024 canvas, three text bars with the middle one darker, and a 52pt yellow stroke under that middle bar, slightly curved and overshooting the text at both ends so it reads as hand-drawn rather than ruled.

## Four candidates at three sizes

The render script takes a variant name, and a contact sheet draws the current icon and three candidates at 256, 120 and 60pt behind the iOS corner mask. Judging a single 1024 render hides what falls apart at 60pt.

![Current icon and three candidates side by side at 256, 120 and 60pt](/blog/superpdf-app-icon-underline/candidates-three-sizes.png)

- **Highlighter fill** (a yellow box behind the text): at 60pt the dark bar inside a yellow box looked like a text field. The app's default style is the underline anyway.
- **Blue underline** (the app's accent): legible, but yellow reads as "marker" instantly and continues the old icon's yellow highlight.
- **No page, just lines**: in September a flattened page had been reverted because the folded corner is what makes it read as a document. The page stayed.

The first pass used a 560×700 page. At 60pt the page was still small and the stroke sat too close to the text bar, so the page grew to 660×820, the stroke went from 40 to 52pt, and the gap from 46 to 62pt. Anything that vanishes at 60pt does not exist, however good it looks at 1024.

## What is left

White background and iOS system colours are unchanged from September. No iOS 26 layered glass icon yet; a single 1024 PNG still ships, and whether the layers are worth it gets decided on a device.

## History

- 2026-10-31 — Mind map removed; page plus one underline. Three candidates compared.
