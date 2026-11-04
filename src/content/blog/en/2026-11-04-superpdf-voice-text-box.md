---
title: "Dictating into a text box — Apple's new recognizer or a separate speech model?"
date: 2026-11-04T14:12:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui"]
summary: "The text box bar got a microphone. iOS 26's on-device recognizer does the transcribing, and the on-device language model fixes punctuation and fillers when you stop. We wanted the feel of Claude's voice input, and it turned out that feel comes from the cleanup, not the recognizer."
---

Open a text box on a page, tap the microphone instead of typing. Words fill in at the cursor while you speak; tap again and the sentence gets tidied up.

Before building it we had to pick: use what Apple provides, or ship a speech model inside the app. The bar was Claude's voice input, which turns rambling into punctuated sentences.

## One microphone, one status line

The mic sits next to the shade button in the text box bar. Tap it and a status line appears above the bar while the mic turns red. The not-yet-final tail shows in a lighter tone and switches to the text color when it settles. If there is text before the cursor, a space goes in first.

![Listening: red mic, a "listening" status line, dictated text in the box](/blog/superpdf-voice-text-box/mic-listening.png)

Tap again and the on-device language model polishes what was dictated: punctuation, spacing, fillers like "um" removed. Then the status line shows "Original". One tap brings back the raw transcript. Start editing by hand and the button goes away.

![After polishing: "Polished the dictation" with an Original button](/blog/superpdf-voice-text-box/polished-restore.png)

| Moment | What you see |
|---|---|
| First tap | Permission and model check; a download percentage if the model is missing |
| Listening | Red mic, lighter unfinished tail, typing is blocked |
| Second tap | A polishing spinner, then "Original" |
| Settings | An "Polish dictation" toggle in the AI section, on by default |

## "Siri dictation" is really two things

The keyboard's mic uses the old `SFSpeechRecognizer`. The text box is a `UITextView`, so that already worked without a line of code, and its quality is exactly why the question came up.

iOS 26 added `SpeechAnalyzer` with `SpeechTranscriber`: a new on-device model with long-form input, automatic punctuation and streaming partial results. The system downloads and manages the model. The app feeds microphone audio and reads results. If the device language is not in its list, the app falls back to `DictationTranscriber`, which covers the old dictation languages.

## Why no separate model

The app already links sherpa-onnx for read-aloud, so loading SenseVoice or a Korean Zipformer would have been easy. We did not, for three reasons.

- Models weigh hundreds of megabytes. Loaded next to the read-aloud model they squeeze memory while a large scanned book is open.
- Streaming partial text would have to be built by hand. Apple's recognizer gives it away.
- Nothing showed them beating Apple's new model on Korean. Small Whisper models are weak in Korean and the large ones are slow on a phone.

And the decisive point: the quality of Claude's voice input is not recognition accuracy. It is a server model, out of reach for anything on-device. What you actually notice is punctuation, spacing, filler removal and sentence cleanup, and the on-device language model already wired into the app can do that. Leave recognition to Apple, add the cleanup ourselves.

If technical vocabulary turns out to be a problem, a trial recognizer can sit beside Apple's the same way the read-aloud engine sheet already offers neural voices side by side.

## Polished text is counted before it is accepted

A day earlier the same on-device model had dropped real headings from a printed table of contents. The same can happen to dictation: a sentence deleted, a phrase invented.

So the polished text is measured first. Counting letters without spaces and punctuation, anything below half or above 1.3 times the original is discarded and the raw transcript stays. Filler removal never deletes half the words, and polishing never adds content. That check plus the Original button keep the model optional. A wrong answer never loses what was said.

## It does not run in the Simulator

The Simulator has no microphone and the new recognizer reports an empty language list there. A test switch feeds a fixed transcript from volatile to final, which covered insertion, the leading space, polishing, Original and the toggle turned off.

Whether Korean is in the new recognizer's list, whether final chunks arrive with spaces between them, and whether the permission prompts appear on time still need a real device. Until then this is a record of a design, not a promise about quality.

## History

- 2026-11-04 — Text box microphone, new recognizer plus on-device polishing
