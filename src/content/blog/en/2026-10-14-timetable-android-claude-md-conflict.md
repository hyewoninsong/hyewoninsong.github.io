---
title: "Two of every three commits edited the same line — ending the CLAUDE.md merge conflicts"
date: 2026-10-14T10:00:00+09:00
app: "timetable"
tags: ["devlog", "android"]
summary: "Every pull request in the Android timetable repository conflicted in CLAUDE.md, because each lesson learned was appended to one 6,433-character line. Now a PR only adds a file, and the list is generated on main."
---

In the SuperTimetable Android repository, learning a pitfall no longer means editing `CLAUDE.md`. A PR adds one pitfall document and the list builds itself on main. Before that, the file conflicted on nearly every pull request and was resolved by hand each time.

## The conflict lived on one line

`CLAUDE.md` is the project brief an agent reads at the start of a session. It carried a list of pitfalls the project had already hit, so the next session could skim them first. The list was useful, so it kept growing — as a single line. Each new entry was appended to its end.

| Measured | Value |
|---|---|
| Commits on main this month | 48 |
| Of those, commits that edited `CLAUDE.md` | 31 |
| Length of that one line | 6,433 characters |
| Pitfall documents in the repository | 51 |
| Entries actually on the line | 38 |

Git merges by line. Two branches that each append something to the end of the same line conflict, however unrelated the content. With several sessions working in parallel, that was every day. And the hand-kept list had quietly lost 13 entries along the way.

## A PR adds a fragment; main builds the list

The iOS repository hit the same problem a month earlier in its decision log, and the rule it settled on carried over unchanged.

- A PR adds **new files only** — one pitfall document, or one decision record. Different branches create different file names, so there is nothing to collide on.
- The list is a **generated file**. When such a file reaches main, a GitHub Action runs a script and commits the updated index as a bot. Nobody edits the index on a branch.
- `CLAUDE.md` keeps a single import of the index, so a session still starts with the whole list in context.

A new index line is the document's first heading. Lines already in the index are never rewritten: the 38 existing entries were short hand-written summaries, better to skim than the headings. So the old line was moved into the index first and the script was run second. In the other order, all 38 summaries would have been replaced.

## What lost

- **`merge=union`** in `.gitattributes` keeps both sides of a conflicting hunk. It works for a local merge. GitHub's pull request merge ignores the attribute.
- **One entry per line.** Two PRs that each add a line after the same last line still conflict.
- **A check that fails when the index is stale.** Then every PR has to commit the index, and the conflict simply moves to that file.
- **Dropping the list and leaving a pointer.** No conflicts, but sessions stop seeing the summaries unless they go and look.

## Where the rollout snagged

The first push was rejected. Without the `workflow` scope on the command-line token, GitHub refuses a push that contains a workflow file — the whole branch, not just that file. The rest went up first and the workflow followed separately.

Between the two, other PRs landed and the index was already ten lines behind. The workflow lists its own file as a trigger, so it ran once on merge and filled them in.

## Where it stands

The bot owns both indexes, and `CLAUDE.md` changes only when a rule every session must follow changes. The long notes on its project-structure lines were left as they are; they just stop growing, so conflicts there shrink rather than vanish. The setup procedure for new Android projects now starts with this structure in place.
