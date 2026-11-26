---
title: "Players draw their own monsters, and mark where they hit, cell by cell"
date: 2026-11-27T04:14:26+09:00
app: "voxel-roguelike"
tags: ["devlog", "godot", "design"]
summary: "A workshop where the player makes maps, creatures and floor tiles. Patterns are built from fixed steps plus cell shapes drawn on a grid, not scripts, so the rule that every hit is announced a turn early holds for anything a player makes."
---

Players can now build a map, draw a monster on a 16x16 board and decide what it does on each turn. The editors we already had needed a three-button mouse and wrote the game's own data, so they were hidden on a phone and a player could make nothing.

## Three makers, all taps and drags

| Screen | What it does |
|---|---|
| Creature Maker | Draw it, then build a pattern that runs one step per turn |
| Tile Maker | Draw a piece of floor and give it a beat: rest, strike, push |
| Map Maker | Raise and lower ground, place both of the above next to the built-in ones, play it |

A pattern is picked from the steps the built-in enemies use, plus two that take a **shape the player marks on a grid**: `strike A` hits the marked cells, `hop A` jumps to the marked cell nearest the player.

![Pattern page: the step strip on the left, a T shape marked on a 7x7 grid, the same shape in red on the preview lawn](/blog/voxel-roguelike-workshop/pattern-editor.png)

![Map Maker with two drawn creatures, a statue and tiles showing the cells they strike](/blog/voxel-roguelike-workshop/map-maker.png)

## A drawn monster is a thick cut-out, not a sprite

The game is 3D with cartoon shading. A flat quad would take no light and cast no shadow. So each pixel becomes a small block, three pixels deep, leaning back 24 degrees toward the camera. It is lit, shadowed and outlined like the models. It never turns sideways, where it would be a sliver; it mirrors when it looks left.

![In the game: a drawn creature has turned toward the player and its T-shaped strike is marked in red](/blog/voxel-roguelike-workshop/in-game.png)

## Why fixed steps and shapes instead of scripts

The game's rule is that every hit shows a turn early. Free-form scripting cannot promise that for player-made content. With a fixed vocabulary and drawn cells, the engine can always compute and mark what will be hit.

Shapes that turn toward the player were the hard part: aim at the moment of the strike and the marked cells are not the cells that get hit. So the creature turns and locks its aim **at the end of the turn before**. The player gets one turn to step out.

What lost:

- **Making the old editors work on a phone.** They are built on hover and right-click and must keep writing the game's data. Separate screens, shared logic and rendering.
- **Embedding creatures in the map file.** Self-contained, but tuning a creature would not change the maps that already use it. Maps refer to ids instead.
- **Blocks with a drawn top.** Block ids are integers in every map file and the terrain shader has no UVs. A drawn tile is a thin slab on the trap layer; one that only rests is decoration.

## Ids are made once

Maps point at creatures and tiles by id. The id is made from the name at the first save and never changes, so a rename cannot empty a map. A deleted creature is left out; a deleted tile is plain floor. Normal runs never load workshop content, so balance does not depend on what is in someone's folder.

## Where it stands

Checked on the desktop with scripted clicks; drawing with a finger on a phone is untested. No sharing, no animation frames, no per-tile timing offset yet.
