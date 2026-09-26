---
title: "The button row floating over the tab bar moved into the tab bar"
date: 2026-09-27T21:00:00+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "Daily Planner's undo and drawer buttons are now an iOS 26 tab bar accessory instead of a second glass layer over the timeline, and the top bar went from four buttons to three. Plus the collapsing tab bar we designed for and then measured out."
---

Daily Planner had two layers of glass at the bottom: the system tab bar, and above it a row of round glass buttons — undo, redo, drawer — floating over the timeline and covering the last hours of the day. Those buttons moved into **one capsule** attached to the tab bar, and the timeline ended above it with nothing on top. The top bar dropped to `Today`, the tidy menu, and the profile avatar. (Two days later the tab bar itself went away and the capsule split again — see the update below.)

## Same buttons, system surface

![The capsule above the tab bar: undo and redo on the left, the drawer on the right](/blog/planner-tab-bar-accessory/accessory-idle.png)

iOS 26's `tabViewBottomAccessory` is the slot the Music app uses for its mini player — a glass capsule sitting on the tab bar, sharing its safe area. We moved the existing controls in unchanged. At first it was enabled only on the planner tab, but on a device the tab bar shrank to a centered capsule when switching to the todos tab — the system stretches the tab bar to full width only on tabs that have an accessory. So it is on for both tabs. On the todos tab the capsule holds undo and redo on the left (todo edits are undoable too, and that tab never had an undo button before) and a new-todo `+` on the right — moved down from the top bar, which is now just `…`. One rule: the right end is the tab's primary action. The system draws the glass, so the buttons are just glyphs.

| State | Left | Middle | Right |
|---|---|---|---|
| Nothing selected | Undo · Redo | — | Drawer (badge = count) |
| A block selected | Undo · Redo | — | Delete · Put in drawer |
| Right after the drawer receives | Undo · Redo | "Put in the drawer" for 1.8 s | Drawer bounces once |

![Selecting a block swaps the right side to trash and put-in-drawer](/blog/planner-tab-bar-accessory/accessory-selected.png)

The right side still follows selection, as before. It is also the drop target when you drag a block into the drawer: the button reports its own frame, and both the drop test and the flying ghost aim at that one frame. Since the button now lives in the chrome outside the timeline, the code that computed its center from "16 pt in from the bottom-right corner" is gone — there is no longer a place where that arithmetic would be true.

## Four top buttons became three

![Settings at the bottom of the tidy menu](/blog/planner-tab-bar-accessory/menu-settings.png)

The trailing edge held `Today`, `…`, a gear, and the avatar. Settings is a once-a-month destination that occupied a permanent slot, and the `Drawer` row inside `…` was the same door as the drawer button below. Settings moved to the bottom of the `…` menu as `Settings…`; the drawer row was removed. A fixed `ToolbarSpacer` splits `Today` from the other two so navigation and everything-else read as two groups.

## Why this shape

- **Just merge the floating circles into one capsule** — still two layers of glass, and a capsule floating next to the system chrome is not the iOS 26 idiom.
- **Undo only via shake or three-finger swipe** — undiscoverable. In a drag-to-place app, undo is the first safety net, and the tutorial has an undo step.
- **One undo button, long-press for redo** — saves a button, hides redo. The capsule fits four, so nothing needed saving.
- **Settings inside the profile sheet** — profile is "who", settings is "how". The tidy menu already holds the rare actions.
- **Hide `Today` while on today** — a toolbar item that appears and disappears shifts its neighbors. Calendar keeps it too.

## The collapsing tab bar never came

We designed for one more thing: with `tabBarMinimizeBehavior(.onScrollDown)`, scrolling the timeline would collapse the tab bar and accessory into a single line and give the vertical space back. The code even had a branch dropping the middle label in the collapsed (`inline`) placement, and the docs said so.

In simulator captures the tab bar never collapsed. Eight fast swipes, three slow finger drags, a slow `swipeUp` — the tab bar pixels were identical every time while the timeline scrolled from 3 PM to 11 PM. Scrolling worked; the tab bar just did not see it.

The reason is structure. Tab bar minimization follows the drag of the tab content's **primary scroll view**. The planner's day screen is a horizontal pager (`ScrollView(.horizontal)` with paging) holding a vertical `ScrollView` per day, so the tab bar tracks the horizontal pager — which never moves vertically. The inner vertical scroll is not a candidate.

We removed the modifier and the `inline` branch; leaving it in would keep a promise the app cannot make. So this change did not gain vertical pixels — the capsule is about as tall as the old floating row. What it gained is that nothing overlaps and the chrome is one layer. The mistake was writing the docs before the capture; tab bar chrome behavior now gets documented only after a scroll-then-capture pixel comparison.

## What remains

Making the tab bar actually collapse means moving the vertical scroll outward and the date paging inward, which gives up the per-day scroll position the app keeps today. Whether that trade is worth it is a separate decision.

## Update, 2026-09-27 — the tab bar itself went away, and the capsule split in two

The capsule didn't last long. Once the todos tab dropped its stats and kept only the list (a separate post from Sept 26), it wasn't a screen people opened several times a day — placing a block happens by dragging an empty spot on the timeline, not from the todos tab. But being a tab meant it still claimed a full bottom row at the same weight as the planner, and because the accessory had to be on for both tabs to keep the tab bar from shrinking (see "Same buttons, system surface" above), undo/redo and `+` sat there on the todos tab too, uninvited.

So the tab bar is gone. The app is a single planner screen now; the todo list opens as a sheet from a `checklist` button in the top-right corner. With no tabs, there is nothing for `tabViewBottomAccessory` to attach to — no tab bar, no accessory. The bottom buttons went back to floating glass capsules, but this time there are **two** instead of one: undo/redo on the left, drawer or delete-and-park on the right (selection state decides which), and an empty middle where the timeline shows through — like a chat app's input bar, sitting in `safeAreaInset(edge: .bottom)` with the timeline scrolling underneath it.

![Undo capsule on the left, drawer capsule on the right, empty middle showing the timeline](/blog/planner-tab-bar-accessory/floating-capsules.png)

This is almost exactly the shape the Sept 25 change rejected as "not the iOS 26 idiom." Back then a floating capsule looked out of place next to a system tab bar. Now there is no tab bar to look out of place next to — the idiom didn't get broken, its anchor disappeared.

One bug rode along. The right capsule grows leftward as it swaps from one button (drawer, 44pt) to two (trash and put-in-drawer, 92pt). The put-in-drawer button reported its own frame via `onGeometryChange`, but that callback only fires when the view's own size changes — not when an ancestor's layout does. So the reported frame stayed pinned to where the button sat when the capsule was still narrow: 48pt left of its real position, exactly one trash slot plus the gap between them. Dragging a block onto that stale target silently missed — the block just moved to that time slot instead of parking. The fix: measure from the container that is always present and changes size — the right capsule itself — and always treat its trailing edge as the target, regardless of which button currently occupies it.

The collapsing-tab-bar question from "The collapsing tab bar never came" is moot now too — there's no tab bar left to collapse.

## History

- 2026-09-25 — floating row into the tab bar accessory, top trailing four to three, collapsing tab bar measured out
- 2026-09-27 — the tab bar itself is gone, so is the accessory; bottom controls float again, split into two capsules with an empty middle; fixed a pitfall where a swapped button's self-reported drop-target frame stayed stale
