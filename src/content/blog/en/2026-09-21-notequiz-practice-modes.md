---
title: "The note quiz now asks how notes come, not just which"
date: 2026-09-21
app: "notequiz"
tags: ["devlog", "design", "swiftui"]
summary: "Range only says which notes can appear. Two more axes pick how: plain reading or counting from do, and which notes come up. Splitting by octave lost, then the chain of thirds, then the five-row radio list."
---

SuperNoteQuiz's test tab gained a `Practice style` card. Until now you picked, per clef, how many ledger lines the quiz may use, and one random note came out of that range. Now you also pick how notes come, on two axes: the style (plain, or count from a labeled nearest do) and the pool (all, lines only, spaces only, do·re·si). Range and style multiply: "bass clef, easy × count from do, downward" is exactly "count down from middle C".

## Range is *which*, style is *how*

Random single notes never taught two things. Staff reading rests on the line chain (mi sol si re fa) and the space chain (fa la do mi), and shuffled notes never let those chains settle. And real sight reading is not naming absolute positions one by one; it is reading how far a note sits from one you already know.

Two axes (this started as a five-row list; the last section tells that story):

| Axis | Choices | Meaning |
|------|---------|---------|
| How it shows | Plain / Count from do | Read one note as it is, or count line by line or space by space from a labeled nearest do |
| Which notes | All / Lines only / Spaces only / Do·re·si | Which notes in the range are asked. Do·re·si is the landmark drill: find do, count one step |
| Direction | Up / Down / Either | Only shown for Count from do: is do below or above the question |

![The practice card: two pill rows, a direction row that appears for Count from do, and one line saying what the combination asks](/blog/notequiz-practice-modes/practice-card.png)

A value that only means something for one choice appears only when that choice is selected, inside the same card. Switching keeps it, so coming back finds it where you left it. The default, plain × all, is the old random. The subset styles also show in the range preview above: only the notes the style can actually ask are inked. The generator and the preview call the same function.

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

## 2026-09-21 — five radio rows became two axes, and each clef starts with a checkbox

A day later the five-row card was called too complex: five radio rows with two-line captions, and two-note reading unfolded three direction pills and three line/space pills below it. The first instinct was to make it shorter. Counting showed height was not the problem.

Lines and spaces were chosen in two places, once in the style list and again inside two-note reading. And the five rows were not one kind of question: landmarks, lines, spaces and random say *which notes come*, while two-note reading says *how the question is shown*. Picking one row answered two questions at once.

So each question got its own axis. Style is plain or count from do; pool is all, lines, spaces or do·re·si. Every old row is a point in that product: random is plain × all, landmarks is plain × do·re·si, two-note reading (lines, up) is count from do × lines + up. One pill row per axis, and instead of a caption per row, one line at the bottom of the card says what the current combination asks. The range preview above already shows the same thing as ink.

The product opened combinations that did not exist before. Count from do × do·re·si puts a labeled do right next to a re or si, which is very easy. It stays allowed: the user chose it, it is not the default drill, and blocking it would mean disabling a pill or silently changing a value already picked.

Two alternatives lost. Keeping the list and showing only the selected row's caption halves the height but keeps the duplicate. Numbering the five rows as steps 1 to 5 shows the learning order but leaves the axes mixed; with two axes the order is the pill order.

Storage keys changed. The old `mode` values and the two-note direction and kind are read only when none of the new keys is present, and mapped onto the product. The previous revision had dropped its old keys; these had been on TestFlight for days, so one switch statement was worth it. The save version did not move: every field falls back to its default, and versions are for structural changes.

The clef cards changed the same day. Each used to be four radios: off, easy, hard, very hard. But off is not a range; it is whether this clef is asked at all, a different kind of decision sitting in the same radio, and a clef that was off still showed its preview and three range rows. Now the first row of the card is an `Include in quiz` check, and only a checked clef unfolds its preview and three ranges. Unchecked, the card collapses to that one row.

![Treble clef is checked and shows its preview and three ranges; bass clef is unchecked and collapsed to one row](/blog/notequiz-practice-modes/clef-include-check.png)

Unchecking remembers the range so re-checking restores it; losing the choice on a toggle would read as a mistake. A clef never enabled before starts at the narrowest range. The check uses the same glyph slot and size as the radios but a different shape, a check mark against a filled circle, and not a switch, because every selection on this screen is a left glyph plus a full-row tap and a switch would bring in a color the screen does not use.

## Where it stands

A question is still one note, so records and statistics are untouched. The review screen draws only the answered note, no do and no dots yet. With no style that gives the answer away by order, timing and accuracy now compare across styles, but stats are not split by style.

## History

- 2026-09-21 — practice styles added (lines/spaces, chain of thirds, landmarks, two-note reading)
- 2026-09-21 — chain removed; two-note reading counts from the nearest do with dotted skip hints; landmarks show the do slot; dotted ledger lines
- 2026-09-21 — five styles split into show-how × which-notes; clef cards gated behind an include check
