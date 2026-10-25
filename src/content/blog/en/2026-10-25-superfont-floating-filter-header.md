---
title: "The search and filters in SuperFont now float above the list and slide away as you scroll"
date: 2026-10-25T23:34:56+09:00
app: "superfont"
tags: ["devlog", "swiftui", "design"]
summary: "Five rows of search and filter controls were pinned to the top, leaving room for about two and a half font cards. They now sit on a translucent rounded card that hides when you scroll down and comes back the moment you scroll up, even a little."
---

In SuperFont's Google Fonts and My Fonts sheets, the search and filter controls now live on a translucent rounded card floating above the list. Scroll down and the card slides away. Scroll up even slightly, from anywhere, and it comes back.

## Five pinned rows left little room for the list

The Google Fonts header has five rows: search, preview text and size, category chips, status chips, language and sort. Pinned in place on an iPhone, they left space for about two and a half cards, on a screen whose whole job is browsing more than 1,800 families.

## Only the card moves, never the list

![Scrolled down: the card is gone and the list runs right up to the navigation bar](/blog/superfont-floating-filter-header/header-hidden.png)

| You | The card |
|---|---|
| scroll down | slides up and fades out |
| scroll up a little, anywhere | comes right back |
| are near the top, or the list is short | stays visible |
| see an empty result or a loading list | stays visible |

![Nudged up: the card floats over the list, with the cards behind it blurred through](/blog/superfont-floating-filter-header/header-back.png)

Hiding changes only the card's offset and opacity. The list's layout never changes height, so nothing jumps. The offline notice moved into the card's last row too.

## This reverses a decision from a month ago

In September we tried collapsing this header on scroll and backed out the same day. Filters disappeared until you went back to the top, the preview text went with them, and the changing header height made the list jump. "Expand only when scrolling up" was rejected back then as too much reverse scrolling. The floating card answers all three: any small upward nudge brings the filters back, preview text comes with them, and only the card moves, not the layout. Removing rows wasn't an option, because all five are controls people use. The sheet's navigation bar had no room for five rows either.

## The card kept hiding itself after you let go

The first version compared each scroll offset with the previous one: bigger meant hide, smaller meant show. The screenshot after a small upward drag looked right. But a test that then tapped the search field failed because the field was off-screen at y −13, so the card had hidden again on its own.

The cause was `LazyVStack`. As newly visible cards get measured, it corrects the content offset by a few points to make up for its height estimates. The offset grows with no finger on the screen, and the naive check read that as scrolling down.

The fix is a distance threshold. We remember where the list last moved up and hide only after it has gone more than 24pt below that point. Showing still happens on the first upward frame. The check now waits two seconds after the nudge, then actually types into the field and taps a chip.

## What's next

The wizard's font picker has only one preview row, so it stays as is. We'll check on TestFlight whether 24pt feels too sluggish during fast flicks on a real device.
