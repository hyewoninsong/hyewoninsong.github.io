---
title: "The timetable list is now the home screen — the card you pick grows into the document"
date: 2026-11-12T02:32:30+09:00
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

In a sheet that is a mismatch you fix with one swipe. On home it is worse: the rule is "tap the centred card and it grows", so when state and screen disagree, a different document opens than the one you tapped. The pager is now wrapped in a `ScrollViewReader` that calls `scrollTo(id, anchor: .center)` once, right after it is attached.

It slipped through because every check used the first timetable, where "didn't scroll" and "scrolled to the right place" look identical. Scroll-position checks now use an item that is not first.

## Where it stands

Verified on an iPhone simulator: opening and returning from cards and rows for both timetables and calendars, relaunching with the switch on and off, a right-to-left language, and the end state under Reduce Motion. Not yet checked: iPad, the folding iPhone, Mac, a real device, VoiceOver. The first-run intro clips and store screenshots still show the old sheet, and home has no entry to Settings yet — that still opens from a document's menu.
