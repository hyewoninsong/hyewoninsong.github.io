---
title: "The timetable list is now the home screen — the card you pick grows into the document"
date: 2026-11-13T00:16:22+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "The list used to be a sheet over the open timetable. Now it is the floor of the app, and the card you tap grows in place into the timetable. To keep the document alive, home sits underneath it instead of on top."
---

The list of timetables and calendars used to slide up as a sheet over whatever was open. Now the list is home. Tap the house button in a document and it shrinks back into its card; tap a card on home and that card grows into the screen.

## The list sits under the document, not over it

As a sheet, the list was something you pulled out for a moment. It had a close button, and picking an item slid the sheet away to reveal a document that had quietly changed underneath. Nothing connected what you picked to what opened.

![Home — cards fill the screen under the Timetables | Calendars segment. No close button; the timetable that was open has a ring around its card](/blog/2026-11-12-timetable-home-screen/home-cards.png)

Home has no close button. The only way to leave is to open something.

![An open timetable — the top-left button changed from a list icon to a house](/blog/2026-11-12-timetable-home-screen/document-house-button.png)

| You do | What happens |
|---|---|
| Tap the house button | The document shrinks into its card or row and home appears |
| Tap a card or row on home | It grows in place into the document |
| Relaunch the app | Starts on the document you were last in (default) |
| Turn the setting off | The next launch starts on home |
| Arrive from a widget, file or alarm | Straight to that document, no transition |

The setting is a single switch. Flipping it changes nothing on screen; it only decides the first screen of the next launch and of a new window.

![Settings — the "Start Where You Left Off" switch. When off, the app opens to Home](/blog/2026-11-12-timetable-home-screen/settings-toggle.png)

## Home went underneath so the document never unmounts

There were several ways to draw a card growing into a screen.

- **Home as the `NavigationStack` root, push the document with `navigationTransition(.zoom)`.** Popping the document tears down the grid, so every trip home resets lock state, scroll position and zoom. The system zoom also gives no say over what happens when the card to return to is off-screen.
- **Present home with `fullScreenCover`.** Still slides up from the bottom, and home is still something laid over the document.
- **Home on top of the document.** Drawing the growth then needs a separate copy of the document.

So the order is flipped. The document is always mounted; home is attached beneath it only while visible or in transition. While home shows, the document is transparent, ignores touches and is hidden from accessibility. With no copy involved, the thing that grows and shrinks is the real document.

The transition applies a clip window, a scale, an offset and opacity. The scale is uniform and based on width, so text and grid lines never stretch; the clip window hides the extra height. Opening takes 0.45s, returning 0.4s, on a `timingCurve` rather than a spring: a spring's completion fires while the tail is still settling, and removing home at that point makes the last few points snap.

The transition ends on either its completion callback or a 1.2s watchdog, and each only ends its own run. A decorative animation is gating whether the screen accepts taps, so one missing signal must not freeze it. If the card to return to is off-screen, the document shrinks to 0.92 at the centre and fades. With Reduce Motion on, it is a 0.2s fade and nothing else.

## The page dot said third, the screen showed the first card

The list has a card pager and a title list, and [previews fly between them](/en/blog/2026-11-11-timetable-list-style-flight/) when you switch. Stepping through recorded frames, one thing was off: with the third timetable open, switching from titles to cards left the page dot on the third while the pager physically sat on the first card.

The pager is rebuilt on every switch, and a freshly created `ScrollView` does not use a value already sitting in `scrollPosition(id:)` as its starting offset. The binding means "follow when this changes", not "start here". State pointed at the third card; the scroll offset was zero.

In a sheet that is a mismatch you fix with one swipe. On home it is worse: the rule is "tap the centred card and it grows", so when state and screen disagree, a different document opens than the one you tapped. The pager is now wrapped in a `ScrollViewReader` that calls `scrollTo(id, anchor: .center)` once, right after it is attached. (On wide screens, where cards now sit two at a time, the anchor is the leading edge instead; see the 2026-11-13 section.)

It slipped through because every check used the first timetable, where "didn't scroll" and "scrolled to the right place" look identical. Scroll-position checks now use an item that is not first.

## Where it stands

Verified on an iPhone simulator: opening and returning from cards and rows for both timetables and calendars, relaunching with the switch on and off, a right-to-left language, and the end state under Reduce Motion. Not yet checked: the folding iPhone, Mac, a real device, VoiceOver. iPad was checked on a simulator on 2026-11-13 (see below). The first-run intro clips and store screenshots still show the old sheet, and home has no entry to Settings yet — that still opens from a document's menu.

## 2026-11-12 afternoon — the previous timetable showed through the one you picked

Picking a different timetable on home made the growing document carry a faint copy of the one you had just left: its blocks, its weekday header doubled up. The report came as a screen recording from the folding iPhone; a regular iPhone showed it too, for the first few frames.

![Left, before the fix: the growing timetable overlaid with the previous one's weekday header and 08:00 time axis. Right, after: only the picked timetable.](/blog/2026-11-12-timetable-home-screen/ghost-before-after.png)

It follows straight from the structure above. The document stays mounted, so picking from home swaps it while it is still underneath, then starts the growth. The grid has had a 0.2s crossfade on timetable switches for a month, meant for keyboard switching while the grid is visible. That crossfade does not stop just because the document is covered, so for the first 0.2s of a 0.45s growth the old grid was still fading out on top. On the folding iPhone the growth runs on a snapshot taken 60ms in, which froze the overlap for the whole transition.

The fix: the crossfade only runs when home is not attached. Picking from home always skips it; switching while the grid is visible keeps it. The rule lives in one place, the home state, rather than at the five places that open a document.

It slipped through for the same reason as the page dot: transition recordings always reopened the same timetable, where old and new grids look identical. Recordings now pick a different one.

## 2026-11-13 — On wide screens, cards sit two at a time

On an iPad in landscape and on the folding iPhone's inner display, one card took the full width. It only got wider, never taller, so the preview sat small inside it with empty space on both sides. Wide screens now show two cards side by side, and a swipe moves one card: 1 and 2, then 2 and 3.

![Home on an iPad in landscape — two timetable cards side by side, a sliver of the previous and next card at each edge, and two page dots lit for the two visible cards](/blog/2026-11-12-timetable-home-screen/two-up-landscape.png)

| | One-up | Two-up |
|---|---|---|
| Where | iPhone, iPad portrait, folded display | Wider than tall and at least 700pt wide |
| Gap between cards | 8pt | 24pt |
| Side margin | 28pt | 60pt |
| Neighbour showing past the edge | 20pt | 36pt |
| Page dots | One per card, one lit | One per card, two lit |

The rule is about size, not device type; it is the same test the calendar uses to split into two panes.

The spacing took two passes. Reusing the one-up 8pt gap made two cards read as one slab in the middle of the screen. Widening only the gap would have left 4pt of neighbour showing, so the margin grew with it. Dots stay one per card rather than one per position, so their count still equals the number of timetables and does not change on rotation.

### Scroll position and "the selected one" are now separate values

With one card visible, the card the pager settled on was the edit target; one `scrollPosition(id:)` value meant both. With two visible it only means "the leading card", so the edit target is its own value and tapping the other visible card moves it.

Splitting them exposed two things that used to line up for free. Overscrolling at the end reported the last card as leading, a position that does not exist, so the value is clamped to the last real position. And reordering a card with the arrow buttons pushed it off-screen, because the scroll value had not changed and nothing told the scroll view to move; each move now calls `scrollTo` for that card. That one was also true in one-up, and is fixed there too.

Two-up uses `.viewAligned(limitBehavior: .alwaysByOne)`. It limits inertia only: a drag longer than one card width still travels as far as the finger does.

### The first preview drawn after launch was blank

While checking two-up, a launch that started on home left one card showing nothing but its background.

![Before the fix — the right-hand card is an empty white surface with no grid or events; the left one is fine](/blog/2026-11-12-timetable-home-screen/blank-card.png)

Previews are rendered from an off-window `UIHostingController` with `drawHierarchy(in:afterScreenUpdates:)`. It returns a `Bool` that was being discarded. Logging it showed that in six launches out of six, the process's first call alone returned `false` (6 of 56 calls) and produced a fully transparent image; every later call returned `true`. App state, orientation and one-up versus two-up made no difference.

A transparent image is not `nil`, so it was cached as a finished preview. Why the first call fails is not established. The fix is on the result: an image whose alpha is zero everywhere at 8×8 is not treated as a preview, is not cached, and the card retries up to three times. It was missed because the check for the new launch path was "home appears, the open card is in place" and never said the card had to contain a picture.

### Seen and not seen

Checked on an iPad Pro 11-inch simulator: two-up in landscape, one-up in portrait, timetables and calendars, one card per swipe, edit target and reordering, previews after a home-first launch. Not yet checked: the folding iPhone's inner display that prompted this, Mac, a real device, right-to-left languages, iPad Split View, and whether the first-call failure happens on hardware.

## History

- 2026-11-12 early — list moved from a sheet to a home screen; the picked card grows into the document
- 2026-11-12 afternoon — crossfade disabled while home is attached, so the previous timetable no longer shows through
- 2026-11-13 — two cards at a time on wide screens, one per swipe; fixed the first preview after launch coming out blank
