---
title: "Receiving a friend's timetable no longer adds a timetable"
date: 2026-09-28T23:30:00+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Find Free Time overlays a friend's timetable on yours and paints only the hours you're all free. Keeping friends out of your own timetable list is most of the design."
---

Open a timetable file a friend sent you, and the app now lays it over yours and paints only the hours when everyone is free. Finding a shared gap used to mean flipping between two timetables and comparing them in your head.

## Only two things get painted

| Cell | Look |
|---|---|
| Everyone free (30 min or longer) | Green block with its length (orange since that night) |
| Someone busy | Light gray (green shades since that night) |
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

So the lock on friend chips is gone, along with the group free time card on the paywall. The existing reasons to pay (more than one timetable, alarms, custom colors) carry that on their own. The only limit left is the same for everyone: up to ten saved friends (near midnight: ten timetables in total, yours included). A newly received friend is switched on, and everyone else stays as they were, so each file that comes in adds one more person to the comparison.

## Later that night — receiving the same file twice

A file can come in two ways, so it matters what happens the second time. The two paths do opposite things.

| Received as | Same file again |
|---|---|
| Add as my timetable | Adds another copy |
| Add to free time comparison | Replaces that friend's entry |

Importing as your own gives the timetable and every event in it a fresh ID. That fix came from a bug report earlier this month: alarms are keyed by event ID, so an imported timetable that kept the file's IDs shared alarm slots with the original, and one timetable's alarms erased the other's. Existing files that already collided are repaired once at launch.

Friend timetables go the other way. They carry the sender's timetable ID as their source. When a file from the same source arrives, it overwrites the busy hours in place. A name you gave the chip stays, and the chip is switched back on. Nobody wants "Jun" and "Jun 2" after a friend changes one class.

The limit: if a friend builds a new term's timetable or duplicates one before sending, it is a new source and shows up as a second chip. Remove the old one in Edit. Grouping by sender instead would merge a school and a tutoring timetable from the same person, which is worse.

## Near midnight — busy hours turn a deeper green with every busy person, free hours turn orange

A single gray made "one of five is busy" look the same as "all five are busy". With a group, the useful answer is often "this works if one person moves something", and a flat gray hid it. Busy hours are now shaded by how many people are busy, with as many steps as people switched on.

![The deepest green band on Monday selected, with a tag for each busy person in the card; shared free time in orange](/blog/timetable-free-time-finder/busy-band-selected.png)

The colors moved twice. Green used to mean "everyone free", so we tried gray shades first. But a chip that is switched on already shows a green dot. So green now means people, their busy hours stacking up, and the shared free blocks moved to orange. Blue was out because the timetable grid uses it for editing, and gray blended into the lightest green. One color, one meaning.

Instead of stacking translucent blocks (opacity doesn't add up evenly, and edges show through), the app merges each person's busy hours, cuts the day wherever someone starts or stops being busy, and counts. Each stretch is its own rounded block with the same gap and corners as the free blocks. Square bands inside one block looked harsh.

![Dark mode, busier stretches are brighter green](/blog/timetable-free-time-finder/busy-heat-dark.png)

Taps work per stretch now. Tap one and the card lists the timetables in that exact stretch as tags. A sentence like "Minji, Junho busy, you free" made you hunt for names; tags show how many and who at a glance, and anyone without a tag is free.

The comparison is capped at ten timetables including your own, for both new friend files and adding another of your timetables. A friend re-sending their timetable still just updates their chip.

## Where it stands

The iPad layout and a real two-device file exchange are still to be checked.
