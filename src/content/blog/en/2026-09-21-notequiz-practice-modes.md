---
title: "The note quiz now asks how notes come, not just which"
date: 2026-11-01T00:47:59+09:00
app: "notequiz"
tags: ["devlog", "design", "swiftui", "android"]
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

The dots are the counting path, not the answer: empty heads with no name, and counting them is the exercise. They are derived per question and never saved. At that stage they stood in the column between the two heads, where nothing else is, and the pair spreads from 1.9 to 2.8 head widths only then, so the dots cleared both sets of ledger lines. That separate column was later replaced by the vertical ladder described in the October 15 Android layout update below.

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

## Where it stood on 2026-09-21

A question is still one note, so records and statistics are untouched. The review screen draws only the answered note, no do and no dots yet. With no style that gives the answer away by order, timing and accuracy now compare across styles, but stats are not split by style.

## 2026-10-15 — Android settings update in place, and five examples share one clock

The two-axis design above records the September 21 iteration. Practice later settled into five stages: read do, read a do-mi-sol ladder, answer with a full ladder, answer with do alone, and answer without hints. Android now shows a looping staff example beside each stage, so choosing does not depend on understanding the label first.

All five used the same treble clef and middle C (since 2026-10-29 they come from your range, below). The reading examples show do alone or do-mi-sol; the three quiz examples ask the same sol with progressively fewer hints. They share one clock: one head every 0.5 seconds, a 1.4-second hold after the longest example finishes, then a 0.35-second clear. Short examples wait for the others. Independent timers would put each card at a different point in its explanation. The clock stops when the chooser closes or the app goes into the background.

The settings had also been saving correctly while displaying old values. Clef switches and difficulty choices changed only after reopening the sheet. Stage and question count stayed stale on the home screen.

The missing link was observation. A parent composable read an update counter, but the child screens received the same object and read ordinary store fields. Compose could skip those child calls. A parent redraw did not guarantee another store read.

The screens now observe an account settings snapshot that changes with edits and account switches. Recreating the sheet would discard its interaction state; making every screen read an update counter would leave the same trap for the next screen. Observable settings put the dependency beside the value being displayed.

Regression tests inspect the switches and selected chips while the sheet remains open, then the home labels after choosing a stage or count. They also inspect account switching and the examples reaching full, clearing, and starting again. Reading the saved value alone would have missed this bug.

## 2026-10-15 — Android stacks the counting ladder on one axis

Android's hint notes had the right names and heights, but each occupied a separate horizontal slot. Do-mi-sol looked like a row of notes spread across the staff. We matched the iOS layout in the quiz, home preview, and practice-stage chooser.

### Thirds stack; neighboring heads move aside

The reference, hints, and question form one ordered chain. Notes two staff positions apart share an x coordinate, whether the ladder rises through do-mi-sol or descends through do-la-fa. Only a step smaller than two positions moves right, by 0.92 head widths, to prevent overlapping heads. A distant note stays aligned even if it switches between a line and a space.

Hint names now share a left-hand column at their heads' heights. The given do is red. Reading examples use solid heads; hints during a question remain dotted. The question's pitch is never labeled. Shared ledger lines are drawn once.

![A partial reveal shows do and mi on the same axis in solid reading and dotted quiz examples](/blog/notequiz-practice-modes/android-stage-ladder.png)

Even spacing preserved the order while changing the vertical relationship the exercise teaches. Fixing only the quiz would make the chooser demonstrate a different layout. All three now use the same geometry, with checks for the geometry itself: sharing a renderer can also share its mistake.

### Reveal changes visibility, not the layout

We calculate the complete chain before drawing its visible prefix. The hidden question already contributes its collision offset and centering. Revealing another head therefore keeps earlier heads in place. Centering only the visible notes would move the reference while the learner was counting from it.

Geometry tests cover ascending and descending thirds, both clefs, close collisions, and wider jumps. Visual checks must also compare partial and complete reveals; a finished screenshot cannot show whether the chain moved along the way.

### Home follows the decision order

The home screen now puts the animated example first, followed by one rounded card for range, practice stage, and question count. Each row shows its value and a disclosure arrow. A capsule start action stays at the bottom.

![Android home groups settings below the preview and keeps Start at the bottom](/blog/notequiz-practice-modes/android-home-setup.png)

Grading also follows the iOS pen paths. The circle wobbles slightly and overlaps its starting point. The X draws two gently curved strokes in sequence. Their green and red colors remain, while the shapes appear as marks being drawn over the chosen answer.

Question generation and stored records stay as they were. This change aligns the visual lesson and the route into it. A preview now needs to show the same counting axis as the question it represents.

## 2026-10-29 — Android range sheet: fewer circles, and weak notes alone are a range

Three rounds of iOS changes to the range sheet landed on Android at once.

**Each layer has its own control.** The clef card used to be all circles: an include check, two radio buttons, and the preview's note dots. Now the clef is a switch row (`𝄞 Treble clef ……… switch`; tapping the words works too), and the range under it is one `Easy | Hard` pill with the note count beside it, in a single card. The only circles left are the notes. A second, lighter panel inside the card was tried on iOS and lost: the double border read before the hierarchy did.

![Android range sheet: a clef switch row over one card holding the preview and an Easy/Hard pill](/blog/notequiz-practice-modes/android-range-switch-pill.png)

**Nothing on, nothing to confirm.** Every switch can still be turned off, but with no clef and no weak-note focus the check is disabled and the sheet says why. An alert on tap lost: you only find out by pressing.

![Both clefs off: the check is dimmed and a line explains what to turn on](/blog/notequiz-practice-modes/android-range-all-off.png)

**Weak-note focus alone is a range.** Focus used to weight weak notes at 60% inside the chosen clefs, so practising only weak notes still meant 40% ordinary questions. With both clefs off and focus on, the quiz now asks weak notes only, from both clefs' widest range. Quietly treating that as "both clefs on" lost because it switches back on what you switched off. One function counts what a setup can deal, and the generator, the start lock, the preview, the sheet's count and record replay all use it.

**Stage examples follow your range.** The 2026-10-15 note above says all five examples use treble middle C; no longer. A bass-only setup now shows bass examples, a new set each turn, clefs alternating when both are on. Within a turn the five cards still point at the same note.

**Saving is tapping a name, then "play again?"** (Replaced the same afternoon; see the next section.) A card tap in the save sheet saves; there is no separate Save. A finished session then asks to play again with the same settings, and a new round starts in place. A session left early does not ask.

## 2026-10-29 — one sheet decides saving and the next round, finished or not

The morning's "tap a name to save, then a play-again dialog" did not last the day. Ending a round took two decisions, you could not play again without saving, and leaving early still showed the old sheet.

Now the save sheet is one card and three buttons. The card has a `Save record` switch, on by default, and a `Save to · name >` row. Below it are `Play again`, `Next stage` and `Done`. The switch decides whether to save and the button decides what happens next, so you tap once.

![The finished save sheet: the Save record switch and the Save to row share one card, with Play again, Next stage and Done below](/blog/notequiz-practice-modes/android-save-sheet-switch.png)

`Next stage` keeps range, length and weak focus and moves the stage up one rung. The new stage is saved as that account's last setting. On the last stage, or when the next stage has nothing to ask in this range, the button does not appear. `Save to` opens the same account sheet as the home chip, where you pick, add or rename accounts. With saving off, the row dims.

Three options lost. Adding a third button to the dialog still meant two decisions. A Save / Don't save segment took more space and hid that saving is the default. Two of every button made six buttons. A dropdown for the account lasted a day on iOS, because creating and editing accounts still happened in the account sheet.

Leaving mid-round shows the same sheet with a different header. Swiping it down takes you back to the question. Leave without saving and its confirmation are gone, since switching saving off is the confirmation.

Also in this pass: in the range sheet each clef is a group like Weak spots, and the "pick at least one" notice sits at the top in accent instead of a grey footnote. *Practice these notes* now turns the clefs off, so only weak notes come up. (On 2026-10-30 it stopped starting the quiz on its own — see below.) Session replay is a worded button under the summary instead of a toolbar glyph.

![Range sheet with everything off: an accent notice at the top, and each clef a titled card whose first row is the Include in test switch](/blog/notequiz-practice-modes/android-range-empty-notice.png)

One test pitfall. After the reorder handle moved inside its account card, the drag test failed with "Failed to inject touch input", which sounds like an emulator problem. The card merges its children for accessibility, and the test looked the tag up in the merged tree, where the handle no longer had a node of its own. Searching with `useUnmergedTree = true` fixed it. The next test in the class also failed, but only as a knock-on: run alone, it passed.

## 2026-10-30 — *Practice these notes* opens the range sheet, not the quiz

The button at the bottom of the Stats tab now takes you to the Test tab and opens the range sheet: both clefs switched off, *Ask weak notes more often* on, scrolled down to the weak-note chips. The check saves it; you press Start yourself.

![The range sheet opened from Stats: both clef switches off and dimmed, only the weak-focus switch on, with the weak-note chip below](/blog/notequiz-practice-modes/android-weak-practice-range-sheet.png)

Earlier the same day the button saved the range and started the quiz at once. The range was settled, but the **practice stage** was not: it is shown only on the Test tab, which the button skipped. People started a quiz without knowing whether it would show hints, and on stage 1 a weak note that is not a do cannot be asked at all.

The sheet opens as a draft like any other range edit. X changes nothing, and a clef switched back on gets its old range back. Saving first and then opening the sheet lost because the check would open disabled and X could not undo it. Opening the stage sheet instead lost because it hides the range, which is what the button changes. Both iOS and Android changed; the `weak_notes` analytics entry is gone.

One Android pitfall: `ScrollState.maxValue` is `Int.MAX_VALUE` until the scroll area is measured. Scrolling once to the first measured value was not enough either; see the stage-3 section below. While the sheet rises, `maxValue` moves 100 → 0 → 100, so the first glide ended at 0.

## 2026-10-30 — weak-note practice starts at stage 3 (reversed the same day)

This rule was gone within hours; the next section is what the app does now. The paragraphs below stay as the reasoning of the time.

If *Practice these notes* is tapped on stage 1 or 2, the sheet shows a notice under the weak-focus card: practice starts at stage 3, and confirming sets it. The check saves the stage along with the range; the question count stays.

![The range sheet opened on stage 1, with the accent notice under the weak-focus card](/blog/notequiz-practice-modes/android-weak-practice-stage-notice.png)

Stage 1 asks only do, and stage 2 only do-mi-sol / do-la-fa. A weak-notes-only round there can ask almost nothing, and often the Start button just locks. The stage change is part of the draft, so X undoes it. Turning a clef back on hides the notice and keeps the stage. Hiding the button on stages 1–2 lost because nobody would know why it vanished.

The notice's second line was clipped at the bottom edge, which exposed a bug in the morning's scroll: it had never moved. The rising sheet resizes its body, `maxValue` goes 100 → 0 → … → 100, and a one-shot glide ends at 0. It now follows the bottom while the view sits at the last bottom it saw. The UI test compares an element's clipped `boundsInRoot` height with its own height, which `assertIsDisplayed()` does not.

## 2026-10-30 — stages 1–2 deal the range around weak notes, stage 3 adds the notes themselves

Raising the stage drew an immediate objection: stages 1 and 2 are where you learn *where* the weak notes sit. Finding do and counting do-mi-sol near them is useful even if the weak note itself is never asked. So weak focus now means something different per stage.

| Stage | What weak focus adds to the chosen range |
|---|---|
| 1–2 | The narrowest range holding every weak note, per clef (Easy, else Hard); its dos and ladders are asked |
| 3 and up | The weak notes themselves, even outside the chosen range; nothing else from that wider range |

With no clef on only the added part is left, so "weak focus alone" from the day before becomes one case of this rule. The sheet caption splits in two, and the 60 % caption drops "in range", since it now counts notes outside it. The count on stages 1–2 is every weak note that set the range. Rejected: keeping the stage raise (contradicts the request), adding every do of the widest range (far ledger-line dos unrelated to weak notes), and adding the covering range from stage 3 (non-weak notes would leak in). The cost: with focus on, the chosen range is no longer the outer edge of what can appear. Android got the same rule the same day.

## 2026-10-31 — Stage 1 reads a whole scale and asks one of its notes

Stage 1 is now *Read the scale*. It used to show each do in the range and wait for a tap, so nothing practised counting from do before the ladders of stage 2.

The first card now stacks one octave from do, eight notes, rising or falling at random.

![The first card: eight separated notes run from do to do, with their names in one row under the staff](/blog/notequiz-practice-modes/android-scale-first-card.png)

*Got it* turns it into a question. One of the eight is drawn in ink, the other seven turn faint where they stand, and the asked note's name is blank. The card appears whole and the question clock starts at zero.

![The asking card: the second of eight notes is solid, the rest are faint, and its blank name cell is underlined](/blog/notequiz-practice-modes/android-scale-asking-card.png)

With something to answer, stage 1 lost its exceptions: it now has a question count, clock, score, answer line and saved record.

- **Both end dos must be inside the chosen range.** Otherwise Easy would show a beginner a do five ledger lines down.
- **Names go in one row under the staff.** Eight names a step apart overlap in a column, and beside a stepped head they land on the previous head.
- **The staff fits the width too, measured on the stage's longest card,** so its size holds through a round. Stage 1's staff is smaller than the others'.

The Android port hit one trap. The stage's stored value changes with its name, and this app's JSON setup (`coerceInputValues`) turns an unknown value into the field's default with no error. That default is stage 5, so a plain rename would have silently moved stage 1 players to the hardest stage. A round-trip test passes either way. The old name stays readable through `@JsonNames`, and a test now decodes the literal old value.

The store screenshots and promo video still show the old stage 1 and need retaking.

## 2026-11-01 — The asking card keeps the whole octave

A day of use showed two problems. The notes sat too close, and the asking card cut the octave at the asked note, so the picture changed right after you had read it.

The asking card now keeps all eight notes in place, with only the asked one in ink.

- **A scale's notes stand 1.25 head widths apart.** The ladders keep their 0.92, which only exists for one stepped head. The cost is a smaller stage 1 staff.
- **The blank name gets an underline, always black.** The name row is red only for do, so a red underline would give the answer away.
- **The answer line went from 160 to 100,** just wider than the grading mark on `Sol`, the widest answer.

![The card asking the first do: only the first note is solid, and the other do's name stays visible](/blog/notequiz-practice-modes/android-scale-asked-do.png)

From stage 2 on, a do answer removes every hint, because drawing the do would give it away. Stage 1 now breaks that rule: the other do's name stays on screen, and seven named cells make the blank solvable by elimination. Stage 1 is about tying names to places, so we took that cost to keep every card the same picture.

The store screenshots still show the older stage 1.


## History

- 2026-09-21 — practice styles added (lines/spaces, chain of thirds, landmarks, two-note reading)
- 2026-09-21 — chain removed; two-note reading counts from the nearest do with dotted skip hints; landmarks show the do slot; dotted ledger lines
- 2026-09-21 — five styles split into show-how × which-notes; clef cards gated behind an include check
- 2026-10-15 — Android settings observe a shared snapshot; five stage examples loop on one clock
- 2026-10-15 — Android ladders share one axis; full-chain reveal geometry, pen grading, and home hierarchy match iOS
- 2026-10-29 — Android range sheet with switches and a pill, weak focus alone, stage examples from the range, tap-to-save and play again
- 2026-10-29 — save sheet with a Save record switch, an account row and Play again / Next stage / Done, the same mid-round; range groups and top notice; weak-note practice asks weak notes only; worded session replay
- 2026-10-30 — *Practice these notes* opens the range sheet as a draft (clefs off, weak focus on) scrolled to the bottom, instead of starting the quiz (iOS and Android)
- 2026-10-30 — weak-note practice from stage 3: notice on stages 1–2 and the stage rises on confirm; the auto-scroll follows the moving bottom (iOS and Android)
- 2026-10-30 — stage raise reversed: weak focus adds the covering range on stages 1–2 and the weak notes themselves from stage 3 (iOS and Android)
- 2026-10-31 — stage 1 becomes Read the scale: an in-range octave, then one note asked with the path kept; every stage is graded and saved (iOS and Android)
- 2026-11-01 — the asking card keeps the whole octave, a black underline on the blank name, wider scale spacing, a 100 answer line (iOS and Android)
