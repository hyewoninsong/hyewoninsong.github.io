---
title: "Only the people who tapped the button missed the rating prompt"
date: 2026-10-10T20:56:49+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Our thank-you card asks for a rating 2.5 seconds after it appears. Its one button cancelled that timer, so answering the card was the surest way to never see the prompt. The same evening, the big heart and confetti gave way to a short letter from the developer."
---

After a few days of regular use, SuperTimetable shows a thank-you card. Tapping its button now brings up the system rating prompt right away. Before, it only closed the card. The card's look changed again the same evening — a letter from the developer instead of a big heart and confetti; see the last section.

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

## 2026-10-10, evening — a letter instead of a heart

A few hours after the button fix the card itself looked unfinished: a white card, one big pink heart, confetti, two centred lines of thanks. The heart said nothing about the content, the confetti read as a party, and centred text left the card looking empty.

Three mockups at phone size, one chosen:

- **Record** — two big numbers ("14 days / 27 events"). Fitness-summary feel, but someone who just met the threshold (3 days, 5 events) gets small numbers.
- **Your week** — a thumbnail of the user's own timetable with a caption. The most on-brand, but less serious than a letter.
- **Letter** — an ink-black card with the app icon mark, "A note from the developer", the title "Day 14 together. Thank you for being here.", a short body and a signature. This won: for a one-person app a note from that person is the most sincere, and the only dark surface on a light app pulls the eye to one place.

![The ink letter card — app icon mark, developer note header, "Day 14" title, signature, full-width white glass button over a blurred grid](/blog/timetable-review-card-button/letter-card-14days.jpg)

"Day 14" is the real count of days the app was opened. The card only appears on its own after three days, but a fresh install can force it from a menu, so below three days the title drops the number.

Two things bit on the way. The app icon is an Icon Composer `.icon` bundle and cannot be loaded with `UIImage(named:)`, so the seven bars are drawn in SwiftUI. And a glass button on an ink ground renders as dark glass, the same colour as the card — a 14 % white tint makes it a button again. The card keeps the same ink in light and dark mode; text colours come from pinning `colorScheme` to dark on the card rather than hard-coding white.

![Dark mode — same ink card, lifted off the black grid by its shadow](/blog/timetable-review-card-button/letter-card-dark.jpg)

With the confetti gone, the Reduce Motion branch went too. The rating-prompt behaviour above is unchanged.

## History

- 2026-10-10, afternoon — the button no longer cancels the rating-prompt timer.
- 2026-10-10, evening — heart and confetti replaced by the developer's letter card.
