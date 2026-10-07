---
title: "A disabled confirm button is now filled grey, not faded"
date: 2026-10-07T17:09:36+09:00
app: "timetable"
tags: ["devlog", "design", "swiftui"]
summary: "The primary button at the top right of a sheet fills with ink when it can be tapped. A hand-drawn chip first gave the disabled state a grey fill, but on the folding iPhone that chip was the one button that did not follow the others to the side bar, so navigation bars went back to the system style."
---

The checkmark at the top right of a sheet is now filled dark when you can tap it and filled grey when you cannot. Before, only the glyph faded a little, and you had to compare it with the X beside it to notice.

## The fill says "you can tap this now"

The model is the selection screen in the iPhone Photos app: a grey circle while nothing is selected, a dark one as soon as something is. The button is always visibly there; how dark it is tells you whether it works.

![Top to bottom: light disabled, light enabled, dark disabled, dark enabled. The disabled chip is still filled; the X on the left stays an empty glass circle](/blog/timetable-confirm-chip-fill/chip-states.png)

Every confirm button that has an enabled condition got the same treatment.

| Where | The checkmark is grey when |
|---|---|
| Edit event (iPhone sheet, iPad popover) | the times are reversed or outside the visible range, or no color is set |
| New timetable | no vertical axis is picked yet |
| Display | an edited value is not valid |
| Color editor | the hex string is not a color |

No new conditions were invented; each sheet already knew whether it could save. Buttons that are always tappable, such as the one that ends list editing, are left unfilled. A fill that is always on says nothing.

The fill is the label color, not the accent blue: a black circle in light mode, a white one in dark. When this was first written, blue belonged to the one primary button at the bottom of a sheet. That button was removed the same day; see the last section.

## The system button gives up its fill when disabled

The plan was not to draw anything. iOS 26 has `.glassProminent`, and with `.tint` set to the label color the enabled state looks exactly right.

Disabled is the problem. The moment `.disabled` applies, the fill disappears and what is left is the same empty glass circle as the X, with a dim glyph. That is the look we were trying to leave.

![The system prominent style. Disabled on top, enabled below: the disabled one loses its fill and matches the X](/blog/timetable-confirm-chip-fill/system-prominent-disabled.png)

Dropping `.disabled` and only blocking touches would produce the picture, but VoiceOver and UI tests would then believe the button works. So there is a small `ButtonStyle` instead. It reads `isEnabled` from the environment, picks the fill, and removes the glass's interactive press response when disabled. Call sites still just write `.disabled(…)`, so the picture and the behavior cannot drift apart. That exact drift produced a "I have to tap confirm twice" report on iPad last month.

(This hand-drawn chip left the navigation bar later the same day; see "The hand-drawn chip did not follow the bar" below. It now lives only outside bars, such as the iPad popover header.)

In a navigation bar, iOS 26 puts its own glass circle behind every toolbar item, so the chip would sit inside a second circle. `.sharedBackgroundVisibility(.hidden)` on the `ToolbarItem` turns that off, and the chip is 44pt to match the system's.

## On iPad the buttons were wedged into the corners

The iPad edit popover was fixed the same day. Its X and checkmark sat 12pt from the sides and 5pt from the top, which put them right in the popover's large rounded corners. They now sit 16pt and 15pt in, the distance measured from the iPhone sheet's toolbar buttons.

![Before on the left, after on the right: the buttons move out of the rounded corners](/blog/timetable-confirm-chip-fill/ipad-header-inset.png)

## What is left

A grey checkmark does not say why. The edit sheet has a one-line reason under the time rows; the new-timetable sheet relies on its hint text. And none of this can be verified through accessibility values, which report `isEnabled` correctly even when the picture is wrong. The check is four screenshots, enabled and disabled in both appearances, with the X in the same frame.

## 2026-10-07 — The wide bottom button is gone; the same chip does its job

Later the same day the filled chip took on more work. Print, Share as Image, and Lock Screen Wallpaper each had a full-width primary button at the bottom of the sheet. Those buttons are gone, and the action now sits at the top right as the filled chip. The edit, settings, and new-timetable sheets already confirmed with a top-right checkmark, so only the bottom-button sheets were speaking a different grammar.

![The print sheet. The top-right chip is a printer glyph, grey because no printer is chosen yet. The reason stays as one line at the bottom of the panel](/blog/timetable-confirm-chip-fill/print-chip.png)

With no title, the glyph has to name the action.

| Sheet | Chip glyph |
|---|---|
| Print | printer |
| Share as Image, Send Free Time | share arrow |
| Lock Screen Wallpaper | down arrow (save to Photos) |
| Propose a Time | copy |
| Add My Timetable, Import Periods | checkmark |

The two pick-and-confirm sheets used to show a plus and an import arrow. Both are now a checkmark: a plus at the top right reads as "create new", and this app already uses the checkmark for "confirm what I picked".

![The share sheet. The preview runs to the bottom and the single primary action is at the top right](/blog/timetable-confirm-chip-fill/share-chip.png)

### What had to survive the move

A button without a title has no name for VoiceOver or UI tests, so the component that builds the chip requires an accessibility label, and each chip keeps the identifier of the button it replaced. Capture scripts and tests find the same button unchanged.

The print sheet had a line above its button explaining why printing was blocked. Deleting it with the button would leave a grey chip and no reason on screen, so the line stays at the bottom of the panel.

The wallpaper sheet already had full-screen preview and share at the top right. With save there are three items, and the title slides from the center to the left. Only save is filled. Share (up arrow) next to save (down arrow) is worth watching.

![The wallpaper sheet. Full screen, share, and save sit on the right; the title moves left](/blog/timetable-confirm-chip-fill/lock-screen-three.png)

### Buttons that stayed

The test was whether the meaning survives being reduced to one icon.

- **Export to Calendar.** The title changes with state: add, update, move. An icon cannot say which. There are also two branches, Apple Calendar and a file.
- **"Also update similar events?"** Two choices, so there is no single primary action.
- **Delete.** Irreversible actions stay in their own group at the bottom of the content.
- **The bottom row of the timetable list.** The top right already holds two buttons, and that row was rearranged the day before. Moving it means redesigning the list toolbar, which is a separate decision.

One filled chip per sheet. With two, the fill stops saying anything.

## 2026-10-07 — The hand-drawn chip did not follow the bar

One more reversal that afternoon. Primary buttons in a navigation bar are system buttons again: `.glassProminent` with a label-color tint.

iPhone Duo moves navigation and toolbar buttons into a vertical strip on the right. In the simulator, the print sheet's close button moved to that strip, and the filled print chip stayed behind at the top.

![The print sheet on a folded iPhone Duo. The X moved to the vertical strip; the hand-drawn print chip stayed in the title row](/blog/timetable-confirm-chip-fill/duo-chip-stays-top.png)

Swapping only the button, in the same place:

| Button | Moves to the strip | Disabled look |
|---|---|---|
| Hand-drawn chip with system glass turned off | No | Grey fill |
| Unstyled system button | Yes | Faded glyph (never filled) |
| `.glassProminent` with label tint | Yes | Depends on the device |

Placement made no difference. What mattered was whether the system draws the button. The `.sharedBackgroundVisibility(.hidden)` added in the morning, to avoid a circle inside a circle, also removed the item from the set the system relocates.

![The same sheet with a system button. Print now sits under the X in the strip](/blog/timetable-confirm-chip-fill/duo-system-in-bar.png)

### What it cost

The reason for leaving the system style was that it drops its fill when disabled. That is still true on a regular iPhone.

![Disabled print button on iPhone: an empty glass circle](/blog/timetable-confirm-chip-fill/iphone-system-disabled.png)

![Enabled share button on iPhone: filled](/blog/timetable-confirm-chip-fill/iphone-system-enabled.png)

It is still better than the original, where the enabled button was not filled either and only the glyph's weight differed. Now the presence of a fill carries the state. It is less distinct than a grey fill, and that was a known trade.

On Duo's strip the same system button renders its disabled state with a grey fill, the picture the morning's chip was built to produce. The disabled look belongs to the OS and varies by runtime; drawing the whole button to pin it was expensive.

### Search collapses to a magnifier

The search field in the timetable list's bottom toolbar becomes a magnifier button in the strip. Tapping it opens a horizontal field just above the keyboard, and the lower buttons in the strip step aside. It uses the system search item, so nothing needed changing.

### From here on

To restyle a toolbar button, start from a system style plus a tint. Turn the glass off and draw by hand only outside bars. And capture one folded-Duo screenshot whenever a toolbar item is added or changed; skipping that one capture is why this flipped twice in a day.

## 2026-10-07 — Buttons that are always tappable lost their fill

A third change the same evening. The checkmark in Settings, the share button for images, and the copy button for a proposed time are no longer filled. They are plain glass buttons, the same as the close button beside them.

![Top: the Settings checkmark. Bottom: the image share sheet. Both are a single unfilled glass circle, like the close button](/blog/timetable-confirm-chip-fill/plain-actions.png)

Moving every primary action to the top right had filled all of them, including the ones that can never be disabled. Every sheet opened with a black circle in the corner. The feedback was short: when everything is emphasized, it looks wrong.

The rule is now one question. Is there ever a time this button cannot be tapped?

| Button | Can it be disabled? | Drawn as |
|---|---|---|
| Settings checkmark, image share, copy time | no | plain |
| Edit, Display, New timetable checkmarks | yes, on invalid values | filled |
| Print | yes, with no printer chosen | filled |
| Send free time, pick-and-confirm sheets | yes, with nothing picked | filled |

The shared toolbar item takes the disabled condition as an optional argument and fills only when one is passed. A button with no condition has nothing to pass, so it comes out plain without anyone choosing.

One button sits on the line. Saving a lock screen wallpaper is disabled only while the image is prepared or being saved. It stays filled for now, because it shares the bar with two secondary buttons and the fill tells them apart.

### Glass on glass draws two rings

The first attempt at the plain look used `.buttonStyle(.glass)`. The capture showed two concentric rings.

![With the glass style set explicitly: a second circle inside the one the toolbar already draws](/blog/timetable-confirm-chip-fill/glass-double-ring.png)

Since iOS 26 the toolbar draws a glass circle behind each item. A glass button style on top adds another one inside it. The fix is to set no button style at all and apply only the ink tint. This does not show in code review. It showed in the screenshot.


## History

- 2026-10-07 — Disabled checkmark filled grey; iPad popover header insets
- 2026-10-07 — Wide bottom primary buttons replaced by the top-right filled chip (seven sheets)
- 2026-10-07 — Navigation-bar primary buttons back to the system style (iPhone Duo strip); hand-drawn chip only outside bars
- 2026-10-07 — Always-tappable primary buttons (Settings checkmark, image share, copy time) lost their fill; the fill is only for buttons that can be disabled
