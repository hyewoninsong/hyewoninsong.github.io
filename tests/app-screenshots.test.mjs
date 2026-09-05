// Verifies that every screenshot referenced by a static app detail page
// (src/pages/{en,ko}/apps/<slug>.astro via the `img('<name>')` helper)
// exists in public/apps/<slug>/<locale>/, and that the en and ko pages
// reference the same set of screenshot names.
//
// Run with: npm test   (node --test "tests/**/*.test.mjs")

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['en', 'ko'];

function pagePath(locale, slug) {
  return join(root, 'src', 'pages', locale, 'apps', `${slug}.astro`);
}

/** Static app pages that exist in the given locale (excluding [slug].astro). */
function staticAppSlugs(locale) {
  return readdirSync(join(root, 'src', 'pages', locale, 'apps'))
    .filter((f) => f.endsWith('.astro') && !f.startsWith('['))
    .map((f) => f.replace(/\.astro$/, ''))
    .sort();
}

/** Screenshot base names referenced through the img('<name>') helper. */
function referencedScreenshots(locale, slug) {
  const source = readFileSync(pagePath(locale, slug), 'utf8');
  const names = new Set();
  for (const m of source.matchAll(/\bimg\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    names.add(m[1]);
  }
  return [...names].sort();
}

/** The locale folder the img helper resolves to, e.g. /apps/timetable/en. */
function imgHelperBase(locale, slug) {
  const source = readFileSync(pagePath(locale, slug), 'utf8');
  const m = source.match(/const img = \([^)]*\) => `([^`]*)\$\{name\}\.png`/);
  return m ? m[1] : null;
}

test('en and ko expose the same set of static app pages', () => {
  assert.deepEqual(staticAppSlugs('en'), staticAppSlugs('ko'));
});

test('timetable page references the expected 19 localized screenshots', () => {
  const expected = [
    'batch-edit', 'batch-edit-after', 'color-variant', 'dark-mode', 'day-range',
    'drag-create', 'duplicate-timetable', 'hero', 'image-share', 'lock-toggle',
    'move-drag', 'print', 'quick-edit', 'resize-drag', 'timetable-list',
    'title-suggestions', 'undo-redo', 'widget-dark', 'widget-light',
  ].sort();
  for (const locale of locales) {
    assert.deepEqual(referencedScreenshots(locale, 'timetable'), expected, `locale ${locale}`);
  }
});

for (const slug of staticAppSlugs('en')) {
  const usesHelper = locales.some((l) => imgHelperBase(l, slug) !== null);
  if (!usesHelper) continue;

  test(`${slug}: img helper points at /apps/${slug}/<locale>/`, () => {
    for (const locale of locales) {
      assert.equal(imgHelperBase(locale, slug), `/apps/${slug}/${locale}/`, `locale ${locale}`);
    }
  });

  test(`${slug}: en and ko pages reference the same screenshot names`, () => {
    assert.deepEqual(referencedScreenshots('en', slug), referencedScreenshots('ko', slug));
  });

  test(`${slug}: every referenced screenshot exists in public/apps/${slug}/<locale>/`, () => {
    for (const locale of locales) {
      const missing = referencedScreenshots(locale, slug).filter(
        (name) => !existsSync(join(root, 'public', 'apps', slug, locale, `${name}.png`)),
      );
      assert.deepEqual(missing, [], `missing in public/apps/${slug}/${locale}/`);
    }
  });

  test(`${slug}: en and ko screenshot folders contain the same files`, () => {
    const files = (locale) => {
      const dir = join(root, 'public', 'apps', slug, locale);
      return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')).sort() : [];
    };
    assert.deepEqual(files('en'), files('ko'));
  });
}
