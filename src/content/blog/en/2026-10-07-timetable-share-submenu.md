---
title: "A share menu that reads like the Photos app — File, Image, Add to Album, Print, Calendar, Lock Screen"
date: 2026-10-07T11:04:41+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Six ways to get a timetable out of the app now live under one Share submenu, named and iconed the way iOS Photos names the same jobs. Along the way: expanded submenu rows lose their accessibility identifiers."
---

Tap **Share** in the `…` menu of a timetable and six rows unfold: File, Image, Add to Album, Print, Calendar, Lock Screen. Share used to open the image preview directly, with Print, Calendar and Lock Screen stacked below it as separate top-level rows. Five export paths in the first layer made the menu long, and the line between "share" and "export" never stopped being a question.

## Same jobs, same names as Photos

![The Share submenu — File, Image, Add to Album, Print, Calendar, Lock Screen](/blog/timetable-share-submenu/submenu-open.png)

The reference is the iOS Photos share sheet. Pick one photo, tap Share, and the lower section lists "Save to Files", "Add to Album", "Print", "Use as Wallpaper" as short nouns. A timetable ends up as a picture too, so the same jobs get the same names and the same SF Symbols.

- **File** — the `.supertimetable` file straight to the system share sheet. Nothing to choose, so no sheet. (`doc`)
- **Image** — preview and options sheet, then share as image. (`photo`)
- **Add to Album** — the same sheet, saved straight into Photos. (`rectangle.stack.badge.plus`)
- **Print** — the print sheet. (`printer`)
- **Calendar** — export to the Calendar app; dimmed when there are no events. (`calendar.badge.plus`)
- **Lock Screen** — build a lock screen wallpaper. (`lock.iphone`)

The rows are nouns, not "Export as file" and "Export to calendar". The header already says Share. The iPad menu bar keeps the verb form, because there the header is "File".

## Add to Album skips the share sheet

![The Add to Album sheet — same preview and options as Image, one button at the bottom](/blog/timetable-share-submenu/add-to-album-sheet.png)

The new row saves the timetable image directly into Photos. Before, that meant Share as Image and then hunting for "Save Image" inside the system sheet.

There is one preview sheet. Entering through Image or Add to Album changes only its title and its single bottom button; light/dark, time format, text color and title toggle are the same choices either way. Saving reuses the lock screen wallpaper's "Save to Photos" code: add-only permission, PNG bytes written as they are. A saved alert offers "Open Photos"; a denied one offers "Open Settings".

## What lost

- **Everything flat in the first layer.** Seven rows, with Settings and Tutorial pushed to the edges and five rows in the middle that are all one verb pretending to be different actions.
- **Share opens the sheet, with File │ Image buttons under it.** The previous shape. Sending a file meant passing through an image preview, and Print and Calendar still sat beside Share needing explanation.
- **A submenu of "Export as …" rows.** Lived for a day a month earlier. Right structure, but every row repeated the verb and Print stuck out.

## Expanded submenu rows lose their identifiers

The simulator probe died on its first run: `No matches found` for `btn_share_photos`. The accessibility dump showed `btn_share` fine in the first layer, and then, once the submenu had unfolded, **no identifier on any button inside the menu, header row included.** What remained was the localized label and the identifier of each row's SF Symbol image, which is the symbol name.

SwiftUI `Menu` renders through `UIMenu`. First-layer actions carry the SwiftUI identifier across; the inline-expanding submenu on iOS 26 and 27 redraws its cells without it. Labels are localized (store captures run in eight languages), so the tests now find rows by symbol:

```swift
app.buttons.containing(.image, identifier: "printer").firstMatch
```

A small identifier-to-symbol table lives next to the tests and changes with the app's icons. The same submenu had been built twice a month earlier and never caught this, because the captures were never rerun before it was removed. When a menu gains a layer, dump that layer's accessibility tree once.

## What is left

Add to Album has not yet been watched landing in Photos on a device. The code path is the lock screen wallpaper's, which does work there, but that stays an assumption until checked.
