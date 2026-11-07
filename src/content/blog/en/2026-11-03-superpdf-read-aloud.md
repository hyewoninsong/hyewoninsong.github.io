---
title: "SuperPDF reads the book aloud and turns the page when it's done"
date: 2026-11-08T01:15:00+09:00
app: "superpdf"
tags: ["devlog", "swiftui"]
summary: "One button reads from the current page and keeps going, page after page. Why it uses on-device voices rather than a cloud TTS, why the text never comes from the document on screen, and four on-device neural voices added side by side for testing."
---

You can now look away from the page. Tap the speaker button in the lower toolbar and SuperPDF reads from the current page, turns the page when it finishes, and keeps reading.

Scanned books already have line-by-line text from the app's own OCR, so everything needed to read them aloud was already there.

## The line being read is marked on the page

While reading, pause, speed, and stop take the place of contents and bookmarks. The current line gets a faint blue band. It moves line by line, not word by word, because a band jumping on every word is harder to follow.

![Reading a scanned page — a faint blue band on the second line, pause, 2.0×, and stop in the toolbar](/blog/superpdf-read-aloud/reading-line.png)

| To | Do |
|---|---|
| Start | Speaker button, from the current page |
| Pause / resume | The play-pause button, also on the lock screen |
| Speed and voice | The `1.0×` menu: 0.75× to 2×, voices for the page's language |
| Jump | Turn to another page by hand; reading restarts there |
| Stop | The square button, or close the book |

Reading continues with the screen off. A phone call pauses it, and it does not resume on its own afterwards.

![Speed menu with six steps from 0.75× to 2.0×](/blog/superpdf-read-aloud/speed-menu.png)

## On-device voices, not a cloud TTS

Cloud voices sound better. We still started with `AVSpeechSynthesizer` (and added on-device neural voices the same evening, below):

- A book has hundreds of thousands of characters, and cloud TTS is billed per character.
- SuperPDF never sends the books you read off your device. A cloud voice would break that.
- Reading on the subway shouldn't stop when the signal drops.

Enhanced and Premium voices make a big difference. You download them in Settings › Accessibility › Spoken Content › Voices, and the voice menu shows that path. Personal Voice shows up once you allow it.

Each page is spoken as one utterance. Speaking line by line would break every sentence at each line break.

## The text never comes from the document on screen

PDFKit's Live Text attaches a per-character text layer to scanned pages on screen. We already got caught by this once, when quotes were saved as "D e l t a". Read aloud, that would come out one letter at a time. So the text comes from a second copy of the file opened just for reading. Scanned pages use only the app's own OCR lines, and a page that hasn't been recognized yet moves to the front of the queue.

Running heads and page numbers are skipped: short lines whose center is in the top or bottom 10% of the page, and number-only lines anywhere (it started as the full line inside a 7% band; see 2026-11-04 below). Words hyphenated across a line break are rejoined.

## The scanned book stayed silent at first

In the simulator, the text PDF read page 1 and moved to page 2. The scanned book stayed silent. OCR on its own read all 34 lines in two seconds. The log showed reading had never started: the button had been tapped before the book finished opening, and it did nothing. The button is now disabled until the book is open. A button that does nothing looks broken.

## What's left

The simulator only has one basic Korean voice. Enhanced and Premium voices, lock-screen controls, and pausing for phone calls still need checking on a device. Two-column layouts are read in the order recognition returns them.

## 2026-11-03 evening — four neural voices that run on the phone

System voices are free but flat. Cloud voices sound natural but cost money per character. Free neural models that run on the phone sit in between. Which one sounds best is something you have to hear, so instead of picking one, all four are in the app for side-by-side testing.

**Voice engines…** in the speed menu opens a sheet. Each model can be downloaded, removed, and selected, and you can hear the same sentence in Korean and English. (This single-screen sheet became a two-level one on November 5 — see "Three places to choose" below.) The sample also shows time to first sound and how long synthesis took per second of speech. Under 1 keeps up with reading.

![Voice engine sheet: system voice, Supertonic 2 and 3, each with download, remove, select, and Korean and English samples](/blog/superpdf-read-aloud/engine-sheet.png)

| Model | Download | Languages | Synthesis per 1 s of speech (Mac) |
|---|---|---|---|
| Supertonic 2 | 85 MB | Korean, English | 0.06 s |
| Supertonic 3 | 129 MB | 31 languages | 0.16 s |
| Kokoro | 350 MB | English | 0.54 s (0.31 s on 4 threads) |
| MeloTTS | 163 MB | English | 0.46 s |

If the chosen model can't read the page's language, that page uses the system voice, and the menu says why.

![After a sample: "first sound 1.7 s, 0.32 s per second of speech" under Kokoro](/blog/superpdf-read-aloud/engine-sample-timing.png)

All four run on one open-source runtime, **sherpa-onnx**, built from source for iOS. It has no official iOS binary, and a third-party prebuilt package broke often. Models are downloaded on first use rather than bundled (700 MB for all four). They ship only as `.tar.bz2`, which iOS can't open, so the app decompresses them with the system `libbz2` and streams the tar entries straight to disk. Speech is synthesized one sentence at a time, two sentences ahead. Neural models don't report word positions, so the line marker is estimated from elapsed time.

Two things didn't go as expected:

- **MeloTTS can't speak Korean on a phone.** The Korean model runs a 581 MB BERT on every sentence and needs a morphological analyzer for pronunciation. Nobody has exported it to ONNX. Only the English MeloTTS is included.
- **Kokoro's int8 model was slower than the full fp32 one.** It took 0.90 s per second of speech, against 0.54 s for fp32, barely keeping up with reading. The app downloads the bigger model and uses four threads.

None of this has been measured on an iPhone yet. The sample timings in the sheet are how to choose on a device.

## 2026-11-04 — Tables and formulas are skipped, and the voice says so

Tables were the first thing that sounded wrong. A table came out as its cells in reading order: "Year Revenue Note 2023 120 up 2024 150 up". Page numbers slipped through now and then, and formulas and URLs were read character by character.

Tables and formulas are no longer read. In their place the voice says "Table skipped." or "Formula skipped." and moves on to the next paragraph; while it says that, the blue band covers the whole table or formula block. Captions ("Table 1. Revenue by year") are outside the table and are still read. Skipping silently was an option, but a listener has to know something was left out to go and look at it. A **Read tables and formulas** toggle in the speed menu restores the old behavior.

### Line geometry couldn't tell a table from text

The first idea was geometry: several text boxes side by side at the same height make a table row. Two things broke it. In text PDFs, PDFKit merges the cells on one baseline into a single line, so there is only one box. And two-column books are also "boxes side by side".

So the page is rendered to an image and handed to iOS 26's document recognizer (`RecognizeDocumentsRequest`), which returns paragraphs, lists, and tables as structure, with rows and cells. A line whose center falls inside a table's bounding box is a cell. Text PDFs and scans go through the same single path. It costs about a second per page, so the next page is analyzed while the current one is being read, and nothing is cached.

A test page with a ruled 3×3 table between two paragraphs finds exactly one table in the simulator; the cells drop out of the script and the caption and body stay. How well it catches rule-less tables in Korean scans still has to be checked on real books. If it misses, the table is read as before; if it misfires, the toggle brings the text back.

### Formulas are classified by their characters

Vision doesn't report formulas, so the line's characters are counted. Two or more math symbols or sub/superscripts, and more symbols plus single-letter variables than words of two or more letters, means a formula. "Here E = mc² holds" stays text; "f(x) = ax² + bx + c" is a formula. Parentheses, hyphens, and slashes are too common in prose to count. Consecutive formula lines form one block with one notice.

URLs, email addresses, and DOIs are removed from a line and the rest is read. Superscript footnote digits are removed too. Lines with no letters or digits at all (rules, dotted leaders) are dropped silently.

### Why page numbers were still read

Page numbers were already being skipped, but only when the **whole line** sat inside the top or bottom 7% band. A number straddling the band's edge was treated as body text. The test now uses the line's center and a 10% band, and a number-only line is dropped wherever it is.

## 2026-11-04 afternoon — "8.8%" came out as "eight eight", and nothing in the chain was spelling numbers

Listening to a Korean book with Supertonic 3, "8.8%" came out as "pal pal" (eight eight) and "6~10%" as something like "six point ten". "52 weeks" on the same line was fine. It looked like a model problem until the text was followed all the way to the model.

- OCR was right: running the same page through Vision with the app's settings gave `8.8%` and `6~10%` with the period and tilde intact.
- The script assembly was right: it only touches whitespace and line-end hyphens.
- The engine's front end had no number rules at all. The app passes raw characters to sherpa-onnx, and its Supertonic preprocessing is quote and dash substitution, emoji removal, punctuation spacing, and Unicode decomposition. A digit is just a character, and the model reads `8` `.` `8` `%` however its training data happened to.
- The dev-build character voices (VITS) were worse: their Korean cleaner spells only "digits + Korean counter" and reads every other digit one at a time, with `.` and `~` as pause symbols. "8.8%" literally became "eight, eight".

Only Apple's system voice normalizes text on its own. None of the four on-device neural models know Korean decimals, ranges, or percents, so swapping models wouldn't help. The fix belongs right before the characters reach the model.

### Decimals, ranges, and percents are spelled out; plain integers are left alone

| Text | Spoken as |
|---|---|
| `8.8%` | pal jeom pal peosenteu (eight point eight percent) |
| `6~10%` | yuk-eseo sip peosenteu (six to ten percent) |
| `1,200.5` | cheon-ibaek jeom o |
| `52주`, `1년`, `한 번`, `2026.` | unchanged |

Only those three patterns are expanded, and only then is the integer part read as a Sino-Korean number. Spelling every integer was considered and rejected that day: the models already read "52주" correctly, and Korean counters like "한 번" (one time) use native numerals that a rule would get wrong more often than the model does (two days later, integers followed by a native counter were spelled after all — see the 2026-11-06 afternoon section). The step runs for Korean pages only and for all four neural engines. The system voice path was left alone at first; since 2026-11-05 it gets the same step (see below).

Ranges got one refinement the same afternoon. Korean has two number systems, and a range followed by a native counter (people, items, times, hours, animals, books…) reads with native numerals: "3~4명" becomes "서너 명" (three or four people), "1~2번" "한두 번", "10~20명" "열에서 스무 명". It applies from 1 to 99 and only for counters on a list. Patching sherpa-onnx itself would have meant carrying a C++ fork and still fixing Kokoro and the VITS voices separately.

### Three counters were left off the list on purpose

Some counters take both number systems depending on what they mean, and the character alone doesn't say which:

| Counter | Native reading | Sino reading | Common in books |
|---|---|---|---|
| 장 | sheets of paper | chapters (3장 4절) | chapters — "covered in chapters 3~4" |
| 대 | vehicles, machines | age decades, eras (20~30대, 1990년대) | decades — `20~30대` is itself a range |
| 분 | people (honorific) | minutes (3~4분) | minutes |

Putting them on the list turns "3~4장" into "three or four" in native numerals, which is simply wrong when it means chapters. Leaving them off makes "3~4장" (sheets) come out Sino-Korean, which sounds stiff but is still understood. The two mistakes are not symmetric, so the rule leans toward the common meaning. Telling them apart properly needs context (is the subject a person, does "takes" follow), which is a job for a morphological analyzer or a model, not a rule.

"개월" (months) and "시대" (eras) are a different case: the list check asks whether the next characters start with `개` or `시`, so "3~4개월" would match `개` and read natively. A short exception list sends those Sino-Korean counters back to Sino numerals while keeping `개` and `시` themselves.

Next time something sounds off, the order is set: log the exact text entering the engine, then open the engine's preprocessing source. "It surely normalizes" was an assumption, and Supertonic didn't. Listening to that page again on a real phone is still to do.

## 2026-11-05 — training our own anime-style Korean voice, and a path to run it on the phone

The ask was a cute, anime-style girl's voice reading Korean books. No such model is public, so we are training one as a development-only voice and running it on device.

### No public Korean weights

Character voice models cluster around Bert-VITS2 and Style-Bert-VITS2, which have no Korean front end. Nexon Games published a Korean Style-Bert-VITS2, but as code only: you would train a base model from thousands of hours yourself. We used a community port (SBV2-KR) that starts from the Japanese base and initializes Korean phoneme embeddings from similar Japanese ones, so character voices can be fine-tuned directly. GPT-SoVITS lost because nothing ports its two-stage model to phones. Blue Archive lost because its students only speak Japanese.

We picked 33 characters with Korean dubs from Genshin Impact and Honkai: Star Rail, using an eight-minute preview reel to choose, and dropped battle shouts.

### Free Colab

A three-voice test ran 4,000 steps in 1 h 40 min on a free T4 (0.45 steps/s) and sounded right. The full set is 24,560 lines, 37.4 hours, about 18 hours of training across several sessions with checkpoints parked in Drive. Along the way: the default Colab image moved to Python 3.13, the latest transformers silently requires torch 2.6 (pinned 5.18), and deleted checkpoints filled Drive's trash until uploads quietly stopped.

### Running it on the phone

sherpa-onnx, which runs our other neural voices, doesn't know this architecture, so the app calls onnxruntime's C API directly. Two ONNX files: the synthesizer (251 MB, identical to PyTorch) and a Korean BERT cut to the 22 layers actually used (621 MB fp16). int8 BERT scored 0.99 similarity but read the same sentence 9% longer, which only showed when we measured audio length, not feature similarity.

The Korean pronunciation front end and the tokenizer were ported to Swift and match Python on 1,518 sentences plus 3,000 adversarial strings. Two traps: blanks must be interleaved into the language ids too (missing that made audio 4,608 samples short, found only by diffing whole input tensors), and the morphological analyzer changes 42% of phoneme sequences, so it has to come to the phone as well.

The data is non-commercial, and the voices belong to the studio and the actors, so the app never ships or hosts it: it shows in development builds, and in public builds only when a repository you added has the bundle (see the 2026-11-05 afternoon section). Training is still running; device speed and memory come next.

## 2026-11-05 afternoon — models come from your own GitHub repo, and the token field appears only when needed

Converted voice bundles used to download from one hardcoded private repository, with a lone token field in the sheet. That is now a proper feature: a **Model repository** field at the bottom of the voice engine sheet takes any GitHub address and pulls models from its releases.

### No token field until the repo refuses

0.6 seconds after you stop typing, the app opens the repository without a token.

| Response | What you see |
|---|---|
| Opens (public repo) | "Public repository · N models" and an **Add** button. No token field, ever |
| 404 or 401 (private, or doesn't exist) | Only now the token field and **Check with token** appear |
| 401 with a token | "The token is wrong or expired" — the field stays |
| 403/404 with a token | "This token can't open the repository" |
| Opens, but no known bundles | "No models this app can read" |

GitHub answers a private repo with 404 to anyone without access, exactly like a missing one. So the first 404 asks for a token instead of declaring the repo gone; the same 404 *with* a token means no permission. Reading one status code differently depending on whether a token was sent is the whole trick.

Full URLs, `owner/repo`, `.git` suffixes, and release-tag links all work. Tokens are stored in the device keychain, and only for private repos.

### Why this shape

- **No manifest format for arbitrary models.** Each engine needs its text-to-phoneme front end, which lives in app code; a description file can't make sound. Only files matching bundle names the app already knows count as models.
- **No always-visible token field.** People adding a public repo don't need it.
- **No character voices listed by default in public builds.** Until a repository is added, the public build shows only a plain repository field; the list then shows what the repository is confirmed to offer, plus anything already downloaded.

Devices that only had the old token are migrated to the original repository automatically.

The flow was tested against real GitHub in the simulator: public repo → no token field; private → token field; wrong token → error; right token → "Private · 7 models" → add → remove. Downloading the large bundles on a real device is still untested; that path is unchanged.

## 2026-11-05 evening — the minus and decimal point in "-7.26%" vanished; the sentence splitter did it

With the Genshin/Star Rail voice we trained, "-7.26%" on a fund performance page was read with neither the minus nor the decimal point, and "표 4-1" (Table 4-1) came out as "표사일". In Korean these should be "마이너스 칠 점 이육 퍼센트" and "표 사 다시 일".

The first guess was wrong. That voice's normalizer handles "7.26" fine, so the system voice looked like the only path that could drop the point, and it got fixed first. Nobody asked which voice it was.

The real cause sat in front of the normalizer. The engine splits long text into sentences and was cutting after every period, so "-7." and "26%, …" were normalized separately: the point became a silent sentence end and "26" a whole number. It no longer splits on a period between digits. Separately, the normalizer kept `-` as punctuation, a pause rather than "minus", and our rule for the other neural voices didn't know minus signs or numbering dashes either.

What changed:

| Text | Now read as | When |
|---|---|---|
| `-7.26%` | 마이너스 칠 점 이육 퍼센트 | right before a digit, not after a letter or digit |
| `표 4-1`, `그림 2-3-10` | 사 다시 일, 이 다시 삼 다시 십 | each part 1–3 digits, no leading zero |
| `6-10%` | 육에서 십 퍼센트 | two parts followed by % read as a range |
| `010-1234-5678`, `2022-05-31` | unchanged | phone numbers and dates |

The rule runs for the other neural voices and now for the **system voice** too, so the same text reads the same way everywhere. Spelling numbers out shifts every character position after them, and the system voice reports positions so the app can mark the line being read. So the rewrite also builds a table from each new position back to the original one, and the reported positions go through it. The trained voice gets only the minus and dash rules; the rest stays with the normalizer it was trained with.

Unit tests cover each row above, the decimal-aware sentence split, and the position table. The page hasn't been re-listened to on a real iPhone yet.

## 2026-11-05 night — the morphological analyzer now runs on the phone, and one tag letter differed

The trained voice learned from pronunciations produced with the kiwi morphological analyzer on, so "책의" became [채게] and "볼게요" became [볼께요]. The phone was building pronunciations without kiwi, and 42% of the 1,518 reference sentences got different phonemes from training. Kiwi now runs on the phone and all 1,518 match.

- **Built from source, not the official Swift package.** The official xcframework wraps a static library in a `.framework` shell. That shape got this app rejected once with ITMS-90208, so kiwi is packaged as a plain `.a` plus headers.
- **Pinned to 0.23.2**, the same version the training used. 0.24 analyzes some endings differently.
- **The 109MB analyzer model ships inside the voice bundle**, not the app. The bundle went from 791MB to 877MB.

Verification compared 31,796 tokens from the 1,518 sentences against Python kiwipiepy, by form, tag, position and length, and then the resulting pronunciations. The pronunciations matched from the start. Two tokens did not:

```
아직 항복하긴 일러     C API: 이르/VV    kiwipiepy: 이르/VV-R
```

Kiwi marks regular verbs that look irregular with `-R`. The C API does it only when the stem ends in ㄷ, ㅂ or ㅅ. The Python binding also does it when the form is exactly "이르", which conjugates two ways. Reading only the C API docs, you would expect identical strings. The pronunciation rules compare tags as text, so other sentences could diverge. The Swift wrapper now applies the same special case. Comparing only the final phonemes would have missed this.

Kiwi loads in 1.7 s on the simulator and analyzes all 1,518 sentences in 2.2 s. The engine's output length matches the Python reference with kiwi on. The 10,000-step bundle was rebuilt with kiwi. A real-iPhone speed and memory test is ready but hasn't run yet because the phone was off the wireless connection. Training is paused at 10,000 steps on the free GPU quota.

## 2026-11-05 — Three places to choose a voice became one, shaped like Settings › Voices

As the engines grew from four to thirteen and the model repository arrived, the places to choose grew with them. The speed menu held an engine picker, a voice picker for that model, and a voice picker for the system voice. The "Voice engines" sheet had, per model, download, trash, a select radio, a voice menu, per-language sample buttons, and timing, followed by the repository form and a license list. The system row showed selection with a checkmark, the model rows with a filled circle. The same voice picker lived in both the menu and the sheet; the system voice picker lived only in the menu.

iOS Settings › Accessibility › Spoken Content › Voices already solves this: a list of languages, inside it a list of voices, tap a row to choose, a play button to preview. The sheet now follows that shape.

![First screen: the system voice row with its chosen voice and a checkmark, then four models with download buttons](/blog/superpdf-read-aloud/voice-sheet-engines.png)

The first screen lists engines: the system voice, the models, the development-only models, and the model repository at the bottom. Each row's subtitle is the chosen voice and the languages it reads; only the chosen engine gets a checkmark. A model that is not downloaded cannot be entered; its subtitle is "languages · size" and its trailing control is Download.

![System voice screen: each Korean voice with a checkmark and a play button](/blog/superpdf-read-aloud/voice-sheet-system-voices.png)

The second screen is that engine's voice list. Tap a row to choose, press play to hear it. System voices and model voices use the same row. A model's screen adds the sample language above (only when the model reads more than one), and languages, size, license, and Remove below. Timing is still measured, as the list footer.

The rule is now: **you choose a voice; the engine follows.** So the three pickers left the speed menu. What remains is speed, the table/formula toggle, and one "Voice" row whose subtitle is the current voice ("Supertonic 2 · Female 1", "Yuna"); tapping it opens the sheet. (Three days later this two-level sheet split into separate "Model" and "Voice" sheets — see 2026-11-08 below. The rule itself stayed.)

Alternatives that lost: choosing everything in the menu (the menu cannot host download, preview, or remove, so the sheet was needed anyway, and the pickers were duplicated); one screen with the engines plus the chosen engine's voices (Kokoro has 28, the Chinese model 804 — they push the engine rows off the screen); tapping an engine row to select with an info button for the inside (breaks the Settings shape, and the chosen voice is not visible on the first screen — the subtitle gives that).

### A subtitle on a menu item lost its test identifier

Giving the "Voice" row a title and a subtitle (`Text` + `Text` + `Image`) made the UI test unable to find it by identifier; the hierarchy showed only `Button, label: 'Voice, Yuna'`. SwiftUI drops the accessibility identifier when it unpacks that label into a `UIAction` title, subtitle, and image, while a plain `Toggle` in the same menu keeps its identifier. The subtitle is the point of the row, so the test now matches the label prefix.

## 2026-11-06 — charts are skipped too, English words are spelled in Hangul, and year ranges read as ranges

With tables out of the way, the next thing the voice read was a chart: the famous log-scale plot of real returns on stocks, bonds, gold, and the dollar from 1802 to 2012. It read every tick, legend entry, and year. The same report carried two more: the trained Genshin/Star Rail voice read English letter by letter ("ay pee pee ell ee"), and years sounded like digit strings.

### Figures are found by the shape of their lines

Vision's document recognizer returns tables; nobody returns figures. A chart arrives from OCR as short lines scattered over the page, so that scatter became the signal. A fragment is a line narrower than 30% of the page or made mostly of numbers. Vertically close fragments form a block; a wide prose line between them breaks it. A block is a figure only when it has six or more fragments, left edges in at least three places (lists and dialogue share one), and at least two pairs sitting side by side at the same height (a centered poem has none). The union rectangle is the figure; every line whose center falls inside is skipped, including a small table inside the chart. The title above and the source line below stay outside and are read like captions. The notice is "Figure skipped." and the toggle is now "Read tables, figures, and formulas".

Ink-density line detection and image XObjects in text-layer PDFs were considered: letters are lines too, vector charts are not images, and a scanned page is one big image.

The test page exposed a side effect of the November 4 page-number rule: the year row "1802 1822 … 2002" is all digits once spaces are removed, so it was being dropped as a page number and could not join the figure. Page numbers are now at most four digits.

### English goes through a pronouncing dictionary into Hangul

The trained voice knows 46 Korean jamo and nothing else; its normalizer spells Latin letters by name and discards the rest. So English words are transliterated before the normalizer: pronunciations come from the CMU dictionary (125k entries, 0.86 MB compressed), and the ARPAbet is packed into syllables by the Korean loanword orthography rules — a voiceless stop after a short vowel becomes a final consonant (stock → 스톡), long vowels and voiced consonants get an ㅡ syllable (gold → 골드), intervocalic l doubles (dollar → 달러), r before a consonant is silent (market → 마켓), and the weak vowel is guessed from spelling (apple → 애플, button → 버튼, Tesla → 테슬라). Out-of-dictionary words are estimated from spelling with a as ㅏ, since those are mostly Korean names (kakao, samsung). Upper-case acronyms (ETF, GDP) are left for the letter-name path, and an English gloss in parentheses right after Hangul is dropped so the word is not read twice.

Splicing English spans from the system voice would defeat the character voice; ICU's Latin-Hangul transform is romanization, not English pronunciation; adding English phonemes to the model needs data and days. Some results differ from convention (bitcoin comes out as 빗코인 by the rules); an exception table can grow from what stands out.

### "2000년" was fine; "2000~2010년" was not

A lone year read correctly as 이천년. The failure was ranges: the voice's own normalizer turns `~` and every dash into `-`, then its phone-number rule reads "2000-2010" digit by digit. The November 5 decision to let that normalizer handle numbers and only fill its gaps was right, but it did not trace what the normalizer does to characters the app left alone. Tilde ranges are now spelled out in the app first ("이천에서 이천십년"), and a dash between two four-digit years is read as a range for every voice; a descending pair ("1588-1234") stays a number.

Listening on a real device is still pending, as before.

## 2026-11-06 afternoon — "1배" came out as "il-bae", and the counter list already existed in TTS open source

Investment books say "1배, 2배, 10배" (one times, two times, ten times) constantly, and the voice read them with Sino-Korean numerals (일배, 이배, 십배) instead of native ones (한 배, 두 배, 열 배). The report came with a question: is there a compiled list of these, rather than finding them one at a time?

### One cause for all three engines

On November 4 the rule was "leave plain integers alone". The range fix that afternoon ("3~4명" → "서너 명") built a list of 46 native counters, but applied it only to ranges. "1배" went to the engines untouched. The trained Genshin/Star Rail voice uses a port of g2pK's normalizer, whose native-counter list has 32 entries — 개, 번, 살, 시, 마리, 권… and no 배, 명, 시간, 가지, 곳. That is why "한 번" and "두 개" sounded right while "한 배" and "세 명" did not: the edge of the list was the edge of the symptom. The system voice and Supertonic have no number rules at all, so they agreed.

### The list lives in TTS projects, not at the language institute

The National Institute of Korean Language publishes no such list; the dictionary only gives examples per counter. Korean TTS authors solved it already:

| Source | What it has |
|---|---|
| g2pK `numerals.py` | 32 native counters; 1–4 as 한·두·세·네, 20 as 스무, Sino-Korean from 100 up |
| CoreaSpeech N2gk | 33 native counters (배, 명, 번째, 시간, 가지, 곳, 살, 달, 건…) **and** about 60 Sino-Korean ones (분, 초, 년, 개월, 원, 회, 층, 대, 세기, 퍼센트…); native only up to 99 |

Now an integer from 1 to 99 followed by a native counter is spelled with the native determiner: "1배" → "한 배", "3명이" → "세 명이", "20번" → "스무 번", "21살" → "스물한 살", "12시 30분" → "열두 시 30분". The counter list is the union of the app's, N2gk's and g2pK's, and the step runs for the trained voice too — "let its own normalizer read numbers" only ever held for counters that normalizer knew.

### Counters the sources disagree on were left out

Merging exposed the conflicts. 장 is native (sheets) in N2gk but usually means chapters in a book; 대 is native in g2pK and Sino-Korean in N2gk; 분 is people or minutes; 축 is "axis" in engineering texts. Those stay Sino-Korean, by the November 4 asymmetry: a stiff "삼배" is less wrong than a native "세 장" for chapter three. One rule no open-source list has: numbering positions. "제3번" (prefix 제), "3판" (edition), "3번 문제" / "3번 출구" (problem 3, exit 3) all stay Sino-Korean, and Sino-Korean units that begin with a native counter's character (달러, 배럴, 배속, 배수, 방향) went on the exception list.

Listening on a device is still a TestFlight job; only the text handed to the engines changed, so the tests are the result.

## 2026-11-07 — The 33 voices sounded alike because they all got the same "average timbre"

At 14,000 training steps the Genshin/Star Rail voices sounded too similar to each other, though the original dubs are easy to tell apart.

Style-Bert-VITS2 feeds every sentence a style vector — a speaker embedding (wespeaker) that carries much of the timbre. Training uses each line's own vector, but preprocessing leaves a single row: the mean over all 33 speakers. That one row travelled all the way to the phone, so every speaker id got the same "average" hint. It is a harmless default for a single-speaker model, which is why nobody looked again.

No retraining: we took 300 kept lines per speaker, embedded them with the same model, and averaged. The bundle keeps the old mean as row 0, adds 33 speaker rows, and maps speaker → row; older app builds still read row 0. On the Mac, the GPU path (MPS) was 6× slower than CPU (0.23 s vs 0.04 s per line) and looked hung.

| | Before | After |
|---|---|---|
| Similarity between speakers (mean cosine) | 0.435 | 0.422 |
| Similarity to the speaker's real voice | 0.782 | 0.796 |
| Speakers closest to their own real voice | 4 / 6 | 6 / 6 |

Right direction, small effect. Most of the remaining likeness is training: 14k of 30k steps, and multi-speaker models learn the average voice first. The fix carries over to every later checkpoint.

## 2026-11-08 — Changing to another voice of the same model took four taps; models and voices now have separate sheets

The two-level sheet from three days ago was tidy, but one path stayed annoying. Comparing voices in a 33-voice model, switching to another one meant menu → Voice → **the model row** → voice: four taps, and the third one re-selects a model that is already selected. The two-level design had listed exactly this cost under "what we lose"; for someone who swaps voices often, it is paid every time.

The menu now has two rows, **Model** and **Voice**, each with its current value as the subtitle.

![Model sheet — system voice checked, four models with download buttons below](/blog/superpdf-read-aloud/model-sheet.png)

The **Model** sheet chooses, downloads, and removes models. Tapping a row switches to that model, with the voice you last chose in it. Installed rows get an ⓘ for languages, size, license, and Remove; rows not yet downloaded keep the Download button and progress bar.

![Voice sheet — a "Model" picker on top, then the chosen model's voices with checkmark and play](/blog/superpdf-read-aloud/voice-sheet-direct.png)

The **Voice** sheet opens straight on the chosen model's voices: tap to choose, play to preview. Three taps now. A "Model" menu picker at the top lists only installed models — a shortcut for hopping between models while comparing, without closing the sheet.

Alternatives that lost: no picker in the voice sheet (clean, but comparing becomes menu → Model → pick → menu → Voice, five taps; installed models are few enough for one picker row, and download/remove/repositories still need the model sheet); one sheet with model rows and voices below (rejected three days ago — the 804-voice model pushes the model rows away); a voice picker directly in the menu (same 804 rows).

### Several repositories, and a `?` that explains the format

The model repository used to be a single slot. Now the model sheet lists every saved repository ("N models"), swipe to delete, an "Add repository" row to add more; each repository keeps its own token in the keychain. Downloads ask the repository known to offer the bundle first, then the others in order.

![Repository format help — where to upload, file name, what goes inside the bundle](/blog/superpdf-read-aloud/source-format-help.png)

What to upload, and under which name, had lived only in the code. A `?` in the section header now explains it: GitHub releases, the address forms, token only for private repositories, the file name `<bundle>.tar.bz2` matched character for character, the top-level folder inside the archive, and **the list of bundles the app can read** — generated from the app's model catalog (name, archive name, languages, required files), so a new model extends the help by itself. The footer says why anything else cannot work: the text-to-phoneme front end for each bundle lives in the app.

### "Done" on an inner page did not close the sheet

A UI test caught this. Tapping Done on the help page popped the help page and left the model sheet open, so the next tap landed on the sheet.

`@Environment(\.dismiss)` ends the **nearest** presentation. Inside a sheet's `NavigationStack`, a pushed page's `dismiss` is a pop, not a sheet dismissal. The shared Done modifier attached to every page therefore closed the sheet only from the root. The two-level sheet from three days ago had the same modifier on its inner pages; its test only pressed Done on the root. The sheet root now passes its own `dismiss` down as an environment value, and the shared Done calls that when present. Buttons that should go back one page (after Remove) keep their own `dismiss`. The test now asserts that the control behind the sheet is visible again after Done on an inner page.

### What's left

After choosing a model in the model sheet, seeing its voices means closing it and opening Voice; the model info page says so. On a device with stub bundles, the checkmark moves only after a few seconds (the time it takes the model load to fail); real bundles should switch immediately. Not yet verified on a device.

## History

- 2026-11-03 — read aloud with system voices, automatic page turns, scanned pages from OCR
- 2026-11-03 evening — four neural voices for testing, with samples and synthesis speed
- 2026-11-04 — tables and formulas skipped with a spoken notice, page numbers dropped anywhere, URLs and footnote digits stripped, toggle to read them
- 2026-11-04 afternoon — Korean decimals, ranges, and percents spelled out before neural synthesis
- 2026-11-05 — training an anime-style Korean voice (SBV2-KR on free Colab) and an on-device path via onnxruntime and a Swift port of the Korean front end (development only)
- 2026-11-05 afternoon — model repository: enter a GitHub address, checked without a token first, token asked only for private repos
- 2026-11-05 evening — trained voice no longer splits sentences at decimal points; minus signs and numbering dashes spelled out; number spelling also for the system voice
- 2026-11-05 night — kiwi morphological analyzer on iOS so pronunciations match training; matched a tag difference between the C API and the Python binding
- 2026-11-05 late — voice choice became a two-level sheet (engines → voices), the menu keeps one "Voice" row, you choose a voice and the engine follows
- 2026-11-06 — charts skipped by line geometry, English words in the trained voice transliterated via the CMU dictionary and loanword rules, year ranges no longer read as phone numbers
- 2026-11-06 afternoon — "1배" read with Sino-Korean numerals: integers 1–99 before a native counter now spelled natively, counter list merged from N2gk and g2pK, numbering positions kept Sino-Korean
- 2026-11-07 — per-speaker style vectors instead of one shared mean; small measured gain, remaining likeness is undertraining
- 2026-11-08 — separate Model and Voice sheets (two menu rows, the voice sheet opens on the chosen model), multiple model repositories with a `?` format guide, inner-page Done now closes the sheet
