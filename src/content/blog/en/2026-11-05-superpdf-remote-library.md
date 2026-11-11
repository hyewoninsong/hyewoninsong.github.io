---
title: "Books from your NAS, downloaded only when you open them"
date: 2026-11-05T13:07:00+09:00
app: "superpdf"
tags: ["devlog", "data"]
summary: "SuperPDF now imports from WebDAV and SMB servers. Import creates the card; the PDF arrives on first open and lives in Caches. Why streaming, Documents and a schema bump all lost."
---

SuperPDF could only make a book from a PDF picked in the Files app. Now it connects to a home NAS over WebDAV or SMB, walks the folders, and adds several books at once. Adding does not download anything. The card appears, and the PDF arrives the first time you open it.

## Import makes the card, opening fetches the file

Add a server under Settings with its address, share and account, and "Check connection" answers with a folder count. The password goes to the Keychain, not the settings file. The home `+` button now splits into "From Files" and "From a server". The server browser shows folders and PDFs only, and greys out files that are already on the shelf.

![Picking PDFs in a server folder. Two toggles at the bottom, "Download now" and "Shrink while importing", both off by default.](/blog/superpdf-remote-library/browser-select.png)

"Download now" is off by default. Pick twenty books and the device gets twenty cards with a cloud badge and "Not downloaded" where the page count would be. Open one and a progress bar takes the document's place, then reading continues as usual.

![Opening a book shows a cloud icon, "Fetching the book from the server", a progress bar and a cancel button.](/blog/superpdf-remote-library/fetch-on-open.png)

"Shrink while importing" runs last week's PDF compressor right after the download: scanned pages become JPEG with an invisible text layer from OCR. The same setting applies to imports from Files.

## Why a cache, not streaming

The original question was whether a book could be read and annotated without ever landing on the device. Not as pure streaming.

- **Byte-range streaming** — PDFKit's `PDFDocument` opens a local file or a whole `Data`. There is no public path for fetching ranges from a remote. On top of that, page pre-rendering, OCR, search, read-aloud, TOC generation and duplicate detection all open the file themselves. Rewriting those ten call sites for remote access is weeks of work and slower in the end.
- **Download everything at import** — easiest, and the opposite of saving space.
- **Fetch on open, keep in Caches** — chosen. Annotations already live outside the PDF, in the app database, so losing the file loses nothing. That is what makes Caches acceptable: the system may purge it under pressure, and it stays out of backups. A file whose original sits on a server has no business in a backup.

When Caches gets purged, the book downloads again. Underlines and the last page are in the model. Books you want on the device regardless go to Documents through "Keep on this device" in the card menu.

## No schema bump

The remote origin (which server, which path) did not go into SwiftData. It is one JSON sidecar per PDF file, the same pattern bookmarks and generated TOCs already use. A V8 migration bought nothing: the data is per book and CloudKit is off. Only `PDFFile.fileURL` changed. If Documents has the file, use it; if not and an origin exists, use the Caches location. Thumbnails, OCR, export and open all follow that one line.

Server-side changes are detected by size. If the downloaded byte count differs from the size seen at import, a toast warns that underline positions may be off. ETags and modification dates vary between SMB and WebDAV implementations, so size was the more honest signal. A same-size change slips through, and we know it.

## Two protocols, and an LGPL note

WebDAV is plain HTTP, so it is written directly on `URLSession`: one `PROPFIND` lists a folder, `GET` downloads. SMB has no system API, so AMSMB2 came in through SPM. The wrapper is MIT, but libsmb2 inside it is LGPL-2.1. The package builds as a **dynamic library**, which satisfies the relinking requirement on the App Store; switching it to static would break that, so the product type stays as is. FTP was dropped: plaintext, and off by default on current NAS boxes.

Review caught one bug. The SMB progress callback returned `!Task.isCancelled` to mean "stop when cancelled", but that callback runs on the library's own queue, outside any Swift task, so `Task.isCancelled` is always false. Cancel would have let the file finish downloading. The fix flips a lock-protected flag in `withTaskCancellationHandler` and lets the callback read that. `URLSession.download(for:)` propagates cancellation itself, so WebDAV was fine, which made the SMB case easier to miss.

## What is left

No real NAS has been tested yet. WebDAV ran against a stub server; SMB was checked only for path building and error mapping. Digest and NTLM auth, self-signed certificates, the local-network permission prompt, and progress and cancel on large files are the device checklist. An open-source notices screen is needed before release.
