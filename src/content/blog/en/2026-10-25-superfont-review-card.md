---
title: "Porting the review thank-you card to SuperFont, with two changes"
date: 2026-10-25T00:32:48+09:00
app: "superfont"
tags: ["devlog", "swiftui", "appstore"]
summary: "SuperFont now shows a short note from the developers to people who keep using it, and asks the system for a rating when the note is closed. Copy, layout and frequency match Super Timetable; what counts as a regular user, and how the card appears, are SuperFont's own."
---

If you've opened SuperFont on three different days and have at least one font installed, the app greets you with a short thank-you card. SuperFont had no way to ask for reviews at all, and reviews are half of what moves search ranking.

## The card says thanks; the system asks for stars

![The SuperFont thank-you card: split-A app icon, title, signature and a single button](/blog/superfont-review-card/thanks-card-en.png)

The card is Super Timetable's, word for word in all seven languages: an ink-colored letter with the app icon, a title, three lines, a signature and one button. It never asks for a rating. Splitting people into "like / dislike" and sending only the happy ones to the rating sheet breaks App Store guideline 5.6.1, so closing the card in any way calls `requestReview`. The system may still decline to show it (three times a year, never on TestFlight), and the card has to make sense on its own.

Frequency is the same too: three days of use, once per version, and at least 90 days since the last time.

## A regular user is someone with a font installed

Super Timetable waits for five schedules. SuperFont has no such count, so it waits for **at least one font family currently installed**, using the same check that decides "installed" everywhere else in the app. Five families was too high for people who install one or two typefaces at a time, and showing the card right after an install would put it under the full-screen install wizard.

## No entrance animation

Super Timetable's card springs in. SuperFont doesn't do entrance animations, so the card is simply there, with a success haptic; only closing fades. The icon is SuperFont's real home-screen icon, the split A. A first pass used the splash's whole serif A, which only looked close; now the icon script renders the card's copy too, and a test compares the two files byte for byte. There is no menu item to summon it.

## Where it stands

The simulator can't install profiles, so the card never appears on its own there. The first real impressions will come from the store build, counted by `review_thanks_shown`.
