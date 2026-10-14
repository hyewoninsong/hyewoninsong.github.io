---
title: "The alarm did ring: eight minutes late, for three seconds"
date: 2026-10-14T21:52:13+09:00
app: "timetable"
tags: ["devlog", "android"]
summary: "Since Android 14, fresh installs get exact alarms denied by default, so class alarms fired up to 10 minutes late as a single notification chime. We now declare USE_EXACT_ALARM, ask clearly where the permission can still be revoked, and make the fallback ring until stopped."
---

Class alarms on Android now ring on the minute and keep ringing until you stop them. A user reported that an alarm "didn't ring". It did, just late and very briefly.

## What we measured

On a freshly installed emulator (Android 15), with an alarm set for the start of a class three minutes away:

| | Exact alarms off (fresh-install default) | On |
|---|---|---|
| Registered as | inexact, 10-minute window | exact |
| Fired | scheduled 21:30 → 21:38 | 21:40:00 |
| Sound | one 3-second chime | loops until stopped |

## What was going on

Android 14 denies `SCHEDULE_EXACT_ALARM` to new installs, with no runtime prompt, only a Settings page. Without it the app fell back to `setWindow`. That alarm can still fire, but the background start of a foreground service is only allowed for *exact* alarms, so playback was refused (`Background started FGS: Disallowed`). What was left was one notification sound.

The request was weak too. The only prompt was a snackbar that showed up at the same moment as the system notification prompt. Granting access later didn't re-register anything, so alarms stayed inexact until the next edit. Dev devices never showed it: they had granted the permission long ago, and `adb install -g` never touches app-ops.

## Why this fix

- **Only ask harder**: no policy risk, but "Not now" still means late alarms.
- **Declare `USE_EXACT_ALARM`**: granted at install on Android 13+. Play limits it to alarm and calendar apps and requires a declaration.
- **Both**: chosen. The declaration covers 13+. On 12–12L, where users can revoke access, a confirm alert (shown after the notification prompt) and a warning row in the alarm card ask for it.

## What changed

- Fresh installs register exact alarms; with no permission touched, the alarm fired at 21:50:00 and rang until stopped.
- Granting access re-registers every alarm right away, with no edit needed.
- The fallback notification uses `FLAG_INSISTENT` and repeats until stopped. Playback was still running eight seconds after it fired.

The Play Console exact-alarm declaration has to be filed before the next production release.
