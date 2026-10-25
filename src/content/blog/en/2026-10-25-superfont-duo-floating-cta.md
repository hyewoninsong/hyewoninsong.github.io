---
title: "The foldable iPhone's side strip had no SuperFont buttons in it"
date: 2026-10-25T11:40:00+09:00
app: "superfont"
tags: ["devlog", "swiftui", "design"]
summary: "On the iPhone Duo simulator SuperFont's side strip showed nothing but the clock. Only system toolbar icons move there, so the trash and close buttons became toolbar items and the install button now floats as tinted glass. Later the same day the segmented tab picker turned out not to move either — a system tab bar does, and now the tabs stand at the bottom of the strip."
---

On iPhone Duo, SuperFont's trash and close buttons now sit as round buttons at the top of the strip along the right edge, and the three tabs sit at its bottom. The install button dropped its gray bar and floats over the list as translucent glass. On iPhone the tabs moved down into a glass tab bar.

## The strip was empty

iOS 27.1 on iPhone Duo moves navigation bar and toolbar icons into a vertical strip beside the content. Launching SuperFont on the simulator, that strip held the clock and Wi-Fi indicator and nothing else.

![Folded Duo, font selection step: the strip shows status only and "Cancel" stays a text button top-left](/blog/superfont-duo-floating-cta/duo-folded-before.png)

The rule is narrow: only **system toolbar icon items** move. SuperFont's main screen hid its navigation bar and drew the tab picker and trash button itself, and the wizard's close was a text button. Custom-drawn buttons are left alone; text buttons stay in the horizontal bar.

## Icons go to the toolbar, text stays

| Spot | Before | After |
|---|---|---|
| Main tab picker | Custom segmented control, nav bar hidden | `ToolbarItem(.principal)` — replaced by a system tab bar that afternoon, see below |
| My Fonts trash | Red square beside the install button | Red icon at the nav bar's trailing edge, only with a selection |
| Wizard close | "Cancel" text | System X (`Button(role: .close)`) |

![Folded Duo, My Fonts tab: the red trash stands as a round button in the strip, Reinstall floats over the list](/blog/superfont-duo-floating-cta/duo-folded-trash-strip.png)

![iPhone 17, same screen: trash at the trailing edge, picker in the middle — the picker became a bottom tab bar later that day](/blog/superfont-duo-floating-cta/iphone-trash-navbar.png)

The install button stayed put. Its label carries the count ("Install 3", "Next (3 families)") and the Google Fonts tab adds a "7 styles included" line under it. An icon in the strip would throw that away.

## The bar is gone, the glass button floats

The install button used to stand on a material bar with a divider. Without the bar, it is a glass button with the app's primary color at 62% tint, and the list scrolls through underneath. 78% looked opaque; 62% lets the cards show while white text stays readable.

![Folded Duo, install step: "Previous" is a glass capsule, "Open Settings" is tinted glass over the checklist](/blog/superfont-duo-floating-cta/duo-folded-install-guide.png)

Removing the bar exposed the wizard's "Previous": a bare text button that now collided with list text scrolling under it. It got a clear glass capsule. The note under the remove sheet's buttons moved into the body for the same reason.

## Two things that bit on the way

Moving the picker into the navigation bar turned the three tab titles into icons. A `Label` inside a nav-bar segmented control keeps only the image; `Text` brings the titles back.

The UI test that selects a family and screenshots the trash hung right after tapping the tab, "waiting for the app to idle", and failed ten minutes later. CPU was 0%, so no runaway animation. The test had been started in the background and the turn ended; the session's cleanup hook then shut down the simulator it was running on. Simulator work now stays inside one turn.

## 2026-10-25, afternoon — the tabs needed a tab bar, not a segmented control

The picker in the navigation bar never reached the Duo strip. Three text segments are not icon items, so the strip still held one trash button and the tabs stayed above the content. The question was whether the tabs could move to the bottom and, on Duo, to the right side. The answer was not where to put the segmented control but to use a system `TabView`.

Three `Tab(title, systemImage:, value:)` entries, each with its own `NavigationStack`; the icons are the document, globe and "Aa" that were already there.

| Device | Where the tabs land |
|---|---|
| iPhone | Bottom glass tab bar, the install button floats right above it |
| iPad | Floating tab bar at the top |
| Duo, folded and open | Bottom of the right strip, icons only |

![iPhone 17, bottom: the floating "Install 3" button above the glass tab bar](/blog/superfont-duo-floating-cta/iphone-bottom-tab-bar.png)

![Open Duo, My Fonts: with one family selected, the red trash sits at the top of the strip and the three tabs at its bottom](/blog/superfont-duo-floating-cta/duo-open-tabs-strip.png)

The morning rule holds — only system-drawn icon items move — with one addition: the tabs of a system tab bar are such items.

Three paths lost. A segmented control in `.bottomBar` is still text, so it would not move, and on iPhone it adds a system toolbar under the floating button. `.sidebarAdaptable` gives iPad a sidebar toggle for three items. Custom tab symbols — an "A" inside a document, a cloud, a phone — got as far as rendering: hand-written squares and circles compiled, but long outlines produced by a geometry library compiled into empty glyphs, so the stock icons stayed.

Later that day the tabs went away entirely — the home screen became an install list and the three sources moved into sheets behind a + menu ([next post](/en/blog/2026-10-25-superfont-add-menu-sheets/)). So no tabs sit in the Duo strip now; the + and the in-sheet trash do.

What remains is the ad banner: the iPhone bottom now stacks install button, tab bar, banner. The consent form is a web view the simulator tests could not get past, so that is a device check.

## Unfolded, checked

The Duo simulator boots folded; the Open button lives in Xcode 27's DeviceHub window, and while the Mac is locked the accessibility API returns the app shell instead of the window. Unlocked, selecting the device row in the sidebar and pressing Open lit the inner display, and the tabs and trash stood in the same right strip. As a bonus, the app's own accessibility tree shows through that window, so tabs and families could be tapped without a UI test.

## History

- 2026-10-25 — side strip support and the floating glass CTA
- 2026-10-25, afternoon — segmented tabs replaced by a system tab bar; open posture verified
