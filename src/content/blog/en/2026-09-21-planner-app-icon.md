---
title: "The app icon is the planner screen itself"
date: 2026-09-21
tags: ["daily-planner", "devlog", "design"]
summary: "The placeholder icon became three blocks on a time axis. Of five candidates, the one that speaks the same language as the first screen won, and the title bars came out because at 29pt they were only smudges."
---

The day planner's home screen icon now shows what the app shows when you open it: a time axis on the left, three blocks in blue, orange and green, a white check on the first one. Until now it was a grey striped placeholder that existed so the build would pass.

## Everything the icon needed was already in the app

The app's visual grammar is small. A vertical time axis, colored blocks with 8pt corners placed on it, a completion circle on each block's left edge, a minimap scrollbar on the right, hatching where blocks overlap, a contribution grid on the todo tab. Colors come from the twelve iOS system colors plus eight pastels, defaulting to system blue.

Five candidates were drawn from those parts and compared at 180, 60 and 29pt on light and dark home screens.

![Five candidates: timeline, single block, minimap, overlap hatching, contribution grid](/blog/planner-app-icon/five-candidates.png)

## The one that matches the first screen won

The timeline. The planner is the first tab, so tapping the icon shows the same picture, larger. That the icon and the screen read as one thing outweighed everything else.

Each of the other four lost for one reason. The single block is the crispest at 29pt but reads as a generic todo app with no sense of placing things in time. The minimap is the most distinctive, since no other app has it, but a stranger cannot tell what the app does. The overlap hatching illustrates a rule the app has, that blocks may overlap, but the hatching dissolves below 60pt and the rule is not something a user learns from an icon. The grid survives scaling best and looks like a habit tracker, which the app is not.

## The title bars came out

The first timeline draft had a white title bar on each block, mirroring the todo name on real blocks. At 29pt those bars are not text. They are white smudges eating into the colored area, meaning nothing. Without them the icon is three colored blocks and one check circle, which is all it takes to recognize the app. The old rule against text in app icons turns out to cover lines that only imitate text.

## Dark and tinted are not recolorings

Since iOS 18 an icon has three appearances. The asset catalog takes three 1024px images, each tagged with its appearance, and the system picks.

![Light, dark and tinted variants](/blog/planner-app-icon/light-dark-tinted.png)

Dark darkens the ground and switches the blocks to the iOS dark palette. The light palette's blue, orange and green look oversaturated on a dark ground, and the app itself already uses the dark variants in dark mode.

Tinted is drawn differently. It is a greyscale image with no background, and the system paints it with the user's chosen tint. So the blocks are three whites at different brightness, and the check and the empty circles flip to black so they still show on top of the blocks.

## What is left

Icon Composer in iOS 26 takes the background, blocks and check as separate layers and produces the Clear appearance and the glass effect from them. Three PNGs give neither. The SVG sources are in the repository, so moving to layers is a matter of splitting, not redrawing.

## History

- 2026-09-21 — First icon: timeline chosen from five candidates, title bars removed, dark and tinted variants.
