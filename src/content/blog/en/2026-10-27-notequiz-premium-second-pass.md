---
title: "New colors didn't make it feel premium — the second pass was about how many things each screen says"
date: 2026-10-27T02:15:37+09:00
app: "notequiz"
tags: ["devlog", "swiftui", "design"]
summary: "A day after the paper palette and the engraving font landed, the screenshots still read as a learning toy. The fix was counting elements, not colors: one-line quiz header, a filled navy CTA, outlined misses on the chart, whole seconds in the records list, medium weights, a serif splash. Six PRs, two of them reversing earlier decisions."
---

SuperMusicNote had just been restyled: navy accent, paper surfaces, the Leland engraving font for the staff. The next day's screenshots still looked like a learning app. This time the problem was not color. It was how many things each screen was saying at once.

## Six pieces of chrome above one question

Above a single note sat the correct/wrong counters, a type chip, `1 / 10`, a session clock, a second, larger serif stopwatch in the middle, and a progress bar. Two clocks, two icons, and no answer to "which number matters".

![Quiz screen before: two clocks and a large stopwatch stacked over the question](/blog/notequiz-premium-second-pass/quiz-before.png)

The header is now one line: type, number, and the **question timer** only. The session clock left the screen. It still accumulates into the saved record, but while you are reading a note the only number worth seeing is how long this note took. The height the stopwatch used to occupy went back to the staff.

![Quiz screen after: one header line, a larger staff](/blog/notequiz-premium-second-pass/quiz-after.png)

## The Start button looked disabled

The Start capsule was grey translucent glass with navy text. That grey had been chosen when the accent was still system blue and a solid blue button felt loud. On paper, with navy, it was one text color away from the disabled state, and the sheets' confirm buttons were already solid navy. The primary action had two faces.

Now it is navy glass with paper-colored text, and the rule is written down: the primary action has one face in the app, capsule or circle. Filling with ink was rejected because ink fill already means "selected" here.

## The stats tab was a warning board

Pick an often-missed note and the trend chart showed eight filled crimson X marks; with the map dots and chips, fifteen on one screen. Only the chart's marks changed, to an outlined circle with an X. They still differ in shape from the filled ink dots, so "never color alone" holds. The map and chip dots stayed: those are a note's grade, not one question's outcome, and the legend explains them.

Two smaller things on the same screen: the English header `PRACTICE THESE NEXT` wrapped to two lines, and the note header truncated `9 questions` to `9…`. The scope line moved under the header, and the question count now either fits or hides.

## `48.87s` in a list of sessions

Every row and every day header read like a stopwatch. A month earlier I had explicitly asked for hundredths everywhere in the records tab, so before reversing it I reread the reason: minutes had been dropping the seconds entirely, so twelve-minute sessions all looked the same. Whole seconds fix that too. The list now shows `49s` and `1m 57s`; the question timer, the session detail, and the per-question log keep hundredths. The day headers shrank below the rows (the system header size was louder than the score), and `1 sessions` became `1 session` through one line of grammar agreement, `^[%lld sessions](inflect: true)`.

![Records list: whole seconds, smaller day headers, "1 session"](/blog/notequiz-premium-second-pass/records-whole-seconds.png)

## Semibold was everywhere

Row titles, row values, sheet rows, settings rows, even `Do Re Mi` in the answer tray were all semibold, so nothing stood out. They went down to medium. Semibold now means "this is the answer" (score numerals) and "this is on" (a selected chip).

The splash title is Latin, so it can be serif where Korean text in the app cannot. The catch was the launch storyboard: Interface Builder cannot pick a serif design, and a sans title there would visibly swap fonts on the first app frame. The storyboard lost its title, and the title now fades in with the staves. Six staves became four, and the clefs went from grey to ink.

![Splash: serif title, four staves, ink clefs](/blog/notequiz-premium-second-pass/splash-serif.png)

## Why six PRs

One PR would have blocked all six changes on any single review question. Each change is its own revertible unit with its own decision record. Two of them reverse decisions I had made myself, so those records say in one line where to flip it back.

One thing stayed: the records list uses the system `List` corner radius of 26 while cards use 20, and iOS 26 has no public API to change it short of drawing row backgrounds by hand. It is noted, not fixed.
