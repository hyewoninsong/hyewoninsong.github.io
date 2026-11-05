---
title: "Text boxes and photos on the page, moved and resized like handwriting"
date: 2026-11-05T17:58:22+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "You can now drop a note or a photo onto a PDF page. It arrives selected, so you drag it into place and resize it with the same handles as handwriting and crops."
---

You can now tap anywhere on a page and type right there, or stick a photo onto it. Whatever you add is handled exactly like handwriting and crops: drag it to move, pull a handle to resize.

## What you add ends up selected

With the Select tool on, the settings row shows **Text** and **Photo**. Turn on Text and tap the page to type in place. Pick a photo and it lands in the middle of the current page. Either way it ends up with its selection frame and eight handles showing.

| Gesture | Text box | Photo |
|---|---|---|
| Drag inside | Moves it | Moves it |
| Corner handle | Resizes the box, font size stays | Grows, keeping its aspect |
| Edge handle | Text rewraps to the new width | Stretches one axis |

With auto-add on, each one also becomes a node in Collect. One undo removes both.

![A photo right after inserting, already selected](/blog/superpdf-insert-text-photo/photo-selected.png)

## Why the buttons live in the Select row

The top row already fills an iPhone's width with nine buttons, so a `+` there would overflow. The Select tool is the tool for things sitting on the page, and you move what you insert with it anyway. Tap-to-place was left out at first because it needed a path in both reading layouts. That call was reversed on November 3, below.

## At first, the font size was not stored

The first text boxes picked the largest font that fit each time they drew, so growing the box grew the text. Boxes you write today keep the font size you chose, and handles only change the wrap width. Older boxes still behave as shown here.

![Resizing the box enlarged and rewrapped the text](/blog/superpdf-insert-text-photo/sticker-resized.png)

## Yellow text was unreadable

The first version drew the text in the current highlight colour. Yellow on white paper all but vanished, and with no background it collided with the page text underneath. So they became sticky notes: an opaque paper backing, the chosen colour at highlighter strength, and dark text. New boxes now take a text colour and a shade colour separately, and older notes keep their look until you edit them.

## November 3: no more dialog, you type on the page

Adding text used to mean typing into an alert, then dragging the box from the middle of the page. Now you turn on Text, tap a spot, and the keyboard comes up with the first line starting there. Tap a selected box to edit it in place. Tap outside or press Done to finish; one undo reverts the edit.

![Typing on the page, with the style bar above the keyboard](/blog/superpdf-insert-text-photo/type-with-style-bar.png)

The bar above the keyboard sets font, size, text colour and shade. The next box inherits the last look.

![The finished box stays where it was typed](/blog/superpdf-insert-text-photo/box-on-page.png)

The two-layouts worry went away by floating one editor above the window rather than inside the page. The board holds still while you type, so the page mapping taken at the start stays correct. If the keyboard would cover the box, the board content slides up.

iOS ships only gothic Korean glyphs, so serif or rounded fonts changed Latin letters and nothing else. Core Text can fetch Nanum Myeongjo, Nanum Gothic, Nanum Pen and Nanum Brush from Apple's servers, which adds nothing to the app's size.

The first editor opened 62pt below the tap. The board frame was measured outside `.ignoresSafeArea()`, which reports the safe-area frame, while UIKit's origin is the expanded frame. Saved coordinates were right, so unit tests passed; a screenshot gave it away. A UI test now checks that the tapped point falls inside the editor's frame.

## 2026-11-05 — Any font on the device

Four Nanum fonts were not enough, so the font row above the keyboard now starts with All Fonts. The five built-in choices stay in the row, and the last eight fonts picked from the sheet join them.

![The font row above the keyboard, with All Fonts first](/blog/superpdf-insert-text-photo/all-fonts-row.png)

The sheet lists fonts already on the device and fonts Apple can download, Korean-capable ones first, each row drawn in its own font. A search field and a Korean-only switch keep hundreds of families manageable. Downloadable fonts are fetched when picked, the same way the Nanum fonts are.

![The All Fonts sheet, Korean fonts on top](/blog/superpdf-insert-text-photo/all-fonts-sheet.png)

Fonts installed by font apps go through the system font picker. Reading them directly needs the Fonts capability, and an entitlement the App ID lacks blocks distribution signing, which once kept this app off TestFlight for four weeks. The system picker grants access without it.

One trap: `UIFont(descriptor:size:)` with a family that does not exist returns some fallback font instead of nil. The app now checks that the returned `familyName` matches before trusting it; missing families draw in the system font and keep their saved name.

## Where it stands

Photos are stored as a single 2048px JPEG so pages draw quickly. On a PDF whose pages are rotated 90°, an exported annotated PDF may show a photo in a different orientation than the app does. Rotating the device while typing can misplace the editor, though no text is lost. Nanum and other Apple-downloaded fonts need a connection the first time and show as the system font until they arrive. Whether a font-app font stays usable after relaunch is not yet checked on a real device.
