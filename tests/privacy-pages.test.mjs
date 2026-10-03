// Verifies the privacy / support pages under src/pages/{ko,en}/ against the
// rules the stores rely on but `astro build` does not check:
//
//   - a policy or support page exists in both languages (the store listing of
//     each locale points at its own URL)
//   - every app policy the shared privacy page links to is a real page
//   - every Android policy is linked from the shared privacy page of its
//     language (docs/decisions/2026-10-02-planner-android-privacy.md)
//   - an Android policy does not carry the iOS policy's IDFA / ATT / privacy
//     manifest wording (docs/references/privacy-policy-host-and-platform-pitfall.md)
//   - a policy states its effective date, and ko/en state the same one
//
// Run with: node --test "tests/**/*.test.mjs"

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['ko', 'en'];
const pagesDir = (locale) => join(root, 'src', 'pages', locale);

/** privacy.astro / support.astro files of a locale, relative to its pages folder. */
function storePages(locale) {
  return readdirSync(pagesDir(locale), { recursive: true })
    .map((file) => file.split('\\').join('/'))
    .filter((file) => /(^|\/)(privacy|support)\.astro$/.test(file))
    .sort();
}

const policyPages = (locale) => storePages(locale).filter((file) => file.endsWith('privacy.astro'));
const androidPolicies = (locale) => policyPages(locale).filter((file) => file.includes('/android/'));
const readPage = (locale, file) => readFileSync(join(pagesDir(locale), file), 'utf8');

/** `/ko/apps/planner/android/privacy/` → the page file that serves it, if any. */
function pageFor(href) {
  const route = href.replace(/^\/|\/$/g, '');
  return [`${route}.astro`, `${route}/index.astro`].find((file) =>
    existsSync(join(root, 'src', 'pages', file)),
  );
}

const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** The effective date a policy states, as YYYY-M-D. */
function effectiveDate(locale, source) {
  if (locale === 'ko') {
    const match = source.match(/시행일:\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    return match ? `${match[1]}-${Number(match[2])}-${Number(match[3])}` : undefined;
  }
  const match = source.match(/Effective date:\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/i);
  if (!match) return undefined;
  const month = months.indexOf(match[1].toLowerCase()) + 1;
  return month ? `${match[3]}-${month}-${Number(match[2])}` : undefined;
}

test('privacy and support pages exist in both languages', () => {
  assert.ok(storePages('ko').length > 0, 'no privacy/support pages under src/pages/ko/');
  assert.deepEqual(storePages('ko'), storePages('en'));
});

test('every app policy the shared privacy page links to exists', () => {
  const dead = [];
  for (const locale of locales) {
    const hrefs = [...readPage(locale, 'privacy.astro').matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      if (!pageFor(href)) dead.push(`${locale}/privacy.astro: ${href}`);
    }
  }
  assert.deepEqual(dead, []);
});

test('every Android policy is linked from the shared privacy page of its language', () => {
  const unlinked = [];
  for (const locale of locales) {
    assert.ok(androidPolicies(locale).length > 0, `no Android policies under src/pages/${locale}/apps/`);
    const index = readPage(locale, 'privacy.astro');
    for (const file of androidPolicies(locale)) {
      const href = `/${locale}/${file.replace(/\.astro$/, '')}/`;
      if (!index.includes(`href="${href}"`)) unlinked.push(href);
    }
  }
  assert.deepEqual(unlinked, []);
});

test('an Android policy carries no iOS-only wording', () => {
  const copied = [];
  for (const locale of locales) {
    for (const file of androidPolicies(locale)) {
      const found = readPage(locale, file).match(/IDFA|App Tracking Transparency|\bATT\b|xcprivacy|App Store/g);
      if (found) copied.push(`${locale}/${file}: ${[...new Set(found)].join(', ')}`);
    }
  }
  assert.deepEqual(copied, []);
});

test('a policy states its effective date, the same one in both languages', () => {
  const problems = [];
  for (const file of policyPages('ko')) {
    const ko = effectiveDate('ko', readPage('ko', file));
    const en = existsSync(join(pagesDir('en'), file)) ? effectiveDate('en', readPage('en', file)) : undefined;
    if (!ko || !en || ko !== en) problems.push(`${file}: ko=${ko} en=${en}`);
  }
  assert.deepEqual(problems, []);
});

// ko/apps/musicnote/android/privacy.astro is written in 해체 ("사용해", "않아") while the
// other four Korean policies use 합니다체. Drop the `todo` once that page is rewritten.
test('a Korean policy is written in 합니다체', { todo: 'musicnote Android policy is in 해체' }, () => {
  const casual = [];
  for (const file of policyPages('ko')) {
    const text = readPage('ko', file).replace(/<[^>]+>/g, ' ');
    const endings = text.match(/[가-힣](?:해|아|어|야|돼|게)\.(?=\s|$)/g) ?? [];
    if (endings.length > 0 || !text.includes('니다.')) casual.push(`${file}: ${endings.length} 해체 endings`);
  }
  assert.deepEqual(casual, []);
});
