---
title: "Folders on the SuperPDF bookshelf — stored in one file, ignored by search"
date: 2026-11-10T03:37:35+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "data"]
summary: "You can now group books into folders on the home bookshelf. Folders are one level deep, live in a single JSON file outside the database, open in place, and search still looks everywhere."
---

SuperPDF's home screen is a bookshelf: every imported PDF becomes a book. Past twenty books it got tedious to scan, so the shelf now has folders for grouping books by course or project.

## Three ways in, one menu to move

Create a folder from the `+` menu ("New Folder…"), from a book card's "Move to Folder → New Folder…", or from selection mode's "Move → New Folder…". The last two drop the chosen books straight into the folder you just named — no empty folder first, then a second trip.

![New Folder sits under the import items in the + menu](/blog/superpdf-home-folders/new-folder-menu.png)

Every book card's menu now has "Move to Folder": the other folders, "Take out to shelf" when the book is already in one, and "New Folder…".

![Move to Folder lists folders and New Folder](/blog/superpdf-home-folders/move-to-folder-menu.png)

A folder card matches a book card's size and previews up to four first pages. Tapping it swaps the shelf to that folder's books; `‹` (or ⌘[ on iPad) goes back.

| Situation | Behavior |
|---|---|
| Importing while inside a folder | New books land in that folder |
| Search | Looks through every book, folders hidden |
| Folder order | Follows the book sort |
| Deleting a folder | Asks first; books go back to the shelf, never deleted |

Search ignores folders on purpose: remembering a title shouldn't require remembering where you filed it.

## Why a file, not the database

The textbook move is a `BookFolder` SwiftData model, which means a schema version bump — and in this app every bump freezes a full copy of the current models, a step that has nearly broken the store before. For a folder list that risk wasn't worth it. Folders live in one JSON file next to bookmarks and remote-source records. If the file is missing or corrupt, only the folders vanish; every book still shows on the shelf. The cost is no sync, and sync is off today anyway.

Also rejected: pushing a new screen per folder (every toolbar, selection, import progress and undo toast would need duplicating), and nested folders (depth slows finding at this scale; the file format is versioned if that changes).

## A test that couldn't see the alert

The UI test failed to find the folder name field even though the alert was on screen. The accessibility dump showed the `TextField` under `Alert` — without the `accessibilityIdentifier` we'd attached. SwiftUI `.alert` content is re-rendered by the system alert and loses identifiers, so the test now queries `app.alerts.textFields` and button titles.

## Where it stands

A UI test walks create → move → open → delete, and unit tests cover the file (corruption, dangling folder references, name limits). iPad and the unfolded foldable layout haven't been checked by eye yet.

## History

- 2026-11-10 — Home bookshelf folders
