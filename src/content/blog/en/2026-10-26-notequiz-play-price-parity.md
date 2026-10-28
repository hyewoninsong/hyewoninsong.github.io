---
title: "Remove Ads costs the same on Google Play and the App Store — matching only the Korean price doesn't get you there"
date: 2026-10-26T22:40:16+09:00
app: "notequiz"
tags: ["devlog", "android", "appstore"]
summary: "Both stores got a 11,000 KRW base price and automatic conversion everywhere else, and the US alone came out at 6.99 vs 8.49 dollars. How we made the App Store the single source of truth for 174 Play regions, and the API traps on the way."
---

SuperMusicNote's one-time "Remove Ads" purchase now costs the same in every country on Google Play and the App Store. Setting the Korean price and letting each store convert the rest does not achieve that.

## Same base price, different prices

Both products were created the same way: 11,000 KRW in Korea, the store converts everything else. Apple's converter uses price tiers with rounding and local-market adjustments; Google's multiplies by exchange rates. Same input, different output:

| Country | App Store | Play (before) | Play (after) |
|---|---|---|---|
| US | US$6.99 | US$8.49 | US$6.99 |
| Germany | €7.99 | €8.99 | €7.99 |
| Japan | ¥1,100 | ¥1,440 | ¥1,100 |
| UK | £6.99 | £7.49 | £6.99 |
| Taiwan | NT$220 | NT$280 | NT$220 |
| Brazil | R$49.90 | R$40.99 | R$49.90 |
| Argentina | US$6.99 | ARS 12,700 | ARS 10,700 |

## The App Store is the source of truth

A script reads the iOS price schedule through the App Store Connect API (1 manual plus 174 automatic territories) and writes the same customer price into the Play product per region, then reads it back. It now lives as a two-step skill: `plan`, then `apply`. Of 174 Play regions, 152 changed, 5 were already equal, 17 Play-only regions kept their price, and 18 App-Store-only territories were ignored.

About 30 countries are the exception: Apple bills in USD or EUR where Play bills in local currency (Argentina, Ukraine, Kenya, Morocco, Paraguay, Mongolia). Copying digits would set the wrong currency, so the iOS amount is converted with Play's own converter. Equivalent value, not identical digits.

Alternatives that lost: keeping per-store conversion (the stores disagree by 15-30%), pinning only the big markets by hand (100+ countries still differ and drift), and editing 170 rows in Play Console (an afternoon per price change, no record). The cost: Play prices no longer follow exchange rates. They move only when the App Store price moves and the sync runs again.

## The product didn't exist yet

When the ads build reached testers, the Play product did not exist: empty price, every purchase failed. Finding that out through the API had traps:

- The legacy `inappproducts` endpoint answers `403 "Please migrate to the new publishing API"`. It reads like a permission error; it is a deprecation message.
- The new resource is `oneTimeProducts`, capital T. The lowercase path is a plain Google 404 page.
- A product created via `oneTimeProducts:batchUpdate` with prices in every region is still `DRAFT` until a separate `purchaseOptions:batchUpdateStates` call activates it.
- On the Apple side, price rows live under `/v1/inAppPurchasePriceSchedules/{id}/manualPrices|automaticPrices`, not the guessable `/v2/inAppPurchases/{id}/iapPriceSchedule/...` (that returns `PATH_ERROR`).

The script now reads back after create, after pricing and after activation.

## Where it stands

The product is `ACTIVE` with iOS-equal prices. The 1.1.0 production release is a draft waiting for the Console rollout. License testers and one real test purchase are still to do.
