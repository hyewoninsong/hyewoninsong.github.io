---
title: "Two crash reports from testers: one redrew a deleted node, one died inside UIKit"
date: 2026-10-30T08:10:33+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "uikit"]
summary: "Two TestFlight crashes, fixed. Undoing a pen stroke made the mind map draw the node it had just deleted, and dragging diagonally on the first or last page made UIKit try to turn to a page that does not exist. The first one reproduces in a test; the second never reproduced, so its trigger is now blocked."
---

Undoing handwriting in SuperPDF no longer closes the app, and turning pages no longer occasionally takes the whole app down with it. Both bugs came from reports testers sent from the crash prompt.

## Crash logs come straight out of App Store Connect

When a TestFlight tester sends feedback right after a crash, it lands in the App Store Connect API. The app's `betaFeedbackCrashSubmissions` list gives the device, the OS and the tester's comment, and each submission's `crashLog` returns the raw `.ips` file. You don't need to plug the phone in. The list only holds crashes a tester chose to send, though, so it can be empty while the app is still crashing.

## Undo made the map redraw the node it had just deleted

Undoing handwriting also deletes the mind map node made from it. Undo removes the SwiftData model directly, and the map rebuilds its node list afterwards. In between, SwiftUI draws the old node one more time.

For text nodes that's harmless, because ordinary attributes stay readable after deletion. Handwriting nodes draw a thumbnail stored with `@Attribute(.externalStorage)`, and that attribute is loaded from the store on every read. A deleted node has no store to load from, so SwiftData stops the app with an assertion.

The fix: before drawing, check whether the node is gone (`isDeleted`, or it was saved once and no longer has a context), and if it is, draw an empty cell. The test saves an image node to a disk store, deletes it, saves again, and renders the node view. With the guard off, the test process dies with the same message as the tester's log. Every earlier delete test had used text nodes, which is why we missed it.

## The second log had no frame from our code

The top of the stack was the pan handler in `UIPageViewController`, with a UIKit method rejecting the number of pages it was given. No amount of simulator dragging, tapping or button-and-swipe combinations reproduced it.

It turned out to be a known UIKit bug. A page-curl pan picks its direction from how far the finger has moved. If there is almost no horizontal travel, it can pick the wrong direction. That happens with diagonal or vertical drags, and with float error of around 1e-13 pt on a zoomed view. On the first or last page the data source then returns `nil`, and UIKit starts the turn anyway and fails.

So the turn now has to pass a check before it starts. A small gate sits in front of the pan's delegate and only lets the turn begin when:

- the finger has moved at least 1 pt horizontally,
- there is a page in that direction,
- it is not a mostly vertical drag at the first or last page,
- no other turn is still running.

Everything else is passed through to UIKit unchanged. We considered two other fixes. A blank page at each end would stop the crash but add a page the book doesn't have. A timing heuristic from the forums uses a hand-picked threshold that quick taps can still get past.

## What is left

The page-turn fix blocks the cause without a local repro. The real test is whether the next TestFlight build stays quiet.
