---
title: "One name was counting two different things"
date: 2026-09-23
app: "superfont"
tags: ["devlog", "data"]
summary: "Before registering SuperFont's install-funnel metrics, we found that an analytics parameter key is not a field inside its event — it is a single app-wide name. Registration is not retroactive, and a mixed metric cannot be un-mixed."
---

SuperFont installs fonts through a configuration profile, Safari, and the Settings app. That is a lot of steps, so the app counts where people stop. To slice those counts by step and by entry point in the console, the event parameters have to be **registered as metrics** — and one name stopped us on the way to that screen.

## Registration registers a name, not an event

When you register a parameter as a custom dimension (string) or custom metric (number), what gets registered is a **single parameter name**, not "this parameter on this event." Register `count` and every event that sends `count` pours into it.

The code gives you no hint of this. Fold your events into one enum and each parameter reads like a field on its case, where a short name looks like good taste:

```swift
case .fontsRemovedFromApp(let count):
    return ["count": count]          // items removed from the app — single digits
case .googleFontsListLoaded(let count):
    return ["count": count]          // families in the fetched list — around 1,800
```

Both lines are correct where they sit. Together they make one metric that is the sum of "how many did they delete" and "how big was the list." The average and the total mean nothing, and filtering by event does not help — the metric is already the sum of two distributions.

## There is exactly one window to fix it

What made this urgent was not the size of the bug but the size of the window:

- Registration is **not retroactive.** Data accrues from the moment you register.
- A mixed metric **cannot be un-mixed.** There is no way to split the history back apart.
- Renaming **cuts the series.** That cost grows with every day of real data.

SuperFont had registered nothing yet, and simulator runs are excluded from collection by design, so almost nothing was lost. We fixed the names before opening the registration screen.

## Does it read without its event?

One rule: **a parameter name must read on its own, without its event name.** The console's metric list does not show you which event a name came from.

- `count` → `removed_count` / `listed_family_count` — two events counting different things under one name
- `from`, `to` → `from_status`, `to_status` — "from" and "to" alone say nothing about what transitioned
- `step` → `wizard_step` — which flow's step?
- `context` → `error_context` — now matches the crash-reporting key we already used
- `source` → `wizard_source` — see below

`source` had a second problem: Google Analytics already has a built-in traffic-source dimension by that name, so a custom one sits next to it indistinguishably. Avoid names the platform already owns.

The inverse is also true: **share a name deliberately when the meaning is identical.** `face_count` means "how many typefaces" on three different events, and that is a feature — register one metric and all three are covered. Sharing only hurts when the meanings differ.

## A rule the code cannot show belongs in a test

The nasty part is that the violation is **invisible in code review.** Both lines above are fine on their own; the mistake only surfaces in the console, after the data is already spoiled. A note in the docs was not enough.

So we added one case to the contract test that was already scanning for stray `print(` calls. Any key from a generic-name list (`count`, `from`, `to`, `source`, `step`, `context`, `type`, `name`, `value`, `id`, …) fails the build.

```swift
@Test func parameterKeysAreSelfDescribing() {
    for event in Self.samples {
        for key in event.parameters.keys {
            #expect(!Self.genericKeys.contains(key),
                    "'\(key)' does not stand on its own without its event")
        }
    }
}
```

It rides on the existing rule that every new event must register a sample value, so new events get their names checked for free.

## We registered the old names too

Registration happened the same day: 13 dimensions and 12 metrics — six of which are the names we had just thrown away (`context`, `step`, `source`, `from`, `to`, `count`).

Renaming does not delete what was already collected under the old name; it only removes your way of reading it. Registration binds to a name, so registering the old ones makes the pre-rename window show up in reports again. The app no longer sends those keys, so nothing new can mix in. Each one carries `legacy` and a date in its description, and `count` carries a warning that its window blends two meanings and its sum and average should not be trusted.

The same logic killed our "not worth registering" list. A parameter you do not care about today still leaves **a hole for that entire period** the day you do care. The free tier allows 50 of each, so there was nothing to save.

## Where the login gets blocked

We registered through the Admin API rather than by clicking, and got stopped once. Asking gcloud for Analytics permissions lands on Google's **"Access blocked"** screen: gcloud's default OAuth client is not verified for sensitive scopes like Analytics. Retrying does not help.

The way around it is a service account. Create one in the project, then invite it as an Editor from the Analytics property's own **access management** — no consent screen involved. The point is that the permission is granted on the Analytics side, not the Cloud side.

## Where it stands

Names and registration are both done, and the next build on real devices starts filling the new names. A metric that does not apply retroactively is a number you simply do not have until you start counting.
