---
title: "The note quiz now asks how notes come, not just which"
date: 2026-09-21
app: "notequiz"
tags: ["devlog", "design", "swiftui"]
summary: "Range only says which notes can appear. A second axis picks how: find do, count from the nearest do line by line, lines only, spaces only. Splitting by octave lost, and so did the chain of thirds."
---

SuperNoteQuiz's test tab gained a `Practice style` card. Until now you picked, per clef, how many ledger lines the quiz may use, and one random note came out of that range. Now you also pick how notes come: only do and its neighbors, a labeled nearest do you count from, only notes on lines, only in spaces, or random. Range and style multiply: "bass clef, easy × two-note reading downward" is exactly "count down from middle C".

## Range is *which*, style is *how*

Random single notes never taught two things. Staff reading rests on the line chain (mi sol si re fa) and the space chain (fa la do mi), and shuffled notes never let those chains settle. And real sight reading is not naming absolute positions one by one; it is reading how far a note sits from one you already know.

Five styles, listed in learning order:

| Style | What comes out |
|-------|----------------|
| Landmarks | Only do and its neighbors si and re: find do, then count one step |
| Two-note reading | A labeled nearest do plus the question note. Count from do, line by line or space by space, and name the note. Direction up, down or either; kind lines, spaces or both |
| Lines only / Spaces only | Notes at even staff positions, or odd ones |
| Random | The old behavior, still the default |

![The practice card. Only the chosen row unfolds its own options](/blog/notequiz-practice-modes/practice-card.png)

Options that belong to a style live directly under its row. Switching styles keeps them, so coming back finds them where you left them. The subset styles also show in the range preview above: only the notes the style can actually ask are inked. The generator and the preview call the same function.

![With Lines only, the preview keeps ink only on the line notes](/blog/notequiz-practice-modes/lines-only-preview.png)

## Why not split by octave

The first idea was "skip-counting within one octave", since do sits on a ledger line at middle C but in a space an octave up. But a third above a line is always a line, and a third above a space is always a space. What changes is the mapping from name to line-or-space, and its period is exactly one octave. Cutting there would break the counting path in half; crossing the octave is the point.

Landmarks got simpler the same way. I considered asking for the octave (C3, C4, C5) of a lone do, but that needs a second answer tray. Asking for do, si and re keeps the seven-name tray and the per-question timer says how fast you find do.

## The label and the dots are not the answer

The app never shows the correct name after a wrong answer, in any form. Two-note reading writes a name on the staff, but the label belongs to the given do; the answer is the note you reach by counting from it. The name sits to the left of the do's head, at head height, in gray rather than ink, because that is the only side the stem and ledger lines leave empty.

## 2026-09-21 — the chain of thirds is gone, and two-note reading counts from do

The first version had six styles: a `Chain of thirds` that fed each question a third above or below the last, and two-note reading whose labeled first note was *any* note a second or third away. A day of use showed both were off.

The chain was an order, not a question. Do mi sol si in sequence means each answer follows from the previous one; that is reciting, not reading, and neither the timer nor the accuracy compared with other styles. What the chain was meant to teach, skipping by lines or by spaces, belongs *inside* one question.

And an arbitrary first note was the wrong anchor. What sight readers actually anchor on is do. Landmarks and two-note reading were the same axis using different anchors.

So the styles now form one line: counting from do. Two-note reading shows the **nearest do in the chosen direction**, labeled, and marks every slot between do and the question note that is the same kind as the question, lines if the question is on a line, spaces if it is in a space, with a gray dotted head. A dotted head outside the staff gets its ledger lines dotted too; without them you cannot tell which ledger line it sits on.

![Counting down by lines from do (C5) to mi (E4); si and sol in between are dotted](/blog/notequiz-practice-modes/two-note-from-do.png)

Direction changes which do counts as nearest. `Up` uses the closest do *below* the note, `Down` the closest one *above*, `Either` the closest overall. The do may sit outside the chosen range, which reverses what the first version said: the do is given, not read, and keeping it inside the range would drop half the `Down` questions in a narrow range. Do itself is never asked.

Landmarks got the same dots. A re or si question shows the adjacent do slot as one dotted head to the left, unlabeled, because knowing where do is *is* the drill.

![A re question (D6). The do slot to its left is a dotted head on dotted ledger lines](/blog/notequiz-practice-modes/landmark-do-hint.png)

The dots are the counting path, not the answer: empty heads with no name, and counting them is the exercise. They are derived per question and never saved. They stand in the column between the two heads, where nothing else is, and the pair spreads from 1.9 to 2.8 head widths only then, so the dots clear both sets of ledger lines.

## Where it stands

A question is still one note, so records and statistics are untouched. The review screen draws only the answered note, no do and no dots yet. With no style that gives the answer away by order, timing and accuracy now compare across styles, but stats are not split by style.

## History

- 2026-09-21 — practice styles added (lines/spaces, chain of thirds, landmarks, two-note reading)
- 2026-09-21 — chain removed; two-note reading counts from the nearest do with dotted skip hints; landmarks show the do slot; dotted ledger lines
