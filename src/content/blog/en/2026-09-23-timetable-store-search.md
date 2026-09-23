---
title: "A timetable app that didn't show up for 'timetable'"
date: 2026-09-23
app: "timetable"
tags: ["devlog", "appstore"]
summary: "It wasn't a download problem. The Korean store name had no Korean word in it, and the fix was sitting in a version nobody had submitted."
---

SuperTimetable is listed in five storefronts. Search the Korean App Store for "시간표" (timetable) and it was nowhere in the top 200. Same in Japan, China, Taiwan and the US with their own words. The easy explanation is "not enough downloads yet". The top results said otherwise.

## An app with two ratings was in eighth place

Pulling the top 200 from `itunes.apple.com/search` and lining up rank against rating count showed the eighth result for "시간표" had two ratings. If an app with two ratings makes the first page, popularity is not what keeps us out. That app had the word in its name. Our Korean store name was just `SuperTimetable`.

App Store search indexes name, subtitle and keywords, and the name outweighs the rest by a wide margin. The brand contains `Timetable` as letters, but there is no guarantee Apple splits a concatenated word, and it shares no characters with a Korean query anyway. So the store name is now localized per storefront: `SuperTimetable - 시간표`, `- 時間割`, `- 课程表`, `- 課程表`. English took a different route: `Class Schedule` in the name where the search volume is, `timetable` in the subtitle and keywords.

The store name is a separate field from the home-screen label, which stays `Timetable` and does not get truncated under the icon.

## The keyword field is a budget

Keywords are 100 characters of comma-separated tokens. The old Korean field was `수업시간표,학교시간표,대학시간표,…`, paying for the three characters of "timetable" five times. Apple combines tokens to match multi-word queries, so `수업,시간표` already covers "class timetable" in either order. Compounds with a repeated head got split; the idiomatic ones people type as one word stayed.

What to put in the freed space came from the top eight names in each storefront. Four of Japan's top eight carry `大学生` (university student), and the query arrives glued as `時間割アプリ`. China repeats `早八` (8 a.m. class) and `极简` (minimal). School levels go in the form people type: the token `高校` does not match a query for `高校生`. Tokens that promise features the app lacks, like assignment or credit tracking, stayed out.

| Store | Before | After | Added |
|---|---|---|---|
| Korea | 87 | 98 | university student, student, calendar |
| Japan | 78 | 96 | high/middle/university/elementary student, lessons, "app" |
| China, Taiwan | 75 | 97 | university student, elementary, minimal, study, teacher, 8 a.m., planner |
| US | 99 | 99 | dropped `weekly`, which duplicated the subtitle, for `agenda` |

## The fix wasn't in the store

Rank did not move after the change. Reading App Store Connect back explained it: the live version's name was still `SuperTimetable`. The new values were only in the next version, in "Prepare for Submission". Name, subtitle and keywords are version-scoped fields. They reach the store only when a new build goes through review. Only promotional text, price, territories and URLs change without one.

The local metadata files match the version being edited, not the one being served. The first question in "why don't we show up" is not about keywords. It is whether the value you are looking at is live.

## A check you run by hand doesn't run

The validation is four lines: field lengths, the core term present in all three fields, no other token repeated across name or subtitle, no duplicate tokens. The first plan was to run it by hand and paste the result into the PR. That same PR merged with `weekly` in both the subtitle and the keywords. The check existed. It was not executed.

It now lives in the metadata script the upload lane runs every time. It caught two more things on the spot: the Chinese keyword `课程` is a substring of `课程表` in the name, so it was swapped for `手账` rather than paying twice on a guess about Apple's segmentation. And the English core term passes through a case-insensitive substring of the brand, since the name deliberately carries the synonym instead.

## What's left

The next submission ships the name and keywords together. After review, the same five queries get measured again. If we are still outside the top 200 then, that is when the popularity conversation starts.
