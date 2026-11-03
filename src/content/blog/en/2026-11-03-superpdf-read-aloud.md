---
title: "SuperPDF reads the book aloud and turns the page when it's done"
date: 2026-11-03T21:20:25+09:00
app: "superpdf"
tags: ["devlog", "swiftui"]
summary: "One button reads from the current page and keeps going, page after page. Why it uses on-device voices rather than a cloud TTS, why the text never comes from the document on screen, and four on-device neural voices added side by side for testing."
---

You can now look away from the page. Tap the speaker button in the lower toolbar and SuperPDF reads from the current page, turns the page when it finishes, and keeps reading.

Scanned books already have line-by-line text from the app's own OCR, so everything needed to read them aloud was already there.

## The line being read is marked on the page

While reading, pause, speed, and stop take the place of contents and bookmarks. The current line gets a faint blue band. It moves line by line, not word by word, because a band jumping on every word is harder to follow.

![Reading a scanned page — a faint blue band on the second line, pause, 2.0×, and stop in the toolbar](/blog/superpdf-read-aloud/reading-line.png)

| To | Do |
|---|---|
| Start | Speaker button, from the current page |
| Pause / resume | The play-pause button, also on the lock screen |
| Speed and voice | The `1.0×` menu: 0.75× to 2×, voices for the page's language |
| Jump | Turn to another page by hand; reading restarts there |
| Stop | The square button, or close the book |

Reading continues with the screen off. A phone call pauses it, and it does not resume on its own afterwards.

![Speed menu with six steps from 0.75× to 2.0×](/blog/superpdf-read-aloud/speed-menu.png)

## On-device voices, not a cloud TTS

Cloud voices sound better. We still started with `AVSpeechSynthesizer` (and added on-device neural voices the same evening, below):

- A book has hundreds of thousands of characters, and cloud TTS is billed per character.
- SuperPDF never sends the books you read off your device. A cloud voice would break that.
- Reading on the subway shouldn't stop when the signal drops.

Enhanced and Premium voices make a big difference. You download them in Settings › Accessibility › Spoken Content › Voices, and the voice menu shows that path. Personal Voice shows up once you allow it.

Each page is spoken as one utterance. Speaking line by line would break every sentence at each line break.

## The text never comes from the document on screen

PDFKit's Live Text attaches a per-character text layer to scanned pages on screen. We already got caught by this once, when quotes were saved as "D e l t a". Read aloud, that would come out one letter at a time. So the text comes from a second copy of the file opened just for reading. Scanned pages use only the app's own OCR lines, and a page that hasn't been recognized yet moves to the front of the queue.

Running heads and page numbers are skipped: short lines in the top and bottom 7% of the page. Words hyphenated across a line break are rejoined.

## The scanned book stayed silent at first

In the simulator, the text PDF read page 1 and moved to page 2. The scanned book stayed silent. OCR on its own read all 34 lines in two seconds. The log showed reading had never started: the button had been tapped before the book finished opening, and it did nothing. The button is now disabled until the book is open. A button that does nothing looks broken.

## What's left

The simulator only has one basic Korean voice. Enhanced and Premium voices, lock-screen controls, and pausing for phone calls still need checking on a device. Two-column layouts are read in the order recognition returns them.

## 2026-11-03 evening — four neural voices that run on the phone

System voices are free but flat. Cloud voices sound natural but cost money per character. Free neural models that run on the phone sit in between. Which one sounds best is something you have to hear, so instead of picking one, all four are in the app for side-by-side testing.

**Voice engines…** in the speed menu opens a sheet. Each model can be downloaded, removed, and selected, and you can hear the same sentence in Korean and English. The sample also shows time to first sound and how long synthesis took per second of speech. Under 1 keeps up with reading.

![Voice engine sheet: system voice, Supertonic 2 and 3, each with download, remove, select, and Korean and English samples](/blog/superpdf-read-aloud/engine-sheet.png)

| Model | Download | Languages | Synthesis per 1 s of speech (Mac) |
|---|---|---|---|
| Supertonic 2 | 85 MB | Korean, English | 0.06 s |
| Supertonic 3 | 129 MB | 31 languages | 0.16 s |
| Kokoro | 350 MB | English | 0.54 s (0.31 s on 4 threads) |
| MeloTTS | 163 MB | English | 0.46 s |

If the chosen model can't read the page's language, that page uses the system voice, and the menu says why.

![After a sample: "first sound 1.7 s, 0.32 s per second of speech" under Kokoro](/blog/superpdf-read-aloud/engine-sample-timing.png)

All four run on one open-source runtime, **sherpa-onnx**, built from source for iOS. It has no official iOS binary, and a third-party prebuilt package broke often. Models are downloaded on first use rather than bundled (700 MB for all four). They ship only as `.tar.bz2`, which iOS can't open, so the app decompresses them with the system `libbz2` and streams the tar entries straight to disk. Speech is synthesized one sentence at a time, two sentences ahead. Neural models don't report word positions, so the line marker is estimated from elapsed time.

Two things didn't go as expected:

- **MeloTTS can't speak Korean on a phone.** The Korean model runs a 581 MB BERT on every sentence and needs a morphological analyzer for pronunciation. Nobody has exported it to ONNX. Only the English MeloTTS is included.
- **Kokoro's int8 model was slower than the full fp32 one.** It took 0.90 s per second of speech, against 0.54 s for fp32, barely keeping up with reading. The app downloads the bigger model and uses four threads.

None of this has been measured on an iPhone yet. The sample timings in the sheet are how to choose on a device.

## History

- 2026-11-03 — read aloud with system voices, automatic page turns, scanned pages from OCR
- 2026-11-03 evening — four neural voices for testing, with samples and synthesis speed
