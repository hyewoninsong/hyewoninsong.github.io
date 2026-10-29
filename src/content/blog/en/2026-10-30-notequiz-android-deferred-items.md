---
title: "We reopened the 'too small, later' list — the first correct answer sounded 0.3 s late"
date: 2026-10-30T02:24:42+09:00
app: "notequiz"
tags: ["devlog", "android"]
summary: "Nine items left over from matching the Android note quiz to iOS, reopened the same day. Two had been deferred for the wrong reason, and one was an iOS bug."
---

Every pass that matches the Android note quiz to iOS leaves a "not this time" list. This time we reopened it the same day, and some of the reasons on it turned out to be guesses.

## "Latency not measured" — so we measured it

iOS wakes its audio engine when the quiz appears. Android built the tone on the correct answer. From the tap to `AudioTrack.play()`:

| Case | Time |
|---|---|
| First tone after launch | 318 ms |
| A note not built yet | 35–54 ms |
| A note already built | 15–18 ms |

A third of a second puts the pitch a beat behind the green key. The cost is the audio client starting up. Building a track without playing it did not get rid of that cost. One silent 256-sample buffer per process, plus building each question's tone when the question changes, brings every tone to about 6 ms.

## "Needs a wider touch area" — it already had one

iOS widens its 32 pt Easy | Hard pill to a 44 pt touch target. Compose already extends any clickable smaller than 48 dp to that size in hit testing, without changing the layout. A test that taps 6 dp outside the edge passed on its first run. No code was needed, and the test stays in so we notice if that ever stops being true. `minimumInteractiveComponentSize()`, our first idea, would have made the pill itself 48 dp tall.

## An iOS-only behaviour was an iOS bug

On the last question, iOS dims the other six keys after a correct answer, even though its own decision record says a correct answer never dims. The flag that blocks input at the end of a round was also being read as the ladder lock, and the ladder lock dims the keys. Android follows the decision record, and the bug is filed on the iOS repo.

## The big one: the staff now morphs between questions

![Four frames: the note head slides up while a ledger line grows from its centre](/blog/notequiz-android-deferred-items/staff-morph-frames.png)

The five lines stay where they are. The note head slides across and up, ledger lines grow or shrink by position, the last ladder's hints fade, and a new clef cross-fades in. One catch: if you notice the change in `LaunchedEffect`, you are too late. The first frame has already drawn the new answer at rest, and in a quiz that is a one-frame spoiler. The last drawn position is kept outside state, and the change is caught during recomposition, before anything is drawn. A paused-clock test checks the frame 120 ms in.

## The one that needed a decision

![Ink thanks card with a single You're Welcome button](/blog/notequiz-android-deferred-items/review-thanks-card.png)

The review thanks card really did need its own decision, because it adds a new dependency (Play In-App Review). After three days of use and five saved sessions, a letter appears once per version. Closing it asks Play for its rating sheet. The card never asks for a rating, and it has to make sense even when Play shows nothing.

## Where it stands

The ladder stages' morph is still unseen on screen and sits in the manual test catalog. From now on, a "deferred" line gets a measured number or a checked method next to it, not just a reason.
