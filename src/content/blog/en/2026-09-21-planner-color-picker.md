---
title: "The color picker came out of its popover"
date: 2026-09-22T20:25:00+09:00
app: "daily-planner"
tags: ["devlog", "swiftui", "design"]
summary: "Picking a todo color meant tapping a circle to open a popover. We spread the palette across the sheet, then put it back behind the circle a day later. Color is not a value you set twice."
---

*(Reversed on 2026-09-22 — the last section, if you want the ending first.)*

In the day planner, creating or editing a todo opened a sheet with the color palette already spread out under the name field. Before, you tapped the color circle to the left of the name and a popover appeared. Choosing a color is half of what this sheet does, and it was sitting behind a door.

## The door cost more than the room behind it

The sheet does two things: name the todo, pick its color. Only the name was on screen.

![The old flow: tap the circle, get a popover. Behind it sat machinery that grew the sheet first](/blog/planner-color-picker/popover-before.png)

The door was not free. The popover needs 440pt and the sheet was normally half-height, so iOS squeezed the popover into whatever space was left and clipped its header and last row. It does not flip a popover above its anchor when space runs short — it seats it in the preferred direction and cuts what does not fit. So there was code that raised the sheet to full height, waited 380 milliseconds for the animation to land, and only then presented the popover. Doing both in one go made the arrow point at an anchor that was still moving.

Removing the popover removed all of it. One detent now, no timer, no dismiss button.

![The sheet as it opens: the "in use" strip and the palette are simply there](/blog/planner-color-picker/palette-always-open.png)

The strip above the palette shows the colors other todos already use, labeled with those todos. Since two todos sharing a color are indistinguishable on the timeline, that is the most useful thing on the screen — and it used to require opening the door to see.

## The keyboard cancelled the whole point

The first capture of the new layout showed two of the four palette rows. The sheet was focusing the name field on open, and the keyboard covered the rest. The panel was permanent and still not visible.

So the name field no longer takes focus automatically. Creating a todo now costs one tap to start typing — a tap moved off color and onto the name. The sheet is less about writing down what the todo is than about deciding how you will recognize it on the timeline.

A bottom sheet for colors was the other candidate, but that is the same door under a different name. Wrapping the panel in a card was too: the hex field inside the custom-color editor is itself a card on the same background, so a card inside a card makes both disappear.

## Subtracting the ring from a height clips the first row

After the move, the swatches in the "in use" strip lost their tops — a 44pt circle rendering as 39pt, with only the bottom half of the selection ring. The 20-color grid below it, built from the same parts, was fine.

The strip is a horizontal pager. So the selection ring does not get clipped at a page edge, the content is padded by the ring's overhang and the scroll view is then widened by the same amount of *negative* padding, pushing the clip line outside the ring. But the row was given the measured content height — the height without the ring. Window `X`, content `X + ringOutset*2`. A scroll view overflowing by exactly that much rests at the bottom, which is why the clipping lands on top and the lower ring survives.

Inside the old popover the panel filled a fixed height, and those 5pt were absorbed by slack. Inline, the panel is only as tall as its content, and the slack was gone.

```swift
// window = content: give back what the negative padding widened
content + ColorSwatch.ringOutset * 2
```

Reading the code does not catch this; a 10pt overflow raises no warning and shows no scroll indicator. Measuring the circle in the screenshot did — 117px where 132px was expected at 3x. Then the same measurement on the pre-move build, to be sure it was a regression and not something that had always been true. It was a regression.

## Where it stands

The custom-color editor picks saturation and brightness by dragging, and it now lives inside a scrolling sheet, where a vertical drag would be taken by the scroll. The sheet's scroll is locked while that editor is open. That also puts the archive button out of reach for those few seconds, which seems like the right trade.

## 2026-09-22 — Back behind the circle, one day later

This post's premise was that choosing a color is half of what the sheet does. A day of use said
otherwise: color is set **once**, when the todo is created, and almost never changed. Meanwhile the
palette filled the sheet, so opening it to fix a name put four rows of swatches in front of you
first — and paying for that had already cost the name field its keyboard.

Color selection went back into a popover behind the circle. The panel itself is unchanged; a thin
wrapper gives it a 360 width and a closing checkmark.

![Tap the circle and the panel opens there, header and last row intact](/blog/planner-color-picker/popover-again.png)

The squeeze trap above is still real. This time we avoided it by **removing the need for the
workaround rather than restoring it**: the sheet keeps a single `.large` detent instead of dropping
back to `.medium`. In a tall sheet the circle sits at the top with 700pt below it, so a 440pt panel
simply fits. There is still no "grow the detent, wait 380 ms, then present".

The name field gets its keyboard back too — with the palette behind a door there is nothing for it
to cover. The cost this post accepted disappeared along with the decision that created it.

The other reason was the block editor shrinking to a small popover: the same panel would have had
to open from two places. That one ended up not touching color at all and linking to the todo editor
instead, so this sheet is the single place color is chosen.

## History

- 2026-09-21 — Moved color selection out of its popover and spread it across the sheet, dropping the name field's auto-focus. Measured and fixed the clipped first row of the "In use" strip (a height that left out the ring outset)
- 2026-09-22 — Reversed it: color selection is back in a popover behind the circle. Avoided the squeeze by keeping a single `.large` detent rather than restoring the workaround, and auto-focus returned
