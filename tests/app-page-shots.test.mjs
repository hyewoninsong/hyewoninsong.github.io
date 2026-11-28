// Verifies screenshots of app detail pages that render through AppPage.astro.
//
// Those pages (src/pages/{en,ko}/apps/<slug>.astro) declare screenshots as
// `copy.sections[].shots = { iphone: [{ file, alt }], ipad: [...] }` plus an
// implicit `hero`, and AppPage resolves each file to
//   iphone -> public/apps/<slug>/<lang>/<file>.png
//   ipad   -> public/apps/<slug>/<lang>/ipad/<file>.png
// tests/app-screenshots.test.mjs only understands the older img('<name>') helper
// and absolute "/apps/..." paths, so it no longer sees these pages at all.
//
// Run with: npm test   (node --test "tests/**/*.test.mjs")

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['en', 'ko'];
const pagesDir = (locale) => join(root, 'src', 'pages', locale, 'apps');

/** Returns the source between `open` at index i and its matching closer, skipping quoted strings. */
function balanced(source, i, open, close) {
  let depth = 0;
  let quote = null;
  for (let j = i; j < source.length; j++) {
    const c = source[j];
    if (quote) {
      if (c === '\\') j++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return source.slice(i, j + 1);
  }
  throw new Error(`unbalanced ${open}${close} at ${i}`);
}

function appPageSlugs(locale) {
  return readdirSync(pagesDir(locale))
    .filter((f) => f.endsWith('.astro') && !f.startsWith('[') && f !== 'index.astro')
    .filter((f) => /<AppPage\b/.test(readFileSync(join(pagesDir(locale), f), 'utf8')))
    .map((f) => f.replace(/\.astro$/, ''))
    .sort();
}

/** { slug, iphone: Set<file>, ipad: Set<file> } as declared by one page. */
function declaredShots(locale, page) {
  const source = readFileSync(join(pagesDir(locale), `${page}.astro`), 'utf8');
  const slug = source.match(/<AppPage\b[^>]*\bslug="([^"]+)"/)?.[1];
  const shots = { iphone: new Set(), ipad: new Set() };
  for (const m of source.matchAll(/\bshots:\s*\{/g)) {
    const block = balanced(source, m.index + m[0].length - 1, '{', '}');
    for (const device of ['iphone', 'ipad']) {
      const at = block.search(new RegExp(`\\b${device}:\\s*\\[`));
      if (at < 0) continue;
      const list = balanced(block, block.indexOf('[', at), '[', ']');
      for (const f of list.matchAll(/\bfile:\s*['"]([^'"]+)['"]/g)) shots[device].add(f[1]);
    }
  }
  const hasTabs = /\btabs:\s*\{/.test(source);
  if (/\bhero:\s*\{/.test(source)) {
    shots.iphone.add('hero');
    if (hasTabs) shots.ipad.add('hero');
  }
  return { slug, ...shots };
}

const shotPath = (slug, locale, device, file) =>
  device === 'ipad'
    ? join(root, 'public', 'apps', slug, locale, 'ipad', `${file}.png`)
    : join(root, 'public', 'apps', slug, locale, `${file}.png`);

test('en and ko render the same set of AppPage app pages', () => {
  assert.deepEqual(appPageSlugs('en'), appPageSlugs('ko'));
});

for (const page of appPageSlugs('en')) {
  test(`${page}: AppPage slug matches the page file name in both locales`, () => {
    for (const locale of locales) assert.equal(declaredShots(locale, page).slug, page, `locale ${locale}`);
  });

  test(`${page}: en and ko declare the same screenshot files per device`, () => {
    const [en, ko] = locales.map((l) => declaredShots(l, page));
    for (const device of ['iphone', 'ipad']) {
      assert.deepEqual([...en[device]].sort(), [...ko[device]].sort(), device);
    }
  });

  test(`${page}: every declared screenshot exists under public/apps/${page}/<locale>/`, () => {
    const missing = [];
    for (const locale of locales) {
      const d = declaredShots(locale, page);
      for (const device of ['iphone', 'ipad']) {
        for (const file of d[device]) {
          if (!existsSync(shotPath(d.slug, locale, device, file))) missing.push(`${locale}/${device}/${file}`);
        }
      }
    }
    assert.deepEqual(missing, []);
  });
}

test('the parser sees screenshots on every AppPage page', () => {
  // Guards against a future copy shape the regexes above silently miss.
  for (const page of appPageSlugs('en')) {
    assert.ok(declaredShots('en', page).iphone.size > 1, `${page}: no iPhone shots parsed`);
  }
});
