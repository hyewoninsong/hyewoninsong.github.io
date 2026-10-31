---
title: "Text boxes and photos on the page, moved and resized like handwriting"
date: 2026-10-31T18:55:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "You can now drop a note or a photo onto a PDF page. It arrives selected, so you drag it into place and resize it with the same handles as handwriting and crops."
---

You can now stick a short note or a photo onto the page you are reading. Whatever you add is handled exactly like handwriting and crops: drag it to move, pull a handle to resize.

## It arrives selected

With the Select tool on, the settings row shows **Text** and **Photo**. Type a note or pick a photo, and it lands in the middle of the current page with its selection frame and eight handles already showing.

| Gesture | Text box | Photo |
|---|---|---|
| Drag inside | Moves it | Moves it |
| Corner handle | Box and text grow together | Grows, keeping its aspect |
| Edge handle | Text rewraps to the new width | Stretches one axis |

With auto-add on, each one also becomes a node in Collect. One undo removes both.

![A photo right after inserting, already selected](/blog/superpdf-insert-text-photo/photo-selected.png)

## Why the buttons live in the Select row

The top row already fills an iPhone's width with nine buttons, so a `+` there would overflow. The Select tool is the tool for things sitting on the page, and you move what you insert with it anyway. Tap-to-place was also considered, but it needed a second gesture path in both reading layouts, and you end up dragging it into place regardless.

## The font size is not stored

A text box picks the largest font that fits the box each time it draws. Grow the box and the text grows; narrow it and the lines rewrap. A stored font size would split the handles into two meanings and call for another slider.

![Resizing the box enlarged and rewrapped the text](/blog/superpdf-insert-text-photo/sticker-resized.png)

## Yellow text was unreadable

The first version drew the text in the current highlight colour. Yellow on white paper all but vanished, and with no background it collided with the page text underneath. Text boxes are now sticky notes: an opaque paper backing, the chosen colour at highlighter strength, and dark text.

## Where it stands

Photos are stored as a single 2048px JPEG so pages draw quickly. On a PDF whose pages are rotated 90°, an exported annotated PDF may show a photo in a different orientation than the app does.
