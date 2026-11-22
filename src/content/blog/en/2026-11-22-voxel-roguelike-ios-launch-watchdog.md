---
title: "Our first TestFlight build died on launch because the phone was compiling shaders"
date: 2026-11-22T21:55:47+09:00
app: "voxel-roguelike"
tags: ["devlog", "godot"]
summary: "The Godot iOS build of our turn-based roguelike was killed by iOS on first launch. Not a crash, a 5-second watchdog. Baking shaders at export time fixed it, but the bake can fail without saying a word."
---

Voxel Roguelike is a turn-based grid roguelike built in Godot 4.6: you move one tile, every enemy moves once. On a phone you swipe to move or attack and tap `Wait` to pass a turn. The first TestFlight build closed the moment it opened. The current one launches cleanly on a fresh install.

![Touch layout: hearts, floor and turn top left, Restart and Back top right, Wait bottom right](/blog/voxel-roguelike-ios-launch-watchdog/touch-play.png)

## It looked like a crash, but iOS cut it off at 5 seconds

The report said crash. The log said otherwise: `EXC_CRASH (SIGKILL)`, termination `0x8BADF00D`, "scene-update watchdog … 5.00 seconds". iOS kills a foreground app that goes 5 seconds without updating its scene. The main thread was inside `newRenderPipelineStateWithDescriptor:`, waiting on the Metal compiler.

Godot's Forward+ renderer compiles shaders the first time it needs them. A fresh install has no cache, so the first frame waited on hundreds of compiles. Nothing gets cached when the app is killed, so every relaunch died the same way.

## Why the Mac never showed it

We had only checked the build on an Apple Silicon Mac ("Designed for iPad"), where the compile is fast and no watchdog applies. The simulator was not an option: the official 4.6.2 template's simulator library is x86_64 only. The only real check is a phone: uninstall, install, first launch.

## Bake at export, not on the phone

- **Mobile renderer:** fewer shaders, but no normal buffer for our outline pass, so a second outline technique.
- **Loading screen plus shader warm-up:** dodges the watchdog, costs a wait on every first launch and a full list of shader variants.
- **Godot 4.6's shader baker:** compiles to Metal libraries on the Mac at export time and packs them.

We chose the baker: one preset line (`shader_baker/enabled=true`), no game code. The package grew from 2 MB to 9 MB. A few engine variants (`Fsr2*`) still fail to bake with the current Metal toolchain and compile on device, but nothing on the first screen needs them. The next build launched on the same phone.

## The bake fails silently

| Requirement | If missing |
|---|---|
| Export without `--headless` | No rendering device, no bake |
| Xcode's Metal Toolchain | No compiler for `.metallib` |
| Godot can find that Xcode | One warning line, SPIR-V only |

The third one bit us on build 7. Xcode lives outside `/Applications` here and `xcode-select` points at the Command Line Tools, so `xcodebuild` and the upload always ran with `DEVELOPER_DIR`, but the Godot export did not. The export exited 0 with one line buried in the log (`Metal shader baking limited to SPIR-V`) and a 7.6 MB package. With `DEVELOPER_DIR` set it came out at 11.8 MB. Uploading the first one would have brought the watchdog kill back.

Now every export gets two checks before archiving: grep the log for `limited to SPIR-V`, and make sure the package did not shrink against the last build.

## Where it stands

Build 7 is on TestFlight. Next: move those checks and the fresh-install launch on a phone into the export script instead of a checklist.
