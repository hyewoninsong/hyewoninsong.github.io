---
title: "Recovering the spaces OCR dropped from glyph positions"
date: 2026-09-25T14:00:00+09:00
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

## 2026-09-25 — the splitter was PDFKit Live Text, not Vision

The same bug came back from an iPhone running the fixed build, this time with the file and a screenshot. Map quotes read "o m m a n d , 델 타 압 축 등" and "U n i t y P h y s i c s , E n t i t i e s": every glyph spaced, Latin included.

![Map nodes whose quotes are spaced after every character, Korean and Latin alike](/blog/superpdf-ocr-korean-spacing/map-split-quotes.png)

The same PDF through the same Vision settings on the Mac came back correctly spaced, and nothing in the app joins characters with spaces. In the morning I concluded the phone's Vision model tokenises per glyph and shipped a string-level join. The premise that the simulator runs the Mac's Vision was right; the conclusion was wrong.

What corrected it was a diagnostics sheet in the app: a temporary export-menu item that recognises the current page with six request variants and prints raw strings, glyph boxes and post-processed text. On the phone, Vision was clean in all six. But the report header said "text layer: 301 characters" on a page the file has zero text for.

Since iOS 16, `PDFView` runs Live Text OCR in place on image pages as you interact with them, with no public switch, and the resulting text layer positions every glyph separately, so `PDFSelection.string` comes back per-glyph spaced. The app had correctly judged the file as scanned when opening it, but when a highlight was drawn it asked the **on-screen document** whether the page had text. By then Live Text had added a layer, so it took the text-page path and stored that string. Our own OCR never ran. The Mac experiment read `page.string` without a view, so it never saw Live Text either.

| Source | Example |
|---|---|
| PDFKit Live Text selection string | o m m a n d , 델 타 압 축 등 |
| Our Vision OCR, same page, same phone | Command, 델타 압축 등 필수 기능을 모두 |

Three fixes. Scanned files ignore the text layer and always take the OCR paths; a text document does too when the selected string is character-split. Stored split quotes are replaced with the intersecting OCR lines as pages finish, or on file open from the cache, so word spaces come back. The morning's string join stays only as the last resort where no OCR lines exist.

Two lessons. The on-screen `PDFDocument` is not the file: decide "has text" from a separately opened document or a stored flag, and treat on-screen strings as possibly Live Text. And do not diagnose a device-only symptom before you have device data; one temporary diagnostics sheet ended two days of guessing.

## History

- 2026-09-24 — removed the space-deleting rule, recovered word boundaries from glyph boxes
- 2026-09-25 — traced the split quotes to PDFKit Live Text text layers with an on-device diagnostics sheet; scanned files now take OCR paths only, stored quotes refilled from OCR lines
