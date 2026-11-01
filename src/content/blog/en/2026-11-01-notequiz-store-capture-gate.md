---
title: "The capture test passed, and a system popup shipped in our store cards"
date: 2026-11-01T14:24:02+09:00
app: "notequiz"
tags: ["devlog", "android", "appstore"]
summary: "All six Korean tablet screenshots went live with an ANR dialog on them. The check that ran once before capture now looks at every window before every shot."
---

All six Korean tablet screenshots on our Play listing carried a "Pixel Launcher isn't responding" dialog. No automated check caught it; someone flipping through the store page did.

## What changed on the cards

![The Korean tablet card with the dialog dimming the app](/blog/notequiz-store-capture-gate/card-with-dialog.png)

![The same card with no dialog](/blog/notequiz-store-capture-gate/card-clean.png)

We rechecked all 180 cards with OCR and contact sheets. The dialog was only on those six images, which fill both the 7-inch and 10-inch slots.

## The check looked at the wrong moment and the wrong window

We had met this dialog before. Last time it took input focus, the quiz stopped, and the test timed out. So the script gained a check: if the focused window is an ANR dialog, stop.

This time that check saw nothing. It ran once, before install, and read only the focused window. The dialog broke nothing: the quiz finished, the test passed, and six valid PNGs were saved. A popup that causes no failure trips no check.

## Every shot, every window

The test now reads the full window list from `dumpsys window windows` right before each screenshot and fails the run on an `Application Not Responding` or `Application Error` window. We confirmed the window title against a real dialog raised on the tablet emulator. Filtering finished cards with OCR would also work, but blocking at capture means the bad file never exists.

## Two smaller finds

The Korean phone cards had lost their wifi icon. It went missing on the first capture after a cold boot and came back on the second. We don't know why yet, and it doesn't show at contact-sheet size, so we now compare status-bar crops across languages.

Reframing one language also overwrote the other nine tablet sets with caption-only cards, because the compositor draws every language in the plan and only warns about missing captures. We caught it from the changed-file count before uploading, and only languages with raw captures are replaced now.

## Where it stands

The Korean files are recaptured and published, and all 180 hashes on Play match the repo. The status-bar comparison is still done by eye.
