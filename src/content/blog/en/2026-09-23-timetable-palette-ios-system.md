---
title: "After the icon went vivid, the app's colors looked dull"
date: 2026-09-25T18:30:00+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "The ten default schedule colors now match the iOS system palette. Only yellow gave up its white title, and that is why 'just a bit darker' was never an option. Two days later six recommended sets were added as pages, and that evening the tab shrank back to one page: ten bold plus ten mist."
---

SuperTimetable's schedule blocks pick from twenty colors in the basic tab. On September 23 that was ten bold and ten pastels; since the evening of September 25 it is ten bold and ten mist. The eighty-color detour in between is in the last two sections. This morning the app icon was redrawn with iOS system colors, and next to it the same red, yellow and blue inside the app looked one step muddier. The ten bold colors now use the icon's values, and the pastels were re-picked one step richer.

## The dullness was the white title, not the saturation

The old set was chosen two weeks ago in OKLCH with one rule: every one of the ten had to carry a white title. The app picks the title color automatically. Relative luminance (the WCAG formula) at or below 0.5 gets white text, anything above gets charcoal. To keep all ten on the white side, every hue was darkened a step. Yellow suffered most: system yellow sits at 0.64, ours at 0.44, which is mustard.

Icon blocks carry no text, so the icon dropped that constraint and used system colors as they are. Side by side, the gap was obvious.

![Top row is the old ten, bottom row the iOS system colors. Only the yellow block flips to dark text.](/blog/timetable-palette-ios-system/before-after.png)

## "Just darken the yellow a bit" does not exist

Using the ten system colors as they are means yellow flips to charcoal text in auto mode. The first idea was to darken only yellow until white text works. Stepping it down settled the question.

| Yellow | Luminance | Auto title |
|---|---|---|
| System `#FFCC00` | 0.64 | dark |
| 6% darker | 0.56 | dark |
| 10% darker | 0.51 | dark |
| 13% darker `#DEB100` | 0.47 | white |
| Old `#D7AB09` | 0.44 | white |

White text only wins at the 13% mark, and at that point the color is indistinguishable from the old mustard. Yellow is bright by nature; once it is dark enough for white text, it is no longer yellow.

![System yellow darkened step by step. The moment white text works, it is the old mustard again.](/blog/timetable-palette-ios-system/yellow-steps.png)

Two options remained: keep system yellow and let its title go dark, or keep the old yellow and change only the other nine. We chose the first. The ten pastels already use dark titles, so it is not a new rule inside the app, and each timetable can pin its title color light or dark anyway. Matching the icon exactly is what "vivid" was asking for.

## Pastels traded a little lightness for chroma room

The pastels follow the system hues at OKLCH L 0.85, C 0.12; the old set was L 0.87 at C 0.07 to 0.10. Lowering lightness by 0.02 buys chroma: the sRGB gamut narrows toward white, and at that lightness red and blue hit the wall near C 0.08. Pushing everything to C 0.14 makes only mint and green pop while red and blue stay put. So the rule is "as much as the gamut allows, capped at 0.12," with yellow alone at L 0.88 because yellow turns olive when it darkens. Gray stayed as is; it matches the tick marks in the icon.

![The final twenty. Among the bold ten only yellow has dark text; all ten pastels do.](/blog/timetable-palette-ios-system/final-twenty.png)

## Same values, still not coupled

Two weeks ago the icon was tied to the app palette; this morning that tie was cut because the white-title constraint leaked into the icon. This afternoon the app palette moved to the icon's values, but the tie was not restored. Two places with different constraints will drift again. The icon script owns the icon values, the palette model owns the app's.

The contract test changed from "all ten bold colors take white titles" to "only yellow takes charcoal." Next time the colors move, that exception list is the first thing that breaks.

## 2026-09-25 — The pastels did not grow on us, so we added six sets instead of replacing them

Two days in, the ten pastels still felt off. The first instinct was to re-pick them, but those ten are already referenced by hex in saved schedules and store screenshots; change them and a user's chosen color silently disappears from the palette. So the twenty stayed exactly as they are, the basic tab got pages, and six recommended sets of ten went behind them. One page of twenty became four pages of eighty, with four dots underneath.

![The six sets on light and dark ground. Every column keeps its hue; only lightness and chroma change per set.](/blog/timetable-palette-ios-system/six-sets.png)

The sets are not split by hue. All ten reuse the bold row's OKLCH hues (red, orange, yellow, green, mint, sky, blue, purple, pink, gray) and differ only in lightness and chroma: vivid (L 0.74 / C 0.19), candy (0.80 / 0.16), deep (0.52 / 0.15), dusty (0.68 / 0.065), mist (0.92 / 0.045), night (0.40 / 0.085). Whatever page you are on, the same column is the same family, so "a red, but calmer" is one swipe away in the first column. Yellow and orange turn olive and brown when they darken, so those two get a lightness bump of 0.03–0.14 per set; anything outside sRGB loses chroma only.

![The deep and dusty page, each set captioned. Picking the deep red puts the ring on it and recolors the edit sheet header behind the popover.](/blog/timetable-palette-ios-system/page-deep-dusty.png)

### Two sets per page, one name per set

A page is fixed at five columns by four rows; the custom tab uses the same shape and the popover height comes from it. A set is ten colors, two rows, so one set per page would leave the bottom half empty every time. Two sets per page it is: the top two rows are one set, the bottom two another — the same grammar the first page already has with bold on top and pastel below.

Set names were left out at first — no room for a caption row, and the first page had never labeled bold and pastel either. On a device, though, six sets that share every hue and differ only in lightness read as "which two rows are these again." The same afternoon each set got a one-line caption: Bold, Pastel, Vivid, Candy, Deep, Dusty, Mist, Night. "No room" had mistaken a pinned height for a fixed one; the popover height follows its content, so it grew by the two caption rows (52pt), and the caption height itself is pinned at 18pt so fonts cannot wobble the page. The first page's bold and pastel rows got captions too, so no page is the exception. The dot row still counts only the group you are looking at — four dots on basic, the custom page count on custom.

### One draft set produced the exact same hex as a pastel

One of the first six was "bright," L 0.82 / C 0.13, meant to sit just richer than the pastels (L 0.85 / C 0.12). Its orange came out as `#FFBF85` — byte for byte the pastel orange. At that lightness orange hits the sRGB gamut wall first, and both profiles get clamped to the same chroma. Two swatches sharing a hex means two selection rings and an ambiguous "which page holds this color."

The lesson: a second set in the pastels' lightness band will collapse into the pastels at the gamut edge. Bright was dropped for a richer candy (L 0.80 / C 0.16), and both the palette script and the contract test now insist that all eighty hexes are distinct.

One more from the capture probe: it compared the first swatch's x across pages using page one's first swatch as the reference, which happened to wear the selection ring — about 5pt of extra frame. All three pages reported a 5pt offset that did not exist. Never take a selected element's frame as the baseline.

## 2026-09-25 evening — Back from eighty colors to twenty

Half a day after adding the six sets, the basic tab went back to a single page: the ten bold colors on top and the ten mist colors below. Pastel, vivid, candy, deep, dusty and night are gone. Columns still pair by hue. With one page the page dots disappear, but their row keeps its height so the grid does not jump when switching tabs.

In the morning the pastels stayed because saved schedules and store screenshots reference their hex values. That cost is now accepted. Schedules store the hex, so blocks painted with a removed color keep it, and the "in use" strip at the top of the popover still offers it. Store screenshots pick colors by index, so the light row now points at mist, and the store shows pastels the app no longer has until the next capture.

Mist sits at lightness 0.92 and chroma 0.045, much lighter than the pastels, so all ten take a charcoal title. The paging code stays: the page count is read from the palette, so adding sets back is one page and two caption keys. Analytics color names narrow to `basic_N` and `mist_N`.

## History

- 2026-09-23 — bold ten to iOS system colors, pastels re-picked, yellow alone with dark text.
- 2026-09-25 — twenty kept, basic tab paged, six recommended sets of ten (same hues, L/C only). "Bright" collided with a pastel hex → candy. Captions per set the same afternoon.
- 2026-09-25 evening — basic tab reduced to ten bold + ten mist on one page; pastels and the other five sets removed.
