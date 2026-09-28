---
title: "Receiving a friend's timetable no longer adds a timetable"
date: 2026-09-28T17:00:00+09:00
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

## Where it stands

The iPad layout and a real two-device file exchange are still to be checked.
