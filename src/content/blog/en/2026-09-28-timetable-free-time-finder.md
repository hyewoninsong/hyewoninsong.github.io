---
title: "Receiving a friend's timetable no longer adds a timetable"
date: 2026-09-29T00:40:00+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Find Free Time overlays a friend's timetable on yours and paints only the hours you're all free. Keeping friends out of your own timetable list is most of the design."
---

Open a timetable file a friend sent you, and the app now lays it over yours and paints only the hours when everyone is free. Finding a shared gap used to mean flipping between two timetables and comparing them in your head.

## Only two things get painted

| Cell | Look |
|---|---|
| Everyone free (30 min or longer) | Green block with its length |
| Someone busy | Light gray |
| Gaps shorter than 30 min | Left blank |

Who is busy only shows up when you tap a gray cell. Tap a green block and a card shows the day, time, and length, with a Copy button for the group chat. Turn a person's chip off to see the hours that work without them.

![A green free block selected, with a card showing the day, time, length and 'all free'](/blog/timetable-free-time-finder/free-slot-selected.png)

A list view sorts the gaps longest first. Tap a row to copy it, or use Copy All.

![Free slots listed from longest to shortest](/blog/timetable-free-time-finder/free-slot-list.png)

## A friend's timetable is not your timetable

Shared timetable files used to land in your timetable list. Since this month a second timetable needs Premium, so receiving a friend's file that way would open the paywall right away. That breaks the one thing this feature depends on: the second person using it.

Friend timetables now live apart. They don't show up in your list, you can't edit them, and they don't count toward any limit. The app only stores the day, start and end of each busy hour. The Send button in Find Free Time drops class names and notes. It also tags the file, so the receiving app opens straight into the comparison and asks whether to send a timetable back.

## Where the paywall sits

- **All free.** Spreads fastest, but gives no new reason to pay.
- **All Premium.** The friend who receives the file can't use it.
- **One friend free, a second one needs Premium.** This is what we first picked. Matching three or more people is where doing it by hand hurts most.

That evening we dropped it and made everything free. See below.

## Later the same day — fixes from real use

- Block lengths read like clock times ("5:50"). They now show a localized interval split over two lines ("5h / 50m"), and copied slots include the length.
- The "Me" chip was a timetable picker while every other chip was a toggle. It is now a toggle too. You can add more of your own timetables from `+`, and Edit puts a remove badge on every chip.

![Edit mode with a remove badge on each chip](/blog/timetable-free-time-finder/compare-edit-mode.png)

- The Share button assumed you meant "send my timetable". It now asks: send one of your timetables, or export the current comparison as an image or PDF.

![Share menu: send a timetable or export free time](/blog/timetable-free-time-finder/share-choice.png)

## That evening — comparing with any number of friends is free

The group case is where doing it by hand hurts most, and it is also where files travel the most. Four teammates matching a meeting time pass the file three times, often to people who have never opened the app. Putting the paywall there cuts the feature off exactly where it would spread.

So the lock on friend chips is gone, along with the group free time card on the paywall. The existing reasons to pay (more than one timetable, alarms, custom colors) carry that on their own. The only limit left is the same for everyone: up to ten saved friends. A newly received friend is switched on, and everyone else stays as they were, so each file that comes in adds one more person to the comparison.

## Later that night — receiving the same file twice

A file can come in two ways, so it matters what happens the second time. The two paths do opposite things.

| Received as | Same file again |
|---|---|
| Add as my timetable | Adds another copy |
| Add to free time comparison | Replaces that friend's entry |

Importing as your own gives the timetable and every event in it a fresh ID. That fix came from a bug report earlier this month: alarms are keyed by event ID, so an imported timetable that kept the file's IDs shared alarm slots with the original, and one timetable's alarms erased the other's. Existing files that already collided are repaired once at launch.

Friend timetables go the other way. They carry the sender's timetable ID as their source. When a file from the same source arrives, it overwrites the busy hours in place. A name you gave the chip stays, and the chip is switched back on. Nobody wants "Jun" and "Jun 2" after a friend changes one class.

The limit: if a friend builds a new term's timetable or duplicates one before sending, it is a new source and shows up as a second chip. Remove the old one in Edit. Grouping by sender instead would merge a school and a tutoring timetable from the same person, which is worse.

## Past midnight — the options moved into the same collapsing panel as print and share

After the evening and night revisions, the screen still had two different grammars, one on top and one below. The people chips sat at the top, and so did "Minimum length" in its own spot next to them — but only the minimum-length control had a label. The chip row was floating without a name.

First, a "Timetables" label went in front of the chip row. Then the minimum-length row came off the top entirely and moved into the same collapsing panel already used by the print and share sheets — same handle, same curve, starts collapsed.

The collapsed handle doesn't say "Options." It shows the current values: "08:00–20:00 · 30 min+". Expanded, it's three rows — minimum length, start time, end time — plus a range shortcut row. Tapping start or end opens an inline hour wheel below the row, styled like the display settings sheet.

![Options panel expanded, showing minimum length, start time 08:00, end time 20:00](/blog/timetable-free-time-finder/options-panel-expanded.png)

![Start time row tapped open, with an hour wheel below it](/blog/timetable-free-time-finder/start-hour-wheel.png)

Start and end default to the base timetable's (the first "me" chip) display range. Manual changes live only on this screen — nothing is saved. Pull the end time before the start time, and the display settings sheet would show a red strikethrough and block saving. Here the other side just moves one hour instead, so an invalid state never exists in the first place — there's nothing to delete or save, it's a view-only range.

The range shortcut row is computed from the current range: "Widen range" appears when someone's schedule falls outside it, "Match mine" when the range differs from the base timetable's. Narrow the range by hand, and "Widen" still works — it recalculates from whatever range is showing now.

Two other layouts lost. Keeping the controls on top would crowd the same row as the people chips, which are the thing being compared; top for who, bottom for how to filter reads better. A separate settings sheet means a round trip every time a value changes, with no way to see the grid update live. The print and share sheets had already solved this with a collapsing panel, so this reused that grammar instead of inventing a third one.

## Where it stands

The iPad layout and a real two-device file exchange are still to be checked.

## History

- 2026-09-28 — Find Free Time, first version
- 2026-09-28 evening — comparing with any number of friends is free
- 2026-09-28 night — same file twice: own imports get fresh IDs, friend timetables overwrite by source ID
- 2026-09-29 past midnight — minimum length moved into a collapsing panel like print/share, chip row labeled
