---
title: "Only the people who tapped the button missed the rating prompt"
date: 2026-10-11T03:23:16+09:00
app: "timetable"
tags: ["devlog", "swiftui", "design"]
summary: "Our thank-you card asked for a rating 2.5 seconds after it appeared. Its one button cancelled that timer, so answering the card was the surest way to never see the prompt. We fixed the button, turned the card into a letter, and a day later dropped the timer: the prompt now comes when the card closes."
---

After a few days of regular use, SuperTimetable shows a thank-you card. Closing it — with the button or by tapping outside — brings up the system rating prompt. At first the button only closed the card. This is the story of that bug; the 2.5-second timer and the "outside tap stays quiet" rule it left behind were removed the next day (last section). The card's look changed in between too — a letter from the developer instead of a big heart and confetti.

## The card waited 2.5 seconds; people did not

The card never asks for stars itself. It said thanks, left 2.5 seconds to read, then called `requestReview`. Steering only happy users to the rating prompt is against App Store review guidelines, so the card has a single button.

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

The button was changed to request the review and then close the card. That day, cancellation stayed on the outside tap (it went the next day). Since the timer and the button now trigger the same thing, a flag keeps it to once per card.

We considered relabelling the button and sending people to the App Store's write-a-review page. A card that appears on its own should not push anyone out of the app, and the system prompt enforces its own three-per-year cap.

## The manual test had written the bug down as expected

The test case for this card read: "close with the button as soon as it appears → no rating prompt." It was copied from the implementation, so the wrong implementation passed. TestFlight made it worse: the system never shows the prompt there, so broken and working look identical.

## Where it stands

For any screen that does something after a short delay, we now list every way out and what happens to the follow-up on each. If the delay is longer than it takes to read the screen, most people will tap first. Expected results come from what the button's label promises, not from the code. And when the rows of that list disagree, we first ask whether the follow-up can hang on closing instead of on a timer — which is what we did a day later.

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

With the confetti gone, the Reduce Motion branch went too. Up to this point the prompt behaviour was still: 2.5 seconds, immediately on the button, never on an outside tap.

## 2026-10-11 — no timer; the prompt comes when the card closes

A day of use made the table above feel wrong. Tap outside right away and no prompt; close three seconds later and it is already up. Same gesture, different result depending on timing. Fixing only the button had cut the inconsistency from three rows to two.

So the timer is gone. Nothing happens while the card is up; closing it requests the review. The button and the outside tap run the same function.

| How it closes | Oct 8 | Oct 10 | Now |
|---|---|---|---|
| Waiting | after 2.5 s | after 2.5 s | nothing — appears on close |
| The button | no prompt | prompt | prompt |
| Tapping outside | no prompt | no prompt | prompt |

"Tapping outside means getting rid of it" was our distinction, not the user's. To them both are closing, and the system prompt has its own "Not Now". Every way out leads to the same prompt, so nobody is being filtered toward it.

One side benefit: the prompt no longer covers the letter mid-read. The letter is longer than the old three-line card, and 2.5 seconds does not reach the signature.

The once-per-card flag stays, for a second tap while the card animates out.

## History

- 2026-10-10, afternoon — the button no longer cancels the rating-prompt timer.
- 2026-10-10, evening — heart and confetti replaced by the developer's letter card.
- 2026-10-11 — timer removed; the rating prompt is requested when the card closes (button or outside tap).
