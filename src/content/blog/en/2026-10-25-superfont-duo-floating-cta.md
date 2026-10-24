---
title: "The foldable iPhone's side strip had no SuperFont buttons in it"
date: 2026-10-25T02:59:21+09:00
app: "superfont"
tags: ["devlog", "swiftui", "design"]
summary: "On the iPhone Duo simulator SuperFont's side strip showed nothing but the clock. Only system toolbar icons move there, so the trash and close buttons became toolbar items, and the bottom install button lost its bar and now floats as tinted glass."
---

On iPhone Duo, SuperFont's trash and close buttons now sit as round buttons in the strip along the right edge. The install button dropped its gray bar and floats over the list as translucent glass. iPhone gets the same look.

## The strip was empty

iOS 27.1 on iPhone Duo moves navigation bar and toolbar icons into a vertical strip beside the content. Launching SuperFont on the simulator, that strip held the clock and Wi-Fi indicator and nothing else.

![Folded Duo, font selection step: the strip shows status only and "Cancel" stays a text button top-left](/blog/superfont-duo-floating-cta/duo-folded-before.png)

The rule is narrow: only **system toolbar icon items** move. SuperFont's main screen hid its navigation bar and drew the tab picker and trash button itself, and the wizard's close was a text button. Custom-drawn buttons are left alone; text buttons stay in the horizontal bar.

## Icons go to the toolbar, text stays

| Spot | Before | After |
|---|---|---|
| Main tab picker | Custom segmented control, nav bar hidden | `ToolbarItem(.principal)` |
| My Fonts trash | Red square beside the install button | Red icon at the nav bar's trailing edge, only with a selection |
| Wizard close | "Cancel" text | System X (`Button(role: .close)`) |

![Folded Duo, My Fonts tab: the red trash stands as a round button in the strip, Reinstall floats over the list](/blog/superfont-duo-floating-cta/duo-folded-trash-strip.png)

![iPhone 17, same screen: trash at the trailing edge, picker in the middle](/blog/superfont-duo-floating-cta/iphone-trash-navbar.png)

The install button stayed put. Its label carries the count ("Install 3", "Next (3 families)") and the Google Fonts tab adds a "7 styles included" line under it. An icon in the strip would throw that away.

## The bar is gone, the glass button floats

The install button used to stand on a material bar with a divider. Without the bar, it is a glass button with the app's primary color at 62% tint, and the list scrolls through underneath. 78% looked opaque; 62% lets the cards show while white text stays readable.

![Folded Duo, install step: "Previous" is a glass capsule, "Open Settings" is tinted glass over the checklist](/blog/superfont-duo-floating-cta/duo-folded-install-guide.png)

Removing the bar exposed the wizard's "Previous": a bare text button that now collided with list text scrolling under it. It got a clear glass capsule. The note under the remove sheet's buttons moved into the body for the same reason.

## Two things that bit on the way

Moving the picker into the navigation bar turned the three tab titles into icons. A `Label` inside a nav-bar segmented control keeps only the image; `Text` brings the titles back.

The UI test that selects a family and screenshots the trash hung right after tapping the tab, "waiting for the app to idle", and failed ten minutes later. CPU was 0%, so no runaway animation. The test had been started in the background and the turn ended; the session's cleanup hook then shut down the simulator it was running on. Simulator work now stays inside one turn.

## Unfolded is still open

The Duo simulator boots folded and the unfold control lives only in the simulator window, which a locked Mac keeps out of reach. The folded posture shows the strip working; the open posture is next.

## History

- 2026-10-25 — side strip support and the floating glass CTA
