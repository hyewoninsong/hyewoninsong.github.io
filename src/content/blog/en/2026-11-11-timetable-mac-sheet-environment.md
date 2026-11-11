---
title: "The menu did nothing — because the app was crashing and relaunching"
date: 2026-11-11T16:56:20+09:00
app: "timetable"
tags: ["devlog", "swiftui", "mac"]
summary: "On the Mac build of the timetable app, the timetable list would not open. The sheet never received the window's shared objects, so the app crashed. It was the same root cause as the popover bug fixed that morning."
---

We are bringing the timetable app to the Mac with Mac Catalyst. This round we opened the menu bar, every sheet and the smallest window size one at a time. The timetable list would not open on the Mac, and a few menu items and settings did nothing there.

## The list wasn't ignoring the click — the app was dying

Choosing View › Timetables did nothing visible. Logging showed that the presentation state did flip to `true`, but the body of the sheet's content view never ran. A plain `Text` sheet opened fine.

Then we tried to sample the process and it was gone. The diagnostic reports folder had one crash per click:

```
_assertionFailure
EnvironmentValues.subscript.getter
```

The list sheet reads a per-window `@Observable` object with `@Environment(SceneState.self)`. On iPad the sheet inherits it from the view that presents it. On the Mac it does not, so the read trips an assertion. The app relaunched right away, which made the crash look like an unresponsive menu.

That same morning we had fixed the same failure for the edit popover. We did not open the sheets at the time.

## The fix: the presenter passes the objects in explicitly

The popover wrapper now has a sheet version. On the Mac, the presenting view reads the ten shared root objects and injects them into the sheet's content. iOS keeps the plain `.sheet`. Every popover goes through the wrapper. A sheet needs it only when it reads a per-window object; settings, print and export sheets do not, and they worked unchanged.

## Removing things that do nothing on a Mac

- **File menu**: the app declares a `.supertimetable` document type, so the Mac added Open, Open Recent, Duplicate, Move, Rename and Export As. This is not a document-based app, so all of them sat disabled. `CommandGroup(replacing: .saveItem)` does not remove them. Removing the `.open` and `.document` menus in the app delegate's `buildMenu` does.
- **Sound & haptics card**: the only sound the app makes is the alarm-sound preview, and the Mac build has no alarms. Haptics do not fire on a Mac either. The card is hidden there, and the stored values are kept.

![The Mac settings sheet shows only the display and backup cards, with no sound and haptics card](/blog/timetable-mac-sheet-environment/settings-no-haptics.png)

At the minimum window size of 480 × 560, the app switches to its compact, iPhone-style layout and the sheets still render correctly.

## Checking a Mac whose screen is locked

The Mac was locked the whole time, so `screencapture` returned black and Accessibility reported zero windows. Menu bar items could still be read and clicked through `System Events`. A debug-only probe in the app saved `drawHierarchy` snapshots of the window to its container. Presented sheets needed a separate draw of `presentedViewController.view`, because `layer.render` draws SwiftUI views blank.

## What's left

We still need to see the widget in the Mac widget gallery and to open the toolbar's `…` menu. We did confirm that the widget extension is registered with the system and that the app writes its data to the shared app group.
