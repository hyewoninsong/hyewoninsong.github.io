---
title: "Receiving a friend's timetable no longer adds a timetable"
date: 2026-10-06T22:51:42+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "Find Free Time overlays a friend's timetable on yours and paints the hours anyone is free. Keeping friends out of your own timetable list is most of the design. The color rule flipped twice in three days, then the single shading strip became nested layers, and the layers became a filter with two colors. On October 3 the filters moved back into the collapsing panel, and a selection border that inner layers were painting over got its own layer. On October 4 the long-press menu, edit mode and split share segment on the chips collapsed into one dropdown. Late on October 6 the un-removable base timetable went away: every chip can be removed, and a single chip still draws the grid."
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

(The list view was removed on October 6 — see that section.) A list view sorts the gaps longest first. Tap a row to copy it, or use Copy All.

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

Start and end default to the base timetable's (the first "me" chip) display range. Manual changes lived only on this screen at first — nothing was saved (since October 2 the range persists on the device; see below). Pull the end time before the start time, and the display settings sheet would show a red strikethrough and block saving. Here the other side just moves one hour instead, so an invalid state never exists in the first place — there's nothing to delete or save, it's a view-only range.

The range shortcut row is computed from the current range: "Widen range" appears when someone's schedule falls outside it, "Match mine" when the range differs from the base timetable's. Narrow the range by hand, and "Widen" still works — it recalculates from whatever range is showing now. (On October 5 both shortcuts were replaced by a single reset button — see below.)

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

So the condition moved to the top. Right under the people chips there are now two dropdowns: "30 min or longer" and "Everyone" (or "N+ people", from one less than the number switched on down to one). Minimum length came back out of the collapsing panel, which then held only the hour range, time format and appearance (the format and appearance chips moved to the share sheet on October 2). (On October 3 both filters went back into the panel — once the collapsed handle summarized them, the reason for keeping them outside was gone. See the October 3 section.)

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

The first link used the app's URL scheme, which some messengers would not display as tappable. The October 1 update adds an HTTPS page with a button that opens the existing app link.

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

Filters now show a small label above the value: minimum length and people (on iPhone this row moved into the options panel on October 3; the labels survive as the row labels there, and the iPad column keeps the dropdowns). In the list, weekday and clock range sit on the left while duration gets its own capsule. A selected grid card also separates the clock range from the duration. The grid/list toggle is available on iPad too: a wide screen doesn't remove the need to find the longest opening first.

![The free time list separates weekday and clock range from the duration capsule on the right](/blog/timetable-free-time-finder/separate-time-duration.png)

On iPhone, simulator checks covered selection, copying, options, 12-hour time, dark mode and list view. The grid and list were also checked on iPad.

The collapsing options panel and Share button keep their places. The update makes the existing comparison easier to read; toggling people, copying and sharing follow the same rules.

## 2026-10-01 — turn a free stretch into a concrete invitation

Finding five free hours still leaves you choosing one hour in chat. It can also leave a second question: does “two people available” mean the same two people throughout? This update closes those gaps between finding time and proposing it.

### A headcount can stay the same while the people change

Suppose Minji and Junho are free from 9 to 9:30, then Junho and Seoyeon from 9:30 to 10. Two people are free at every moment, but no pair can stay for the full hour.

The people menu now offers both “Headcount at each moment” and “Same people throughout.” The existing headcount rule remains the default: it still suits a gathering where people can arrive and leave. A team task can ask for the same participants instead. When everyone is required, the two rules produce the same answer.

Overlapping candidates remain separate. A pair available from 9–11 and another from 10–12 do not become one 9–12 candidate. The grid, list, copying and shared image all keep that meaning.

### Pick the hour you actually want to suggest

A selected grid card now opens a time chooser. List rows copied on tap at the time; holding a row opened the same chooser (since October 2 a list tap opens the card, like the grid — see below). Adjust the start and end inside the original stretch, then copy an invitation such as “How about Tue 14:00–15:00 (1 hr)?” The initial selection is up to one hour.

Attendance is recalculated for those exact times. Someone only partly free in a five-hour stretch may be fully free in the chosen hour. The original whole-stretch copy remains available. There is no new appointment list to maintain: the result is a proposal to send to a friend.

### An empty result suggests a change that actually helps

The app checks whether a shorter duration, fewer people or a wider range would produce candidates. It offers the nearest useful relaxation, with the resulting number of stretches, and changes only that one condition when tapped.

Silently relaxing several conditions would change what the gathering needs. Keeping the choice explicit also means the same-participants rule stays in effect when calculating suggestions.

### The image carries attendance with each candidate

Shared images now include the same Free / Partly / Busy groups as copied text, beside each stretch. Long names wrap, and empty groups disappear. Listing everyone only at the top could imply they can attend every candidate; listing only fully available people would hide partial availability. The existing full-result image stays, with enough context to judge each time.

### Ask through a web link, then open the app

The request link is now HTTPS. Its page shows who asked, offers a button to open the timetable send sheet, and links to the App Store for friends who need the app.

An explicit button works with messenger browsers that block automatic app switches. It reuses the existing app link without adding Universal Link setup. A build with Find Free Time hidden still refuses to open the send sheet. The web page must be deployed before the app starts sharing its new address.

These five changes keep the comparison at the center while carrying its answer through to a concrete invitation.

## 2026-10-02 — Three ways in, and the follow-up has to match on all three

A pass over the whole feature, fixing fourteen things that snagged in use without touching the shape. The one that mattered most was invisible.

A friend's timetable can arrive three ways: opened from Files, dropped onto the window, or loaded from inside the Find Free Time screen. All three call the same store function. But the "send yours back?" banner only appeared on the first two. Someone who loaded a file from inside the screen was never prompted to return the favor — the loop this feature spreads through was broken on one path. Saving was shared; "what happens after saving" was written separately at each call site. The follow-up is now one function all three paths call. For the same reason, a plain file with no sender name used to put the timetable's own name ("Fall") on the chip — now every path asks for a name once — and a failed send, which used to just not open the share sheet, now shows an alert. The lesson: when two or more paths lead to the same result, draw a paths × follow-ups table and check every cell. "It saved" is only the first cell.

![Empty state — Ask for a Timetable and Send My Timetable as two equal buttons, with Load a Friend's Timetable below](/blog/timetable-free-time-finder/empty-two-buttons.png)

### Why Saturday looked free

Days of the week followed only my base timetable's display setting. If I showed weekdays, a friend's Saturday shift was simply not there, and Saturday looked free — the one place the screen was confidently wrong. "Widen range" used to widen hours only; it now widens days too, judged by where schedules actually exist rather than by a day-range field in the file: a Sunday schedule means all seven days, Saturday only means Mon–Sat. Carrying the friend's display range in the file lost — a friend who merely shows Saturday with nothing on it would just add an empty column.

### The filter remembers itself

Minimum length, people, participation rule and the hour/day range reset every time, though the next answer is almost always the same. They now persist on the device. The time format and light/dark chips moved out of that panel into the share sheet: the on-screen grid follows the app's time format and the system appearance, and those two chips are options for the exported picture — the structure the print and share sheets already had.

![The export sheet — time format and appearance chips in a card under the preview, Share as Image below](/blog/timetable-free-time-finder/export-options.png)

### The list speaks the grid's grammar

Tapping a list row copied it immediately, so you couldn't see who was free until you pasted. Rows now show the free count ("3/4") on the right, and a tap opens the same selection card as the grid. Copy lives on the card, next to a new Share button that sends the same text straight to a messenger.

![List view — each row shows 3/3 and a duration capsule; the tapped row is tinted green and a card with name tags, Copy and Share sits below](/blog/timetable-free-time-finder/list-row-card.png)

### Smaller things

- "Ask for a timetable" and "Send mine" on the empty screen now weigh the same; the copy said "send yours first" while the primary button said "ask".
- The Me chip toggles everywhere except a narrow strip on the right that opens Send — people hit it by accident. That strip is now a hairline-split segment, 44pt wide.
- A friend chip gets a clock after 30 days, and long-press offers "Request again" for a new term. (Long-press, the split segment and edit mode all merged into one dropdown on October 4 — see below.)

![The chip row — the Me chip's share segment split by a hairline, a clock on the Junho chip](/blog/timetable-free-time-finder/chips-split-stale.png)

![Long-pressing the Minji chip — received date, Request Again, Rename, Delete](/blog/timetable-free-time-finder/friend-menu-rerequest.png)
- In edit mode, tapping a friend chip offers Rename or Delete; Rename was hidden behind long-press only.
- The people-limit alert said "long-press a chip to remove it", but the Me chip has no long-press. It now says "use Edit" and has an Edit button.
- The request message puts the App Store link first, and a source-contract test keeps the old app-name URL scheme from ever reappearing in code — it is still accepted on the way in.

## 2026-10-02, evening — a new timetable shows up on its own first, then merges

When a friend's timetable arrived, the grid simply repainted. The result was right, but you couldn't see what changed: with four people already compared, a fifth just made a few green cells lighter.

Now every new timetable — from a file, a link, or one of your own — enters in three beats:

1. **Drawn.** The new person's busy hours grow in as gray blocks, over the grid as it was.
2. **Inverted.** The gray drops out and only their free time turns light green — one beat where you read that person alone.
3. **Merged.** The light green layer fades out as the grid repaints with the new person included.

0.45 s per step, each weekday starting 0.04 s after the last, about 2.5 s in total. With Reduce Motion on, it merges immediately.

![Four frames — the grid before, the new person's busy hours drawn in gray, inverted to light green free time, and the merged grid](/blog/timetable-free-time-finder/import-reveal-steps.png)

The merge only reads if the grid holds the new person back until that last beat, so saving the timetable and starting the animation happen in the same update. Only the drawing waits; the list, copy, and share already include the new person.

The first version made the gray blocks transparent on inversion. Frame captures showed the old grid's pale green leaking through, so busy and free looked the same. Turning the busy blocks into the background color instead leaves only the free time green.

![The inverted beat — transparent gray lets old green layers leak through (left); background-colored busy blocks leave only free time green (right)](/blog/timetable-free-time-finder/import-reveal-invert-fix.png)

## 2026-10-03 — filters back into the panel, and a selection border that inner layers were covering

On an iPhone 17 the grid showed about 08:00 to 12:30 of a twelve-hour range. The chip row and the filter row sat on top, the options panel and Share button at the bottom, and tapping a green cell floated a selection card on top of that. Three changes.

### Once the handle reads the values, the filters can live inside

The filters moved out of the panel on September 29 for one reason: the panel starts collapsed, so seeing what you were filtering by meant opening it every time. But the collapsed handle was already printing the hour range. Printing the filters there too removes the reason. The handle now reads "08:00–20:00 · 30 min+ · Everyone". Reading needs no tap; only changing does.

![The options panel collapsed — the handle reads 08:00–20:00 · 30 min+ · Everyone, and the grid reaches 14:00](/blog/timetable-free-time-finder/panel-collapsed-summary.png)

Expanded, it's four rows: minimum length, people, start time, end time, each a label on the left and a gray capsule menu on the right. The grid now reaches 14:00 collapsed on the same phone. Two alternatives lost: dropping only the small captions from the row saves about 24pt, a cell and a half; leaving it alone keeps the 12:30 cutoff. iPad keeps the dropdowns in its left column, where there is room.

![The options panel expanded — minimum length, people, start time, end time, and the Share button](/blog/timetable-free-time-finder/panel-expanded.png)

### A two-line card, and the last hour above it

The selection card was three text lines plus two stacked text buttons, about 110pt floating over a 110pt panel, hiding the bottom two hours. Now the range and duration are one unit ("Mon 08:00–10:00 · 2 hr") flowing in the same wrap layout as the name tags, and Copy and Share are two icon buttons side by side: 76pt. The grid's bottom margin also measures the card and panel together instead of the panel alone, so 20:00 can scroll up above the card.

### The selection border was drawn under the inner layer

Tap a light outer layer and a black 2pt border surrounds it — except where a darker inner block sat, where the border was missing.

![A Monday 08:00–10:00 outer layer selected, the black border intact over the dark inner 50-minute block, with the compact card below](/blog/timetable-free-time-finder/outer-layer-selected.png)

The border was the block's own `.overlay`. Within a day column the layers are a `ForEach` in ascending people count, so the darker inner layer is a later sibling of the lighter outer one, and later siblings paint over the same pixels. An overlay sits above its own view, not above whatever is drawn after it. The fix is a separate sibling layer, drawn after every green layer in the column, that strokes the selected block's frame and ignores touches. The app had already hit this with a badge that extends outside its block's frame and gets covered by the neighbor; this time it happened entirely inside the frame. The rule is the same: whoever paints the pixel last wins.

Why it was missed: every capture since the layers arrived selected the darkest, innermost layer, which has no later sibling. Selection states in layered UI need to be checked on the outermost layer.

## 2026-10-04 — one dropdown per chip

(Use as base and the un-removable base chip were removed late on October 6 — see the second-to-last section. The single dropdown stays.)

A person chip had grown three grammars. Long-press a friend chip for received date, Request again, Rename and Delete; tap Edit for a remove badge on every chip; and the Me chip had a hairline-split Send segment on its right. Rename alone had two routes, and nobody found the long-press. The feedback was blunt: put a dropdown on the right of every chip and show what you can do there.

Every chip now ends in a dropdown segment — hairline plus chevron, 44pt. Tapping the body still toggles the person; tapping the chevron lists everything.

| Chip | Dropdown |
|---|---|
| Friend | received date · **Send my timetable to this person** · Request again · Rename · Delete |
| Mine | Send 'name' · **Use as base** · Remove from comparison |
| Base (first Me chip) | "Base timetable" header · Send |

![Minji's chip dropdown — received date, send my timetable to Minji, request again, rename, delete](/blog/timetable-free-time-finder/chip-dropdown-friend.png)

Two items are new. **Use as base** changes which of your timetables defines the day and hour range — the first chip has been the base since September 28, but switching it meant closing the screen and reopening it from another timetable. **Send my timetable to this person** covers the moment after the return banner is gone; the banner shows once, right after a file arrives, and dismissing it left only the generic Send. Opened from the menu, the send sheet is headed "Pick a timetable to send to Minji."

![The base chip's dropdown — a "Base timetable" header and Send only](/blog/timetable-free-time-finder/chip-dropdown-base.png)

Edit mode, the long-press menu and the split segment are gone. Keeping them next to the dropdown would leave three places to delete from. Making the body tap open the menu and moving the toggle inside would cost the most frequent action a second tap, so "tap = toggle" from September 28 stays.

The options panel also gained a **Days** chip row (Mon–Fri · Mon–Sat · Every day). Hours had wheels; days could only change through Widen range and My range, so "everything but Saturday" was not a choice. Picking the base timetable's own setting stores "follow the base" again.

![Options panel with the new Days chips; Every day selected and a Sunday column visible](/blog/timetable-free-time-finder/options-day-range-chips.png)

The three features from the October 1 section — relaxation suggestions when nothing matches, attendance in the shared image, picking a concrete time inside a free stretch — had merged without ever reaching the app (see the October 3 post), so they were rebuilt against the current screen. Suggestions gained a widen-days kind; the time picker opens from a clock button left of Copy on the selection card. Its output differs from Copy (a cut stretch, phrased as a question), so it clears the rule set that morning when the Share button was removed.

![The suggest-a-time sheet — start and end inside Mon 08:00–08:50, who is free, and a Copy This Time button](/blog/timetable-free-time-finder/proposal-sheet-rebuilt.png)

Smaller changes the same day: toggling a chip cross-fades the layers over 0.3 s, a banner offers to re-request when two or more friends' timetables are over a month old, and 3 hours joined the minimum-length options. A travel-buffer option was proposed and dropped as too much.

### Where the identifier goes, fourth time

The first probe could not find the dropdown. In the accessibility tree the menu button carried the chip's identifier, not its own: putting `.accessibilityIdentifier` **after** `.overlay { Menu }` lets it cover the overlay too. It is the container-identifier pitfall in a new shape — a button with an overlay rather than a tap container — which is why the source scan written for the third recurrence did not catch it. The identifier moved before the overlay, and a second scan now looks for controls inside an overlay followed by an identifier.

## 2026-10-05 — two range shortcuts became one reset

(Since late October 6 the button reads "Reset Range" — the words "base timetable" no longer appear on screen. It returns to the first chip's range.)

The bottom row of the options panel used to offer "Widen range" and "My range". It is now a single button, **Reset to Base Timetable**: one tap puts the start hour, end hour and days back to the base timetable's range.

![The reset button at the bottom of the options panel, enabled because Days was switched to Every day](/blog/timetable-free-time-finder/range-reset-button.png)

When the shortcuts were added they were the fastest way to change the range. Since then hours got wheels and days got chips, all in the same card, so a one-direction shortcut was a third way to do the same thing. Undoing a hand-tuned range is different — it means setting two wheels and a chip — so that is the one shortcut worth keeping. The old label also said "mine", which is ambiguous once you compare several of your own timetables; the new one names where you land.

Suggesting a wider range when someone's schedule falls outside it still happens, in the suggestions shown when nothing matches.

The row is also always there now. It used to appear only when there was something to widen or reset, so turning a wheel one notch made the card a row taller and nudged the grid margin that tracks the panel height. Now the button simply dims when there is nothing to reset.

## 2026-10-06 — one green, and gray that grows when someone joins

For a week this screen kept gaining things: shade layers, a list view, a copy button, image export, two participation rules. Today went the other way. Fewer choices, fewer ways out, and a grid that says one thing.

![The grid with a single green and gray; the selection card has one button, Propose a time](/blog/timetable-free-time-finder/one-green-card.png)

| Before | Now |
|---|---|
| Green layers that darken with the number of free people | One green where the chosen number of people are free together the whole time; everything else gray |
| "Headcount at each moment" or "Same people throughout" | Same people throughout, only |
| Grid ↔ list toggle, Copy all | Grid only |
| Propose and Copy on the card | Propose only |
| Share (whole comparison as an image) | Removed |
| "Sat 14:00–15:00 (1 hr), how about it?" | "Sat 14:00–15:00 (1 hr)" |

The layers carried more information but needed explaining. The headcount is already chosen in a menu, so the grid only has to paint that answer. The per-moment rule turned stretches green where the free people changed midway, and you cannot schedule into those.

### From the previous result straight to the new one

The three-step entrance from October 2 showed the newcomer's timetable alone for 2.5 seconds before merging. What you want to know after adding someone is how much free time you lost. So the grid now goes directly from the old result to the new one: gray grows, green shrinks by the same amount, and removing someone runs it backwards. Toggling a chip does the same.

The hard case is a class landing in the middle of a green block, which turns one block into green, gray, green. Carrying view identity and fading the rest is short to write, but the background flashes through while one green shrinks and the other fades in. Instead both pictures are expressed as the **same list of pieces**. Each piece has an old extent and a new one, the pieces tile the whole range in both states, and a piece that exists on one side only has zero length on the other. A 12–14 class in a 9–18 green day splits the green at 13:00 and grows the gray from that single point.

SwiftUI needs two beats for this: first swap, without animation, to pieces that look identical to the old picture, then one frame later send them to their new extents. In a single frame the new views have no "before" to interpolate from. Same-colored pieces that touch are drawn without the gap and rounded corners on the shared edge, so the swap is invisible.

Rules below "everyone" can produce overlapping green candidates, which cannot be lined up. Those days just cross-fade, and overlapping greens get a background-colored outline.

### The picker list was glued to its neighbors

In the sheet where you pick which timetable to send, the title list was a stock list. With many timetables, the white rows were cut flat right under the hint text and right above the name card. Padding inside the scroll view disappears as soon as you scroll, so the list now lives in one rounded window with the spacing outside it.

![Timetable picker with the title list as one rounded card, apart from the hint text and the name card](/blog/timetable-free-time-finder/send-title-card.png)

The piece list is covered by tests and the settled screens by captures. The in-between frames have not been checked on a device yet.

## 2026-10-06, night — no more base timetable

The first "me" chip had been special since September 28: the day and hour range followed it, so it could not be removed. On October 4 it gained a companion, Use as base, to promote another timetable. One rule had cost two menu items and a chip that behaved unlike the rest.

That chip is gone. Every one of your chips offers Send and Remove from comparison. The range follows whichever chip is first, and when you remove it the next one takes over. With only friends left, it follows the first friend — hours from their file, days from where their schedule actually falls.

Two things changed with it.

**One chip still draws the grid.** Before, a lone timetable showed an empty state, so adding the second one swapped a whole screen, and the gray-grows-green-shrinks transition only appeared from the third. Now your own free time is already painted, and the second timetable visibly cuts into it.

![Find Free Time with a single chip — free hours in green, classes in gray](/blog/timetable-free-time-finder/single-chip-grid.png)

**You can remove everything and add back one at a time.** The empty state appears only at zero chips. The screen puts your current timetable in for you on first open, when the timetables you had added were all deleted from the app, or when you reopen with nothing at all. It does not refill what you emptied.

![After removing the last chip — the empty state with request, send and open](/blog/timetable-free-time-finder/empty-after-remove-all.png)

The alternative was to keep the base and merely allow removing it. That still needs an explanation of who becomes the base next, and keeps the menu item. Keeping the behavior (range follows the first chip) and dropping the name leaves less to explain.

There is a cost: a first-time user now sees their own timetable instead of an empty state with large Request and Send buttons. Both are still in the `+` menu and the chip dropdown, one tap further away.

Files that ask for a name also changed. Adding a plain timetable file prompts for a chip name, and the grid used to change behind that alert. Now the person is held back until the alert closes. I have not yet watched that sequence on screen.

## Where it stands

A real two-device file exchange and the messenger-to-web-to-app flow still need checks after the web page is deployed. The iPad grid and list layouts were verified in the earlier October 1 update.



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

- 2026-10-01 — same-participant rule, choose an invitation inside a stretch, useful filter suggestions, attendance in shared images, HTTPS request page
- 2026-10-02 — one follow-up for all three entry paths (banner, name prompt, failure alert), widen days too, persisted filters, format/appearance chips in the share sheet, list tap = card with "3/4" and Share, split chip, 30-day clock, Request again
- 2026-10-02 evening — new timetables enter drawn → inverted (free time in light green) → merged; busy blocks turn background-colored on inversion
- 2026-10-03 — iPhone filter row moved into the options panel (handle summarizes "08:00–20:00 · 30 min+ · Everyone"), two-line selection card with icon buttons, grid margin measures card + panel, selection border drawn as a sibling layer above the green layers
- 2026-10-04 — one dropdown per chip (long-press, edit mode and split segment removed), Use as base, Send to this person, Days chips, toggle cross-fade, stale-timetable banner, 3-hour minimum, the three October 1 features rebuilt, a second identifier scan
- 2026-10-05 — "Widen range" / "My range" shortcuts replaced by one Reset to Base Timetable button (always visible, disabled at the base range)
- 2026-10-06 — one green (shade layers removed), same-people rule only, list view / card copy / image share / "how about it?" removed, gray-grows-green-shrinks transition when people join or leave (three-step entrance removed), picker title list as a rounded card
- 2026-10-06 night — base timetable and Use as base removed (every chip removable, range follows the first chip), a single chip draws the grid, remove all and re-add, plain files join after the name prompt closes
