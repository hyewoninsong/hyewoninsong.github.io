---
title: "Underlines now follow you between your iPhone and iPad"
date: 2026-09-27T16:00:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "data"]
summary: "On the same Apple account, underlines, the mind map, and the PDF itself now follow you across your own devices. CloudKit has no idea what a tree is, so two devices moving a node in opposite directions can create a cycle — fixing that deterministically was the real work."
---

MindPDF is built for underlining on the iPad and re-reading just the underlines on the iPhone, so having the two devices show different things was a long-standing gap. Devices signed into the same Apple account now stay in sync: underlines, mind map, and the PDF itself all follow you across them.

## What changed

- An underline made on the iPad shows up on the iPhone, and back.
- Moving a node or merging a chapter in the mind map on one device carries over to the other.
- Importing a PDF on one device delivers the file to the other.

There is no account screen, no sign-in, no invite. It reuses whatever Apple account the device is already signed into — one line of storage configuration puts SwiftData on a private CloudKit database.

## Why this scope, and not the others

**Own devices only, not sharing with other people yet.** CloudKit also supports CKShare — inviting someone else to co-edit a project. That needs its own SwiftData support, an invite UI, concurrent-edit conflict handling, and it charges the shared storage against the project owner's iCloud quota. What was actually needed was "what I underline on my phone shows up on my tablet," so only that half shipped. Sharing across people is still on hold.

**PDFs move as a separate record (CKAsset), not as an iCloud Drive file.** Just dropping the PDF into an iCloud Drive folder looked simpler, but it hands the app a download-state UI (downloading / downloaded / placeholder only) and file coordination against anything else touching the same file. Instead the PDF bytes live in a separate record that CloudKit syncs on its own. The cost: the device now holds two copies of the PDF — the local file the screen opens, and the external-storage bytes the store keeps — and iCloud usage grows by the PDF's size. Still cheaper than building download-state UI and file coordination by hand.

**WebDAV was never on the table.** That call was already made in an earlier review: WebDAV is an upload/download protocol with no merge concept. Two devices opening the same store file over WebDAV means whichever saves last overwrites the other's work outright.

## CloudKit has no idea what a tree is

This was the real difficulty. CloudKit resolves conflicts field by field, last write wins. But the mind map is a tree, and tree rules — one parent, no cycles, sibling order — are not properties of a single record; they live in the relationships between records.

Concretely: move node A under B on the iPhone, and around the same time move B under A on the iPad. Each edit is valid on its own device. Once merged, A's parent is B and B's parent is A — a cycle. Any code that walks up parents to count depth or subtree height never terminates on that data. Sibling order numbers colliding, or two devices each creating their own chapter node from the first underline in that chapter, are the same class of problem: CloudKit has no notion that a chapter should have exactly one node.

So a repair pass runs after every merge. A cycle gets broken by detaching the node that was created earliest inside it. Duplicate chapter nodes get merged into whichever was created first, and the rest deleted. Colliding sibling order gets renumbered by (creation time, id). Everything is decided by **creation time and id alone**, so two devices repairing the same data independently reach the same conclusion — neither undoes the other's repair, so they don't ping-pong. Nothing gets written when nothing is wrong.

One exception: a node with neither a parent nor a project is left alone. CloudKit records can arrive out of order, so an empty parent right now might just mean its counterpart hasn't landed yet. Deleting it risks losing data that was still in transit.

Underlines never hit this problem at all. They aren't a tree, just independent records — two devices underlining the same sentence just leaves both underlines in place, overlapping but neither erasing the other.

## Three pitfalls along the way

**A to-many relationship with a default of `[] `is still rejected as required.** Giving it a default looked like it should satisfy CloudKit, but SwiftData turns that into "a required relationship with a default value" — CloudKit only accepts relationships typed as optional (`[T]?`). The fix was renaming the stored relationship to the optional form and keeping the old name as a non-optional computed property, so the hundreds of call sites that use the relationship never had to change.

**Adding the iCloud entitlement flips every test's storage to CloudKit too.** A storage configuration's CloudKit setting defaults to automatic, which picks up the entitlement the moment it exists. Unit tests host the app, so even in-memory and temp-file stores started getting CloudKit's schema checks — breaking migration tests that build stores from schemas that predate those constraints. The fix was making test storage explicitly opt out of CloudKit rather than relying on the default.

**A failed CloudKit open must fall back to local, not move the library aside.** The store-opening code used to move the file aside and start fresh whenever it failed to open. Once sync exists, a failure that's really just an account or schema problem would trigger that path and wipe out a user's library. A local-only open now sits between "open with CloudKit" and "move the file aside" — only a fully local failure reaches the destructive step.

## Where it stands

Not yet confirmed on two physical devices — the simulator can't actually observe CloudKit sync. The CloudKit dashboard's production schema deploy is also still pending, so TestFlight and App Store builds won't sync until that happens.
