---
title: "We removed SuperFont's three tabs and turned the home screen into an install list"
date: 2026-10-25T14:50:20+09:00
app: "superfont"
tags: ["devlog", "swiftui", "design"]
summary: "No more Files / Google Fonts / My Fonts tabs. The home screen is an empty list of fonts to install; the + menu opens one of three sources as a sheet, and whatever you pick lands in the list. You can now mix sources in a single install."
---

SuperFont now opens to an empty "Fonts to Install" list instead of a tab bar. Tap + in the corner, pick My Fonts, Google Fonts, or Files, choose fonts in the sheet that appears, and install everything with one "Install N" button.

## Each tab used to install on its own

The home screen had three tabs, and each one started its own install. There was no way to put two Google Fonts families and a ZIP you downloaded into the same profile — you installed one batch, went through Settings, then started over in another tab.

## An empty list, and a + with three branches

![Tapping + on the empty home screen shows My Fonts, Google Fonts and Files](/blog/superfont-add-menu-sheets/add-menu-open.png)

| Pick | What opens | Sheet button |
|---|---|---|
| My Fonts | The old My Fonts tab — search, status filters, delete | "Add N" |
| Google Fonts | The old Google Fonts tab — category and language filters, preview | "Add N" + style count |
| Files | The system file picker | none, picked files land directly |

The old tab contents moved into sheets almost untouched. Only the bottom button changed: sheets add, the home screen installs.

![The My Fonts sheet with one family checked and a floating "Add 1" button](/blog/superfont-add-menu-sheets/my-fonts-sheet.png)

If every Google Fonts download fails, the sheet stays open with your selection intact so you can retry.

## What mixing sources changes

The list remembers where each file came from, for two reasons. A reinstall that covers a whole profile reuses that profile's identifier so Settings doesn't pile up duplicates — that only happens when everything in the list came from My Fonts. And removing an item only deletes the app's copy when it came from Files; a My Fonts item points at the library copy you'd need to reinstall later.

## Paths not taken

- **Home = My Fonts, + with only two sources** — splits reinstalling and adding new fonts into two flows again.
- **Install as soon as you pick in a sheet** — the old behavior, but it leaves the home screen useless and makes mixing impossible.
- **Renaming the analytics event** — "tab selected" is no longer literal, but it answers the same question, and a new name would break continuity in reports. We did fix the Files path being counted as "google_fonts"; mixed batches report "mixed".

## What's left

The App Store screenshots and review recording still show the tab bar and need a reshoot.
