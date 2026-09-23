---
title: "After the icon went vivid, the app's colors looked dull"
date: 2026-09-23
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "The ten default schedule colors now match the iOS system palette. Only yellow gave up its white title, and that is why 'just a bit darker' was never an option."
---

SuperTimetable's schedule blocks pick from ten bold colors and ten pastels. This morning the app icon was redrawn with iOS system colors, and next to it the same red, yellow and blue inside the app looked one step muddier. The ten bold colors now use the icon's values, and the pastels were re-picked one step richer.

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

## History

- 2026-09-23 — bold ten to iOS system colors, pastels re-picked, yellow alone with dark text.
