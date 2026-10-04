---
title: "The French headline didn't fit the frame"
date: 2026-09-25T10:00:00+09:00
app: "superfont"
tags: ["devlog", "appstore"]
summary: "SuperFont now speaks Spanish and French. Two French screenshot headlines overflowed the fixed-width frame, so instead of shrinking the copy, I measured pixel widths and swapped in shorter synonyms."
---

SuperFont now supports Spanish and French: all 290 in-app strings, the App Store name, subtitle, keywords, and description, and eight framed screenshots each (four iPhone, four iPad). That brings the app to seven languages, alongside Korean, English, Japanese, Simplified and Traditional Chinese.

## Name, subtitle, and keywords each get different words

App Store indexing pools the name, subtitle, and keywords into one search field. Repeating a word across them wastes indexing space, so each field carries a distinct synonym for "font": the name uses the verb for "install" (*Instalar fuentes* / *Installer polices*), the subtitle uses a second noun for typefaces (*tipografías* / *typographies*), and the keyword field excludes both.

## Fixed-width headlines meant measuring pixels before translating

The screenshot framer draws headlines on a single line — no wrapping, no auto-shrink — to keep card heights and type size consistent across all seven languages. Two French headlines broke that rule: "Importez vos polices" and "Installez vos polices" measured 1282px and 1252px at 130pt bold, against a 1200px text box.

Rather than touch the framer, I measured every headline candidate with Pillow at the actual render settings before picking a translation. Spanish fit on the first try. French needed a part-of-speech swap — from verb phrases to nouns, "Import de polices" and "Installation" — to land under the limit without changing the meaning.

![French headline "Installation" — shortened to a noun form to fit the frame width](/blog/superfont-spanish-french-localization/fr-headline-fit.png)

## Language-neutral codes instead of regional locales

Only es-ES and fr-FR went up on the App Store — not es-MX or fr-CA. Adding regional locales would double the copy and screenshot sets, and the app itself uses region-less `es`/`fr` language codes, so Mexican and Canadian devices already get the same translations. Only the store listing stays split by two.

The preview sentence for each screen was also picked to exercise that language's special characters: Spanish uses "¡Qué tipografía tan ágil y elegante se ve en español!" (ñ, á, ¡), French uses "« Le cœur du glaçon fond près du café », dit-elle à Noël." (œ, ç, «»). A font missing those glyphs shows it immediately in the preview.

![The Spanish preview sentence rendered on the "My Fonts" screen, with every install badge translated to "Instalado"](/blog/superfont-spanish-french-localization/es-preview-sentence.png)

## A screenshot capture collision with another session

Fastlane's SnapshotHelper writes captured PNGs to one fixed cache path on the Mac (`~/Library/Caches/tools.fastlane/`), regardless of which app or project is capturing. `snapshot` clears that path at the start of a run and collects from it at the end.

Another session was capturing screenshots for a different app on the same Mac at the same time. The Spanish run reported "Test execute Succeeded" with a green table and exit code 0, but only 1–2 of 11 PNGs existed. A later run produced a full set of 11 — rendered in Korean, because it had picked up the other session's `language.txt`. Screenshots from each app ended up in the other's folder.

Exit codes and green tables never surfaced the collision. The fix: check for another fastlane/snapshot process from a different working directory before capturing (`pgrep`, then `lsof` on its working directory), never run `xcrun simctl shutdown all` (it kills the other session's simulator too), and count and actually look at the PNGs per locale instead of trusting the exit code. The two sessions then coordinated by message and took turns.

## Where it stands

iPad screenshots still show the status bar date in the simulator's system language rather than the app's language — Chinese for the two new locales, Korean for the rest. Not fixed yet.
