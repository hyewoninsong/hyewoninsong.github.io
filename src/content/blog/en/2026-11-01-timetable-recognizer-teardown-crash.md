---
title: "The app died as a sheet closed, and the cleanup line was the cause"
date: 2026-11-01T02:00:00+09:00
app: "timetable"
tags: ["devlog", "swiftui", "gesture"]
summary: "Closing the edit sheet with a finger still on screen could abort the app. removeGestureRecognizer cancelled the touch on the spot, and the callback wrote to state that was being torn down."
---

If another finger was on the screen while the edit sheet closed, the app could crash. Now the touch callbacks are cut first, so the sheet just goes away.

## It looked like a crash on a plain assignment

The crash summary pointed at `handleWindowTouchEnd`, on `isAlarmMenuPresented = false`. No force unwrap, no array index. From the summary alone I suspected the touch cancellation that happens when a menu opens. That guess was wrong.

The full stack told a different story:

| # | What happened |
|---|---|
| 1 | The sheet's hosting view is deallocated |
| 2 | The SwiftUI graph tears down and calls `dismantleUIView` |
| 3 | That removes our window-level recognizer |
| 4 | UIKit cancels the tracked touch before the call returns |
| 5 | The touch-end callback writes to `@State` |
| 6 | The Swift exclusivity check in `swift_beginAccess` aborts |

Step 4 is the surprise: a call that reads as cleanup re-entered our callback. The recognizer lives on the window so it still sees touches that system menus swallow, which means it can be tracking a finger anywhere on screen.

## Cut the callbacks first

`dismantleUIView` now clears the callbacks before it removes the recognizer. Deferring the callback with `DispatchQueue.main.async` would also have worked, but it would delay every live decision by a beat, including menu state and forwarding a swallowed save tap.

The panel drag recognizer has the same shape, so it got the same treatment. That one is a judgment from reading the code, not a path in the crash stack.

## I did not confirm a reproduction

Tests can't create a real `UITouch`, so a host view calls `touchesCancelled` from inside `removeGestureRecognizer` to mimic UIKit. That test fails without the fix. Two simulator probes that held a press while the sheet closed didn't crash, but they left no logs either, so they prove nothing. The evidence for the fix is the crash stack.

## What to watch

The real check is whether this issue stops in Crashlytics after release. From now on, I assume a recognizer's callbacks can fire during removal, and I read the system frames above the app frame first when a SIGABRT shows up.
