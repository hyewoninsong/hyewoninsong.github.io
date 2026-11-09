---
title: "It looked like adding PDFs crashed the app. It froze the moment the list opened."
date: 2026-11-10T02:12:49+09:00
app: "superpdf"
tags: ["devlog", "swiftui"]
summary: "On the unfolded iPhone Duo, opening a book's PDF list turned the screen white until the system killed the app. The crash log had none of our code. With the phone plugged into the Mac and a debugger attached, one list view turned out to be redrawing 590 times in 30 seconds."
---

Opening a book's PDF list now just works. Before this fix, tapping the list button on an unfolded iPhone Duo froze the screen white, and a few seconds later the app was gone. The bug was reported as "it crashes when I add several PDFs". The app never got as far as importing anything.

## A crash log with no app code

The log on the phone wasn't a crash at all. It was `0x8BADF00D`, the watchdog killing an app that hadn't finished a scene update within 10 seconds. The main thread showed more than 80 SwiftUI and AttributeGraph frames. The only app frame was `main` at the bottom.

## Debugging on the device

With the Duo on USB, we installed a debug build and attached `lldb`. While a debugger is attached, the watchdog doesn't kill the app, so the frozen state stays around long enough to inspect.

- **Interrupting the app 15 times** found the same place every time: layout inside the run loop's commit. None of our code was on the stack. Layout was running over and over, not stuck in one long pass.
- **Auto-continuing breakpoints counted the redraws.** In about 30 seconds the PDF list's `body` ran 590 times. Its parent view ran zero times, and so did the rows.
- **`_printChanges()` printed one line 29,782 times:** `PDFListView: _selectedPDFFile changed.`

The list received the open file as a `Binding(get:set:)` built on the spot. Its getter returned a SwiftData model. SwiftUI treated that binding as changed on every update, so the list body ran, layout ran, and the binding counted as changed again. We confirmed the loop. We did not confirm why the same model never compared as equal.

## Values and callbacks instead of a binding

The list now takes the open file's `UUID` as a plain value, plus `onSelectPDF` and `onClearSelection` callbacks. On the same device, the list body ran nine times and stopped. As a bonus, tapping a row no longer loads the PDF twice. The binding's setter and the callback had both been loading it.

This is the second time in this app that handing a child something it can't compare made the screen redraw forever. Pass comparable values down and send actions back up as callbacks.

## Catching a freeze on a real device

- **Check the kind of report first.** `0x8BADF00D` with no app frames means a hang, not a crash.
- **Keep the phone unlocked.** If it's locked, launching and attaching both fail without saying why.
- **Count `body` calls with breakpoints.** App code is only on the stack for an instant, so sampling misses it.
- **Use `print`-based output such as `_printChanges()`.** `os.Logger` output doesn't show up in the device console stream.
