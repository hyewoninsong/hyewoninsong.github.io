---
title: "A share menu modeled on the Photos app, cut to three rows a day later"
date: 2026-10-08T02:56:36+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Every way to get a timetable out of the app went under one Share submenu. On a real phone the next day it was long and uneven, so Share kept the three rows that send something to someone else and the other two moved up a level."
---

Tap **Share** in the `…` menu of a timetable and three rows unfold: Image, File, Print. A day earlier there were five, with Calendar and Lock Screen, and the first part of this post is the record of building those five. The October 8 section at the end says why two came back out. (That morning there were six, with Add to Album. The afternoon section below says why it left.) Share used to open the image preview directly, with Print, Calendar and Lock Screen stacked below it as separate top-level rows. Five export paths in the first layer made the menu long, and the line between "share" and "export" never stopped being a question.

## Same jobs, same names as Photos

![The morning shape — six rows. The third, Add to Album, was removed that afternoon](/blog/timetable-share-submenu/submenu-open.png)

The reference is the iOS Photos share sheet. Pick one photo, tap Share, and the lower section lists "Save to Files", "Add to Album", "Print", "Use as Wallpaper" as short nouns. A timetable ends up as a picture too, so the same jobs get the same names and the same SF Symbols.

- **File** — the `.supertimetable` file straight to the system share sheet. Nothing to choose, so no sheet. (`doc`)
- **Image** — preview and options sheet, then share as image. (`photo`)
- **Print** — the print sheet. (`printer`)
- **Calendar** — export to the Calendar app; dimmed when there are no events. (`calendar.badge.plus`)
- **Lock Screen** — build a lock screen wallpaper. (`lock.iphone`)

The rows are nouns, not "Export as file" and "Export to calendar". The header already says Share. The iPad menu bar keeps the verb form, because there the header is "File".

## Add to Album — added in the morning, removed in the afternoon

![The Add to Album sheet as it was — same preview and options as Image, one different button](/blog/timetable-share-submenu/add-to-album-sheet.png)

The row added that morning saved the timetable image directly into Photos. Before, that meant Share as Image and then hunting for "Save Image" inside the system sheet.

There was one preview sheet; entering through Image or Add to Album changed only its title and its one button. The row is gone now.

## What lost

- **Everything flat in the first layer.** Seven rows, with Settings and Tutorial pushed to the edges and five rows in the middle that are all one verb pretending to be different actions.
- **Share opens the sheet, with File │ Image buttons under it.** The previous shape. Sending a file meant passing through an image preview, and Print and Calendar still sat beside Share needing explanation.
- **A submenu of "Export as …" rows.** Lived for a day a month earlier. Right structure, but every row repeated the verb and Print stuck out.

## Expanded submenu rows lose their identifiers

The simulator probe died on its first run: `No matches found` for `btn_share_photos`, the Add to Album row of the time. The accessibility dump showed `btn_share` fine in the first layer, and then, once the submenu had unfolded, **no identifier on any button inside the menu, header row included.** What remained was the localized label and the identifier of each row's SF Symbol image, which is the symbol name.

SwiftUI `Menu` renders through `UIMenu`. First-layer actions carry the SwiftUI identifier across; the inline-expanding submenu on iOS 26 and 27 redraws its cells without it. Labels are localized (store captures run in eight languages), so the tests now find rows by symbol:

```swift
app.buttons.containing(.image, identifier: "printer").firstMatch
```

A small identifier-to-symbol table lives next to the tests and changes with the app's icons. The same submenu had been built twice a month earlier and never caught this, because the captures were never rerun before it was removed. When a menu gains a layer, dump that layer's accessibility tree once.
## 2026-10-07, afternoon — the swipe that closed the wrong thing

Using the morning build turned up four problems.

### The options panel now follows your finger

The Image, Print and Lock Screen sheets share one layout: preview on top, an options panel below that opens collapsed. The panel collapses downward, but only its small handle responded, and only to a tap. Swiping down to close the panel closed the whole sheet.

Now pulling the collapsed panel up opens it, and swiping the open panel down scrolls the options to the top and then collapses the panel under the finger. A drag that starts on the panel cannot move the sheet.

A SwiftUI `DragGesture` could not do this. The options are a `ScrollView`, and continuing from "scrolled to the top" into "collapsing" means sharing one finger with the scroll view's pan. So a `UIPanGestureRecognizer` sits on the window, with three delegate rules:

- It only receives touches that begin inside the panel, and never on a wheel or text field.
- It recognizes simultaneously with the options scroll view. On the frame the scroll reaches the top, the scroll pan is cancelled and the panel takes over, so the rubber band never fights it.
- Any pan that is not a scroll view's, meaning the sheet's dismiss pan, must wait for this one to fail (`shouldBeRequiredToFailBy`).

Two alternatives lost. `interactiveDismissDisabled` while the panel is open keeps the sheet, but the sheet still slides down with the finger and springs back. A threshold toggle collapses the panel without following the finger.

### The panel stops at half the screen

![The Lock Screen sheet with options open — the panel stops at half height and the extra rows scroll inside it](/blog/timetable-share-submenu/panel-half.png)

This is a screen for adjusting options while watching the preview, yet the seven-row Lock Screen panel covered most of the preview. The panel is now capped at half the window height and scrolls inside.

The first measurement put the panel's top edge at 403pt where 437 was expected. The panel itself was exactly half, but it starts above the home indicator while its background runs underneath it. Counting the 34pt bottom safe area in the cap gave 437.

### Sharing an image keeps the sheet

![The system share sheet over the image sheet — Save Image is in the bottom row](/blog/timetable-share-submenu/share-over-sheet.png)

The share button used to dismiss the sheet and present the system share sheet 0.3 seconds later. Sending once, switching to dark mode and sending again meant starting from the menu. The system sheet now appears on top, and the only way out is the X.

### So Add to Album went away

With the sheet staying open, Save Image is one tap inside the system share sheet. A separate menu row for the same job had no reason left. The menu has five rows.

### What is left

The drag thresholds (40% of the open height, or 300pt per second) were only checked with synthesized simulator drags. Whether the hand-off from scrolling to collapsing feels smooth needs a real finger.

## 2026-10-07, evening — the pull that sent the app home

The afternoon's drag exposed a new problem within hours. Pulling the collapsed panel up sent the app to the home screen instead of opening the panel.

The collapsed panel is a single 28pt handle sitting right above the home indicator, so a finger pulling it up starts at the very bottom of the screen. An upward swipe from that strip belongs to the system's home gesture before it belongs to the app.

### The first bottom-edge swipe now goes to the app

While the panel accepts drags, the sheet sets `defersSystemGestures(on: .bottom)`. The first swipe up goes to the app, and a second one right after goes home. It was unclear whether this would reach the system from inside a sheet that is not full screen, so we ran both builds side by side in the simulator. Without it the first swipe shrinks the app into a switcher card. With it the app stays.

The cost is two swipes to leave from these sheets, so the deferral is off whenever the drag is off (the iPad side column, or while typing a print size).

Making the handle taller lost. People who swipe from the edge would still leave the app, and the preview would shrink.

### Deferral alone turned "the app leaves" into "nothing happens"

With only the deferral, the app stayed but the panel did not open. The recognizer accepted touches that began inside the panel's frame, and the panel sits above the bottom safe area, so the home-indicator strip was outside it. Extending the hit area to the bottom of the window fixed that.

The afternoon's check missed this because its synthesized drag started at the centre of the handle, and fingers start at the edge. Also, `XCUIApplication.state` reports foreground even while the app is a switcher card, so we judged by screenshots and the handle's label.

All of this was checked with synthesized drags in the simulator, not yet with a finger on a device.

## 2026-10-08 — five rows were too many, and two of them were not sharing

On a real phone the submenu covered the top half of the screen, and the five rows did not read as one group. Three reasons:

- **Mixed kinds of words.** File and Image are formats, Print is an action, Calendar and Lock Screen are destinations.
- **Two rows are not sharing.** File, Image and Print send the timetable to someone else. Calendar and Lock Screen put it somewhere else on your own phone. Photos lists "Use as Wallpaper" in its share sheet, but that is a twenty-row list; in a five-row menu the odd two stand out.
- **One icon carried a badge.** `calendar.badge.plus` was the only symbol with a `+` on it.

### The menu now

- Settings
- Share › Image · File · Print
- Export to Calendar
- Lock Screen Wallpaper
- (divider) Find Free Time · Import from Another Timetable · Alarms ›
- (divider) Replay Tutorial

Share holds only what leaves through the system share sheet or the printer, with Image first because it is used most. The two promoted rows could not stay one-word nouns: without "Share" above them, "Calendar" alone does not say what the row does. They now use the title of the sheet they open, so the words you tap are the words you see next. The calendar icon lost its badge.

### What lost

- **Keep five rows, add a divider inside the submenu.** Groups them, but the menu is just as long and two non-sharing rows still sit under "Share".
- **Promote Print too.** Share would hold two rows, hardly worth a submenu, and the top level would grow to nine.

The cost is a top level of eight rows instead of six. Two dividers split it into three groups: getting the timetable out, working with other timetables, help.

The `…` button also lost its circle the same day. iOS 26 toolbars already draw a glass circle behind each button, so a circled symbol showed two rings.

This was checked with tests that pin the menu order, not yet by looking at the new menu on a device.

## History

- 2026-10-07, morning — Share becomes a submenu with Photos' names and symbols. Add to Album added.
- 2026-10-07, afternoon — drag to collapse the panel, half-height cap, sheet stays after sharing, Add to Album removed.
- 2026-10-07, evening — pulling the collapsed panel no longer sends the app home: bottom-edge gesture deferral, hit area down to the home indicator.
- 2026-10-08 — Share holds Image · File · Print only. Export to Calendar and Lock Screen Wallpaper move to the top level, with two dividers.
