---
title: "Mind map titles went to one line — and every title got cut off"
date: 2026-09-25T15:00:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui", "design"]
summary: "Node titles used to wrap across two or three lines. Now they stay on one line, growing the node up to 480pt before truncating. The first build shipped truncated every title at around ten characters — wrapping had been hiding a width-math bug that one line finally exposed."
---

Every underline you draw in SuperPDF becomes a mind map node. Titles used to wrap across two or three lines inside a 200pt-wide card. That was fine for short quotes, but a full sentence turned a node into a three-line card that ate the screen fast. A request to show titles on one line, long, sent me into a small width-math bug that had been invisible until now.

## One line, but how wide is too wide

Dropping the wrap isn't a one-line change. While wrapping was on, text past the node's width cap just fell to the next line. Remove the wrap, and there's nowhere for overflow text to go — the node either keeps growing, or something gets cut.

Two options: let the node grow as wide as the text needs, or cap it generously (480pt) and truncate anything past that with an ellipsis. Unbounded growth is the more literal read of "show it on one line," but a highlighted quote can be long, and an unbounded node would stretch the canvas sideways until the map itself became hard to navigate. I went with the 480pt cap — most titles fit comfortably under it, and only the unusually long ones get truncated.

Same pass, I also cut the vertical spacing between sibling and parent/child nodes from 12pt to 6pt. The map lays out top-to-bottom like an outline, and tighter spacing makes it read more like a page of compact notes.

![Mind map after the fix — every node title renders fully on one line](/blog/superpdf-mindmap-one-line-text/node-titles-one-line.png)

## What wrapping had been hiding

Node width isn't measured live against the screen — it's precomputed from the text plus a fixed "chrome" allowance for the icon, badges, and padding, then locked in with a fixed frame. That chrome estimate had two small, real errors: the leading type icon had no explicit width, so different SF Symbols rendered slightly wider than the assumed 14pt, and the spacing gap between the title and the trailing spacer was missing from the formula entirely.

While titles wrapped, neither error mattered — a few missing points just pushed the last word to a second line, which looked completely ordinary. The moment wrapping went away, that same shortfall had nowhere to hide, and text was cut by exactly the amount the formula was short. A seven-character title like "다시 읽을 때" ("when reading again") truncated down to two characters.

Unit tests never caught it. The width tests compared computed values against each other — "a chapter node is wider than a plain one," "a chevron adds width" — all derived from the same flawed formula, so they agreed with each other perfectly while none of them checked the formula against a real render. Only a screenshot caught the truncation, and by then the previous build had already gone out on TestFlight.

Two fixes: pin the icon's width with an explicit frame so the assumed and rendered widths match, and add the missing spacing term to the formula. I also gave the title text explicit layout priority over the trailing spacer — when width is tight, better not to leave it to SwiftUI's default.

## Where it stands

The rule I'm taking from this: removing a line-limit (wrap → single line) is not done until it's been checked against a real screenshot. Wrapping's slack can hide a width-math error for a long time, and the moment that slack disappears, the error shows up in full. Unit tests that only compare computed values to each other won't catch this class of bug — at some point the computed width has to be checked against what actually got rendered.
