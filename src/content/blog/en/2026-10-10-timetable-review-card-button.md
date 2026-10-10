---
title: "Only the people who tapped the button missed the rating prompt"
date: 2026-10-10T17:45:18+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Our thank-you card asks for a rating 2.5 seconds after it appears. Its one button cancelled that timer, so answering the card was the surest way to never see the prompt."
---

After a few days of regular use, SuperTimetable shows a thank-you card with confetti. Tapping its button now brings up the system rating prompt right away. Before, it only closed the card.

## The card waited 2.5 seconds; people did not

The card never asks for stars itself. It says thanks, leaves 2.5 seconds to read, then calls `requestReview`. Steering only happy users to the rating prompt is against App Store review guidelines, so the card has a single button.

The wait lived in the card's `.task`: `Task.sleep`, then the request. The button dismissed the card. When the card left the view tree SwiftUI cancelled the task, the sleep threw, and the request never ran.

Reading three lines and tapping a button takes less than 2.5 seconds. The only people who saw the prompt were the ones who did nothing.

## The cancellation was deliberate

The first version used `try? await Task.sleep(...)`. `try?` swallows cancellation, so dismissing the card made the prompt pop up immediately. That looked wrong, and we fixed it two days earlier by skipping the request on cancellation.

The fix was right. What it missed is that there are two ways to close the card.

| How it closes | What the person means | Rating prompt |
|---|---|---|
| Waiting | still reading | appears after 2.5 s |
| The button | answering the card | appears immediately |
| Tapping outside | getting rid of it | does not appear |

We had treated the last two rows as one.

## The button now runs the follow-up early

The button requests the review and then closes the card. Cancellation stays on the outside tap only. Since the timer and the button now trigger the same thing, a flag keeps it to once per card.

We considered relabelling the button and sending people to the App Store's write-a-review page. A card that appears on its own should not push anyone out of the app, and the system prompt enforces its own three-per-year cap.

## The manual test had written the bug down as expected

The test case for this card read: "close with the button as soon as it appears → no rating prompt." It was copied from the implementation, so the wrong implementation passed. TestFlight made it worse: the system never shows the prompt there, so broken and working look identical.

## Where it stands

For any screen that does something after a short delay, we now list every way out and what happens to the follow-up on each. If the delay is longer than it takes to read the screen, most people will tap first. Expected results come from what the button's label promises, not from the code.
