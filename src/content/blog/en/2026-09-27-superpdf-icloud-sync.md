---
title: "Syncing underlines between iPhone and iPad — and why it came back out"
date: 2026-10-24T23:24:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "data"]
summary: "We built iCloud sync for underlines, the mind map, and PDFs across your own devices, with a deterministic repair for tree cycles. Then no test build shipped for four weeks, and the sync came back out."
---

> October 24, 2026: this sync was removed before it ever reached users. The last section explains why; the rest is the design as it stood.

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

## Where it stood (September 27)

Not yet confirmed on two physical devices, and the production CloudKit schema was never deployed. Neither happened — see below.

## October 24 — four weeks without a build, and removing sync

Every TestFlight deploy after sync landed died at signing, about three minutes in:

```
Provisioning profile "iOS Team Provisioning Profile: *" doesn't include the iCloud capability.
```

The app declared an iCloud container and push (CloudKit's change channel), but the App ID on the developer portal had only in-app purchase enabled. All development happened in the simulator, which never checks signing, so the mismatch only showed in release builds. The `*` in the message is the tell: Xcode found no profile for this App ID and fell back to the team wildcard.

The pre-deploy check saw it. It printed the declared keys next to the App ID's capabilities — and passed, because it only blocked a few approval-gated keys and skipped keys the profile lacked entirely. Output nobody reads is not a check. It now blocks when a key like iCloud, push, or app groups has no matching capability.

Fixing it meant creating and attaching the iCloud container by hand on the web (the public API can't), switching the release lane to manual signing, deploying the production CloudKit schema, and testing on two devices. We removed sync instead: the store is local-only, the entitlements are gone, and PDFs are no longer copied into the store. The schema stays as is — reverting it would only add a migration — and the tree repair still runs when a map opens.

The rule we kept: any change that adds a capability-backed entitlement gets one release build before it merges.

## History

- 2026-09-27 — own-device iCloud sync and post-merge tree repair
- 2026-10-24 — found why signing failed for four weeks; removed sync (schema and tree repair kept)
