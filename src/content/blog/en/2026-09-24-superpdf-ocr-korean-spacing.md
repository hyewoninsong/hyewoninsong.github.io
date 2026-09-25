---
title: "Recovering the spaces OCR dropped from glyph positions"
date: 2026-09-25T09:30:00+09:00
app: "superpdf"
tags: ["devlog", "data"]
summary: "Quotes from underlined scans came out as one long run of Korean syllables. Half the spaces were dropped by Vision; the other half we deleted ourselves. The string is wrong, but the glyph boxes are still right."
---

Underline a scanned page in MindPDF and the app runs OCR on that region to keep a quote. Reading mostly Korean scans, I kept getting quotes with no spaces at all. A quote you cannot split into words is useless when you come back to reread only your underlines. Two causes, and one of them was ours.

## A rule meant to fix split syllables was breaking normal sentences

OCR is Apple Vision, `VNRecognizeTextRequest` at `.accurate`. The Korean model sometimes returns text split into single syllables, and the post-processing had a rule for that: **if more than half the tokens are single Hangul characters, delete every space between Hangul.**

Korean is full of one-character particles. A perfectly normal five-token sentence has three one-character tokens and trips the rule. Short drag selections have few tokens, so they tripped it most, and once tripped every real space was gone too. The rule now only fires when there are at least four letter or digit tokens and *every* one of them is a single character (it started as Hangul-only; the September 25 note explains why it grew). A post-processing step that deletes cannot be undone, so its condition must be one an ordinary sentence can never satisfy.

## Vision drops the space but keeps the box

Even with the rule gone, Vision's Korean model often omits word spaces; Korean word gaps are subtler than English ones, and the result is one string per line. But `VNRecognizedText.boundingBox(for:)` returns a box for any character range. Fetch every glyph's box, measure the gap to the next glyph, and insert a space where the gap exceeds 0.32 times the median glyph width. In body text, word gaps sit around 0.35em and intra-word gaps under 0.15em, so any line between them separates the two.

| From Vision | After reflow |
|---|---|
| 나는학교에간다 | 나는 학교에 간다 |
| 서울2024년 | 서울 2024년 |
| 나 는 학교 에 간다 | unchanged |
| 나 머 가 먼 지 를 (wide tracking) | 나머가먼지를 |

The reflow is conservative. Existing spaces are never removed. Pairs without Hangul, Latin, digits, punctuation, are left as Vision returned them. Only a fully syllable-split line discards its spaces and re-decides from geometry, treating a gap as a word boundary when it is 1.8 times the line's median gap, since wide tracking widens every gap. If per-glyph boxes are unavailable, the original string comes back untouched, unless the line is character-split, which is joined even without boxes (September 25 note).

## What lost

Cloud OCR (CLOVA, Google Vision) spaces Korean better, but this app promises the books never leave the device. Apple's on-device language model in iOS 26 could correct spacing, but it needs Apple Intelligence enabled and might alter characters in a quote. Geometry uses data already in hand, changes no characters, and works offline. If it proves insufficient, a language model pass can go after it.

## Tested with synthetic boxes and real Vision

The reflow is a pure function, so the table above is pinned with hand-built boxes. One more test renders a Korean sentence into an image with the system font, runs it through the real Vision pipeline on the simulator, and expects the exact original string back. What it actually tests is the Mac's Vision model, though: the simulator runs the host frameworks. I learned that the next day.

The 0.32 threshold is tuned for body text. Handwriting or extreme tracking will be the first place to revisit it. Spacing that only context can decide is left to a language model.

## 2026-09-25 — the phone splits Latin letters too, and the Mac never showed it

The same bug came back from an iPhone running the fixed build, this time with the file and a screenshot. Map quotes read "o m m a n d , 델 타 압 축 등" and "U n i t y P h y s i c s , E n t i t i e s": every glyph spaced, Latin included, and the real space in "Unity Physics" indistinguishable from the rest.

![Map nodes whose quotes are spaced after every character, Korean and Latin alike](/blog/superpdf-ocr-korean-spacing/map-split-quotes.png)

The same PDF rendered the same way on the Mac (3x, capped at 2048px) through the same `VNRecognizeTextRequest` settings comes back correctly spaced, whether the whole page or just the dragged strip. Forcing Japanese or Chinese recognises nothing, so it is not a language misdetect. Nothing in the app applies tracking or joins characters with spaces. That leaves one explanation: the phone's Vision model tokenises this text per glyph. The simulator test that "runs real Vision" runs the Mac's model, so it never said anything about the device.

The geometry story needs a correction as well. On the Mac, `boundingBox(for:)` returns boxes that are uniform slices of the line box: zero gap inside a word, about 0.2em where a space is. The boxes echo Vision's own spacing rather than measuring the glyphs. Yesterday's reflow passed on the Mac because the string was already right, and did nothing on the phone because the string was wrong.

| From the phone's Vision | Now |
|---|---|
| o m m a n d , 델 타 압 축 등 | ommand, 델타압축등 |
| U n i t y P h y s i c s , E n t i t i e s | UnityPhysics, Entities |
| 나 는 학교 에 간다 | unchanged |

A line now counts as character-split when it has four or more letter or digit tokens and all of them are single characters, in any script. Such lines drop their spaces; letters join unless the boxes show a clearly wider gap, and punctuation follows a fixed rule (space after commas and periods, none inside brackets or between digits). Quotes already saved are repaired once when the file opens, along with nodes that used the quote as their title; hand-edited quotes are left alone.

Word spaces are still lost. To get them back I need the phone's actual strings and boxes, and no device was attached this time. The wider lesson: Vision, Speech and CoreML in the simulator are the Mac's models. Post-processing of model output should start from device output, and when it cannot, say so and keep only rules that are harmless under both.

## History

- 2026-09-24 — removed the space-deleting rule, recovered word boundaries from glyph boxes
- 2026-09-25 — confirmed the phone splits Latin too; join split lines without boxes, repair stored quotes
