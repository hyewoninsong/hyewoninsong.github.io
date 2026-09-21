---
title: "The note quiz now asks how notes come, not just which"
date: 2026-09-21
app: "notequiz"
tags: ["devlog", "design", "swiftui"]
summary: "Range only says which notes can appear. A second axis picks how: lines only, chains of thirds, landmark do, or reading the next note from a labeled one. The first idea, splitting by octave, lost."
---

SuperNoteQuiz's test tab gained a `Practice style` card. Until now you picked, per clef, how many ledger lines the quiz may use, and one random note came out of that range. Now you also pick how notes come: only notes on lines, only in spaces, each a third above the last, only do and its neighbors, or a labeled first note followed by the one you have to name. Range and style multiply: "bass clef, easy × chain of thirds downward" is exactly "from middle C down: do la fa re si sol mi do".

## Range is *which*, style is *how*

Random single notes never taught two things. Staff reading rests on the line chain (mi sol si re fa) and the space chain (fa la do mi), and shuffled notes never let those chains settle. And real sight reading is not naming absolute positions one by one; it is reading how far the note moved from the last one.

| Style | What comes out |
|-------|----------------|
| Random | The old behavior, and the default |
| Lines only / Spaces only | Notes at even staff positions, or odd ones |
| Chain of thirds | Single notes, but each a third above (or below) the previous. Up, down, or alternating |
| Landmarks | Only do and its neighbors si and re: find do, then count one step |
| Two-note reading | Two notes on the staff. The first is labeled; you name the second. Interval 2nd, 3rd or mixed; direction up, down or mixed |

![The practice card. Only the chosen row unfolds its own options](/blog/notequiz-practice-modes/practice-card.png)

Options that belong to a style live directly under its row. A separate card would need prose to say which style the direction belongs to; placement says it. Switching styles keeps the options, so coming back finds them where you left them.

The subset styles also show in the range preview above: of the notes inside the range, only those the style lets through are inked. The generator and the preview call the same function.

![With Lines only, the preview keeps ink only on the line notes](/blog/notequiz-practice-modes/lines-only-preview.png)

## Why not split by octave

The first idea was "skip-counting within one octave", since do sits on a ledger line at middle C but in a space an octave up. But a third above a line is always a line, and a third above a space is always a space. What changes is the mapping from name to line-or-space, and its period is exactly eight notes, one octave. Start the treble line chain at middle C and you get do mi sol si re fa la do; that is one full turn.

Cutting at the octave would break the chain in half. So a chain is defined by (clef, lines or spaces, direction) and runs the whole range in one go; crossing the octave is the point. When it reaches the end it restarts at the bottom of the other kind, and `Alternate` reads the same chain back down before switching.

Landmarks got simpler the same way. The two clefs mirror around middle C. I considered asking for the octave (C3, C4, C5) of a lone do, but that needs a second answer tray. Asking for do, si and re keeps the seven-name tray and the per-question timer says how fast you find do. The octave version stays on the list.

## The label is not the answer

The app never shows the correct name after a wrong answer, in any form. Two-note reading writes a name on the staff, which looks like a conflict, but the label belongs to the note that already passed; the answer is the next one. Knowing the first note is mi is the premise of the exercise.

![The first note is labeled mi; the question is the note a third above it](/blog/notequiz-practice-modes/two-note-reading.png)

The staff decided where the label goes. Below the head is the stem; two half-steps above and below are the next ledger lines. The only empty side is the left. So the pair shifts slightly right and the name sits to the left of the first head, at head height, in gray rather than ink because it is given, not answered. The first note must also be inside the chosen range, or "up to one ledger line" stops being true.

Chains are predictable by design, which brushes against the rule that the quiz screen shows nothing that brings you closer to the current answer. Here the order is what is being practiced. In return the record keeps the style apart from random: the session chip says `Chain of thirds ↑`, and random sessions say nothing, because a default written on every row distinguishes nothing.

## Where it stands

A question is still one note, so records and statistics are untouched. The first note of a two-note question is saved but the review screen draws only the answered note. Accuracy in chain sessions is not the same number as in random ones; the chip makes that readable, but stats are not yet split by style.

## History

- 2026-09-21 — practice styles added (lines/spaces, chain of thirds, landmarks, two-note reading)
