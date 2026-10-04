---
title: "Opening Spanish and French stores, and receiving another app's screenshots"
date: 2026-10-01T17:17:11+09:00
app: "timetable"
tags: ["devlog", "appstore"]
summary: "SuperTimetable now speaks Spanish and French, with fresh screenshots in seven languages. A second app was capturing at the same time, and the two runs traded screenshots. Four cards already on the store turned out to have clipped captions."
---

SuperTimetable now works in Spanish and French. The App Store listing gained four storefronts: Mexico, Spain, France and Canada. The screenshots were recaptured in all seven languages. The sample timetables in them are two real ones built in the app.

## Four storefronts, two sets of cards

![Spanish and French cards — the same timetable in each language](/blog/timetable-store-seven-languages/store-cards-es-fr.png)

The app has one Spanish and one French translation. Inside the app, a block on the grid is an "evento" or an "événement", because "clase" or "cours" would only cover classes. So Spain reuses the Mexican cards and Canada reuses the French ones. Only the keywords differ, and each set uses the words local students actually type.

## Another app's screenshots landed in our folder

After the first run, the Korean folder held 12 images, and 11 of them were a font app's onboarding. Another session was capturing that app at the same moment. Our timetable screens had ended up in its Spanish folder, and its whole Spanish set had come out in Korean.

fastlane's `SnapshotHelper` writes PNGs and the capture language to the host user's `~/Library/Caches/tools.fastlane/`. After each language, fastlane moves every PNG in that folder into the output of whichever run is sweeping it. Two runs share one bucket, and they also share the same-named simulator. Both runs still exited 0.

The fix is to run only one capture per machine. Check `pgrep -fl "fastlane ios"` before starting, agree on an order if another run is live, and compare file names against the plan rather than counting files.

## Four captions shipped clipped

![The previous English card — both ends of the caption cut off](/blog/timetable-store-seven-languages/caption-clipped.png)

The card compositor never wraps or shrinks text, so a line wider than its 1,200px block runs off both edges. Measuring the new languages exposed two English and two Japanese captions that had been live for a week. We shortened the captions, and the compositor now measures every line in every language and refuses to draw one that doesn't fit.

![The fixed English card](/blog/timetable-store-seven-languages/caption-fixed.png)

The same pass found that the compositor was ignoring the `opacity` value used for the faded "before" ghost on the Undo card. The old block colour had been pale enough to hide this. Once the colours became vivid, the ghost looked like a real block.

## What's left

The new listings go out with the next version.

One iPad capture had been failing a drag-endpoint assertion for a week. We first called the screenshot fine, but it wasn't. The 2:30 endpoint was below the fold, so the drag stopped at the screen edge and made a block that ended at 2:20. The capture now scrolls the grid by a measured amount first, and requires the endpoint to be outside the 100pt auto-scroll band. The recaptured card is live on the store.

## 2026-10-01 — A failed poll did not undo the upload

While replacing the approved screenshots in other languages, the uploader stopped after its first PNG. Reading the server record showed that the image was already `COMPLETE`. The transfer had succeeded; the processing-state poll had failed.

Installed fastlane 2.240.1 does not expose `AppScreenshot.get`. Its supported call is `ConnectAPI.get_app_screenshot(...).first`. Ruby syntax validation could not detect the missing method, and the first real call happened after a write. Recovery reads the existing resource and checksum, reuses completed work, and resumes only what remains.

The attached-build guard had a related gap. Fetching `AppStoreVersion` without `includes: "build"` could leave the model's build value `nil` even when a build was attached. An unloaded relationship is unknown, not absent. A screenshot-only update still needs an explicitly loaded version and build identity to compare before and after.

The new preflight checks the installed SDK and exercises the exact getters against existing resources using GET requests only, before any deletion or upload reservation. This records the diagnosis and recovery procedure, not a claim that the entire localized replacement has finished. Final server readback establishes that separately.

## History

- 2026-09-25 — Spanish and French listings; shared capture cache and clipped-caption fixes.
- 2026-10-01 — Separate server upload success from local polling failure; verify getters and the attached build before writes.
