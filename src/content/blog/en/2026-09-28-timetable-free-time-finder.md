---
title: "Receiving a friend's timetable no longer adds a timetable"
date: 2026-10-01T00:08:34+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Find Free Time overlays a friend's timetable on yours and paints the hours anyone is free. Keeping friends out of your own timetable list is most of the design. The color rule flipped twice in three days, then the single shading strip became nested layers, and the layers became a filter with two colors."
---

Open a timetable file a friend sent you, and the app now lays it over yours and paints the hours when someone is free. Finding a shared gap used to mean flipping between two timetables and comparing them in your head. The color rule flips twice more in this post — kept in the history at the bottom.

## Only two things get painted (first version)

| Cell | Look |
|---|---|
| Everyone free (30 min or longer) | Green block with its length |
| Someone busy | Light gray |
| Gaps shorter than 30 min | Left blank |

Who is busy only shows up when you tap a gray cell. Tap a green block and a card shows the day, time, and length, with a Copy button for the group chat. Turn a person's chip off to see the hours that work without them.

(This section describes the first version. The color rule changes twice more — busy hours shaded green late that night, then flipped back to shading only free hours the next day. Follow the history at the bottom for the order.)

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

## Past midnight — the options moved into the same collapsing panel as print and share

After the evening and night revisions, the screen still had two different grammars, one on top and one below. Minimum length sat in its own spot near the top, and Edit and Share were separate buttons in the toolbar.

First, the minimum-length row came off the top entirely and moved into the same collapsing panel already used by the print and share sheets — same handle, same curve, starts collapsed.

Edit also moved, from the toolbar to the right end of the people chip row. The chip row itself scrolls horizontally, but Edit sits outside that scroll, pinned in place, so it stays visible no matter how many chips there are — the way Edit/Done sits at the end of an iOS list row. The toolbar is left with only close and the grid/list toggle.

Share came down from the toolbar too, as a full-width "Share" CTA at the bottom of the options panel. It stays visible even when the panel is collapsed — the same spot the print and share sheets already use for it.

The collapsed handle doesn't say "Options." It shows the current values: "08:00–20:00 · 30 min+". Expanded, it's three rows — minimum length, start time, end time — a range shortcut row, then the Share button below them. Tapping start or end opens an inline hour wheel below the row, styled like the display settings sheet. (That night minimum length moved back up, into a filter row under the chips — see the last section.)

![Options panel expanded, showing minimum length, start time 08:00, end time 20:00, and the Share button at the bottom](/blog/timetable-free-time-finder/options-panel-expanded.png)

![Start time row tapped open, with an hour wheel below it](/blog/timetable-free-time-finder/start-hour-wheel.png)

Start and end default to the base timetable's (the first "me" chip) display range. Manual changes live only on this screen — nothing is saved. Pull the end time before the start time, and the display settings sheet would show a red strikethrough and block saving. Here the other side just moves one hour instead, so an invalid state never exists in the first place — there's nothing to delete or save, it's a view-only range.

The range shortcut row is computed from the current range: "Widen range" appears when someone's schedule falls outside it, "Match mine" when the range differs from the base timetable's. Narrow the range by hand, and "Widen" still works — it recalculates from whatever range is showing now.

Two other layouts lost. Keeping the controls on top would crowd the same row as the people chips, which are the thing being compared; top for who, bottom for how to filter reads better. A separate settings sheet means a round trip every time a value changes, with no way to see the grid update live. The print and share sheets had already solved this with a collapsing panel, so this reused that grammar instead of inventing a third one.

## 2026-09-29 — flipped the color back: only free hours get painted, busy hours stay blank

The rule from the night before was "busy hours shade green by how many are busy, shared free time in orange." A day of real use showed the same mismatch as before, just moved. What people are looking for is free time, but the screen's darkest shading pointed at busy time. Reading a pale orange cell as "mostly free" meant inverting what orange meant ("one or two people short") every time.

So it flipped again. Now only cells where at least one person is free get painted green, shading darker with each additional free person, opaque with a length label when everyone is free. Cells where everyone is busy are left as bare grid — the app's ground color. One color, one meaning: green now means "free," full stop. The chip dots went back to green too.

![A three-person comparison grid. Darker green means more people free; fully busy cells are left blank](/blog/timetable-free-time-finder/free-only-heat-grid.png)

Taps still only land on green cells. Tapping one shows the timetables free for that entire stretch as tags, and now every card also has its own Copy button — no need to go to the list view to copy one slot.

![A Saturday block where all three are free, tapped open to a card with three tags and a Copy button](/blog/timetable-free-time-finder/free-block-card-all-three.png)

### Same free count, different people — merging needed the actual set, not the count

Moving the color logic surfaced a bug in how adjacent stretches get merged. On Friday, 12:50–13:00 had me and Minji free; 13:00–17:05 had Minji and Junho free. Both were "two free," so the count matched, and the merge logic joined them into one block. But a card for that merged block is supposed to list only the people free for the *entire* range — and across the full 4h15m, only Minji was free the whole time, so the tag list showed just her name.

![The merged Friday 12:50–17:05 block with only a Minji tag in the card — the bug state, where the shading said two people but the card said one](/blog/timetable-free-time-finder/free-block-merge-bug.png)

A screenshot caught it: the block's shading read "two people," but the card only tagged one. The fix compares the actual *set* of free people, not just the count, before merging adjacent stretches — same count, different person, no merge. That case is now a unit test.

(That fix didn't last the day. Once the single shading strip became nested layers, the rule itself stopped being needed — see below.)

## 2026-09-29, later — the single strip became nested layers

The "split when the free set changes" fix from the day before had another problem. A single strip attaches one number to one stretch. If a 2-hour stretch where two people are free has a 30-minute stretch in the middle where all four are free, that 30 minutes forced the rule to cut the range into three pieces — 2-free, 4-free, 2-free again. Each fragment read as short on its own, and the more useful fact — "these two hours have at least two people free the whole time" — disappeared from the screen.

So the strip became layers. Layer N is "the continuous run where N or more people are free." An outer layer (2 people) always contains its inner layers (4 people) — an inner layer existing at all implies the outer condition holds for that same stretch, so the containment is guaranteed, not just usual. Each layer inward is inset roughly 3pt on both sides, so the outer layer reads as a frame around the inner ones.

![A three-person comparison grid — an outer pale-green band frames a darker inner block like a border](/blog/timetable-free-time-finder/free-nested-layers-grid.png)

Layers shorter than the minimum length (the options panel value, 30 minutes by default) aren't drawn at all. Because of the containment property, whenever an inner layer survives that cutoff, the outer layer wrapping it is at least as long and survives too — a short inner layer never disappears leaving a bare outer sliver behind.

People can change within an outer layer over time, so the card now shows two tag styles: solid green for someone free the whole stretch, outlined for someone free only part of it. The copy header lists only the people free throughout, and drops the header line entirely when nobody qualifies.

![A card for tapping the outer layer on Wednesday 08:00–20:00 — all three tags (me, Minji, Junho) are outlined only](/blog/timetable-free-time-finder/free-outer-layer-card.png)

The "split segments when the free set changes" fix from the section just above is no longer needed. That fix existed because a single strip attached one number to a stretch, and it needed to stop counts from surviving a merge when the actual people had changed. A layer now only tests a headcount condition ("N or more"), not a specific set of people — and who changes within it is exactly what the solid/outlined tags already show. There's nothing left for a merge rule to protect against.

## 2026-09-29, night — pick the condition first, paint yes or no

Layers made you read "how many are free" from shades of green. But people planning a meetup start from a condition: "at least three of us, for an hour." Answering that on the layered grid meant hunting for the third layer and measuring it.

So the condition moved to the top. Right under the people chips there are now two dropdowns: "30 min or longer" and "Everyone" (or "N+ people", from one less than the number switched on down to one). Minimum length came back out of the collapsing panel, which now holds only the hour range, time format and appearance.

The grid uses two colors. Stretches that pass the filter are green with their length; stretches where someone is free but the filter isn't met are gray; hours when everyone is busy stay blank (this changed again the next day — see below). The nested greens are gone.

![Filter dropdowns under the chips set to 30 min and 2+ people; passing stretches in green, the rest of the free time in gray, and a Saturday card listing who is free](/blog/timetable-free-time-finder/filter-row-two-plus.png)

We kept the gray instead of hiding it: it shows where loosening the filter would open up time. The list, Copy All and the shared image follow the same filter, so the grid and the list never disagree.

Copying now says who can make it, per stretch:

```
Sat 08:00–20:00 (12 hr)
Free: Minji·Junho
Partly: Me
```

"Partly" exists because inside an "N or more" stretch the free people can change hour to hour. Empty lines are dropped.

## 2026-09-30 — ask a friend first, and shade toward the filter

Until now someone had to send a file before anything happened. Now the first button on the empty screen is "Ask for a Timetable": it shares a message with a link carrying your name. When your friend taps it, the app opens a sheet that says who asked.

![The send sheet opened from a request link — who asked at the top, the same preview cards as the timetable list, a name row and a Share button](/blog/timetable-free-time-finder/request-send-sheet.png)

The sheet reuses the timetable list's cards: swipe through previews, the centered card is the one you send, type the name your friend will see, tap Share. Class names are still stripped. Every "send my timetable" entry point now opens this sheet, because picking by name from a menu was guesswork when two timetables had similar names.

The link uses the app's URL scheme, which some messengers won't turn into a tappable link (iMessage only links `https`). A web redirect page is the next step.

The colors changed once more. Last night's yes/no split buried "only one person short" in the same gray as "nobody can make it". Now:

| Cell | Color |
|---|---|
| Everyone busy, or free but shorter than the minimum | Gray |
| One or more free | Lightest green |
| Each additional free person | A step darker |
| Meets the people filter | Darkest green + length |

![A gray background with greens from light to dark; only the darkest blocks carry lengths like 50 min and 2 hr](/blog/timetable-free-time-finder/heat-gray-grid.png)

The darkest shade is tied to the filter you picked, so changing the condition changes what "best" looks like. More people than the filter asks for doesn't get darker. Filling busy hours with gray makes the whole grid read as decided, and lighter greens are tappable too — those are the cells where you want to know who to talk into it.

## 2026-09-30, early morning — pick your own timetable by preview, and see lists as titles

Once sending used preview cards, adding went the other way: "Add My Timetable" under `+` was still a submenu of bare names. Now it opens the same picker as sending — only timetables not yet in the comparison, swipe through, tap Add. If the people limit is already reached, you hear it before the picker opens, not after you've chosen.

![Add My Timetable — the same preview cards as the send sheet, a list-view button top right, Add at the bottom](/blog/timetable-free-time-finder/add-own-cards.png)

Cards get slow once you have five or six timetables. The timetable list and both pickers now have a view toggle in the top-right corner: cards or titles. The icon shows what you'll switch to. It's one setting shared by all three screens, so you never have to remember which screen looks which way.

![The timetable list as titles — one name per row, a check on the one you're viewing](/blog/timetable-free-time-finder/list-titles.png)

The title list keeps the card rules: tap to open, long-press to duplicate, and in edit mode drag to reorder while delete stays the single bottom button with a confirmation. No red minus, no swipe-to-delete — switching the view shouldn't add a second way to delete.

One testing trap: passing the setting as a launch argument (`-timetableListStyle cards`) puts it in UserDefaults' argument domain, which wins over anything the app writes. The toggle looked broken; it was the test.

## 2026-10-01 — hour marks stay visible inside the color

A green stretch tells you where to look, but you still need to read its start and end. Filled green and gray blocks made the grid's time rules hard to follow, so the axis and rules now have a clearer hierarchy.

The time axis has its own background, stronger numbers and a label for the end of the range. Solid rules mark hours; lighter dashed rules mark half hours. Both sit above the filled blocks, so you can trace the time inside a green stretch. Green still means how many people are free.

![Hour and half-hour rules stay visible above the green and gray blocks, with a clearer time axis and labeled filters](/blog/timetable-free-time-finder/clearer-hour-grid.png)

A much wider axis would squeeze the day columns. Repeating start and end times in every block would crowd the seven-day phone layout. A shared axis with visible rules gives the same reference without repeating text.

Filters now show a small label above the value: minimum length and people. In the list, weekday and clock range sit on the left while duration gets its own capsule. A selected grid card also separates the clock range from the duration. The grid/list toggle is available on iPad too: a wide screen doesn't remove the need to find the longest opening first.

![The free time list separates weekday and clock range from the duration capsule on the right](/blog/timetable-free-time-finder/separate-time-duration.png)

On iPhone, simulator checks covered selection, copying, options, 12-hour time, dark mode and list view. The grid and list were also checked on iPad.

The collapsing options panel and Share button keep their places. The update makes the existing comparison easier to read; toggling people, copying and sharing follow the same rules.

## Where it stands

A real two-device file exchange and whether the request link is tappable in each messenger are still to be checked. The grid and list layouts on iPad were verified in the October 1 update.



## History

- 2026-09-28 — Find Free Time, first version
- 2026-09-28 evening — comparing with any number of friends is free
- 2026-09-28 night — same file twice: own imports get fresh IDs, friend timetables overwrite by source ID
- 2026-09-28 near midnight — busy hours shade green by how many are busy, shared free time in orange, per-segment tags, 10 comparison chips including your own
- 2026-09-29 past midnight — minimum length moved into a collapsing panel like print/share, Edit pinned to the right end of the chip row (outside the scroll), Share became a full-width CTA at the bottom of the panel
- 2026-09-29 — flipped the color back: only free hours shaded green, busy hours left blank, a Copy button on every block, merge logic fixed to compare the free set instead of the free count
- 2026-09-29, later — single shading strip became nested layers (N-or-more-free runs contained within each other), layers under the minimum length aren't drawn, cards show solid/outlined tags for whole-stretch vs. partial people, the previous fix for merging by free set became unnecessary
- 2026-09-29, night — filter row under the chips (minimum length, people), passing = green and the rest of the free time = gray instead of layers, copy lists free / partly / busy per stretch
- 2026-09-30 — request link, pick-with-preview send sheet, gray background with green shading that peaks at the people filter
- 2026-09-30 early morning — Add My Timetable uses the preview picker; card/title view toggle shared by the list and pickers
- 2026-10-01 — clearer time axis and hour/half-hour rules, labeled filters, separate clock ranges and durations, list view on iPad
