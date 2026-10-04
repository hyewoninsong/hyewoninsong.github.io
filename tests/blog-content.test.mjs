// Verifies the blog content under src/content/blog/{ko,en}/ against the rules
// the site relies on but `astro build` does not check:
//
//   - file names follow YYYY-MM-DD-<slug>.md (the slug is the URL)
//   - every image a post references exists under public/ — a missing file
//     builds fine and ships as a broken image
//   - a post that exists in both languages carries the same `date` and `app`,
//     so both locales sort it and group it the same way
//   - frontmatter has the keys the blog schema requires and none it does not
//     know (src/content.config.ts) — a typo'd optional key is silently ignored
//   - `app` is a BLOG_APPS key (src/lib/blog-apps.ts); an unknown key still
//     renders, but as a bare slug with no icon, name or app-page link
//   - every BLOG_APPS `appSlug` is a real apps-collection entry, so the
//     app-page link it produces is not a 404
//
// Translation itself is optional (docs/specs/website.md §4.3), so a post that
// exists in only one language is not a failure.
//
// Run with: node --test "tests/**/*.test.mjs"

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['ko', 'en'];
const blogDir = (locale) => join(root, 'src', 'content', 'blog', locale);

function postFiles(locale) {
  return readdirSync(blogDir(locale)).filter((f) => f.endsWith('.md')).sort();
}

function readPost(locale, file) {
  return readFileSync(join(blogDir(locale), file), 'utf8');
}

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : '';
}

function field(source, key) {
  const match = frontmatter(source).match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : undefined;
}

/** Image paths a post references: markdown images, <img>/<source>/<video> src, and frontmatter thumbnail. */
function imageRefs(source) {
  // Fenced code blocks show markdown as an example, not as content.
  const body = source.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');
  const refs = [
    ...[...body.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)[^)]*\)/g)].map((m) => m[1]),
    ...[...body.matchAll(/<(?:img|source|video)[^>]*?\ssrc=["']([^"']+)["']/g)].map((m) => m[1]),
  ];
  const thumbnail = field(source, 'thumbnail');
  if (thumbnail) refs.push(thumbnail);
  return refs.filter((ref) => !/^https?:\/\//.test(ref));
}

test('blog posts exist in both locale folders', () => {
  for (const locale of locales) {
    assert.ok(postFiles(locale).length > 0, `no posts under src/content/blog/${locale}/`);
  }
});

test('blog file names follow YYYY-MM-DD-<slug>.md', () => {
  const bad = locales.flatMap((locale) =>
    postFiles(locale)
      .filter((file) => !/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(file))
      .map((file) => `${locale}/${file}`),
  );
  assert.deepEqual(bad, []);
});

test('every image a blog post references exists under public/', () => {
  const missing = [];
  for (const locale of locales) {
    for (const file of postFiles(locale)) {
      for (const ref of imageRefs(readPost(locale, file))) {
        const path = decodeURI(ref.split(/[?#]/)[0]);
        // Posts are served from /{lang}/blog/<slug>, so only root-absolute paths resolve.
        if (!path.startsWith('/') || !existsSync(join(root, 'public', path))) {
          missing.push(`${locale}/${file}: ${ref}`);
        }
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('a post written in both languages has the same date and app', () => {
  const en = new Set(postFiles('en'));
  const mismatched = [];
  for (const file of postFiles('ko').filter((f) => en.has(f))) {
    const ko = readPost('ko', file);
    const enPost = readPost('en', file);
    for (const key of ['date', 'app']) {
      if (field(ko, key) !== field(enPost, key)) {
        mismatched.push(`${file}: ${key} ko=${field(ko, key)} en=${field(enPost, key)}`);
      }
    }
  }
  assert.deepEqual(mismatched, []);
});

// src/content.config.ts — the `blog` collection schema.
const schemaKeys = ['title', 'date', 'app', 'tags', 'summary', 'thumbnail'];
const requiredKeys = ['title', 'date', 'summary'];

function frontmatterKeys(source) {
  return [...frontmatter(source).matchAll(/^([A-Za-z]+):/gm)].map((m) => m[1]);
}

test('every post has the frontmatter the blog schema requires and no key it does not know', () => {
  const bad = [];
  for (const locale of locales) {
    for (const file of postFiles(locale)) {
      const source = readPost(locale, file);
      for (const key of requiredKeys) {
        if (!field(source, key)) bad.push(`${locale}/${file}: missing ${key}`);
      }
      for (const key of frontmatterKeys(source)) {
        if (!schemaKeys.includes(key)) bad.push(`${locale}/${file}: unknown key ${key}`);
      }
      if (Number.isNaN(Date.parse(field(source, 'date') ?? ''))) {
        bad.push(`${locale}/${file}: date "${field(source, 'date')}" does not parse`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

// src/lib/blog-apps.ts imports astro:content, so read the BLOG_APPS table as text.
const blogApps = readFileSync(join(root, 'src', 'lib', 'blog-apps.ts'), 'utf8');
const appKeys = [...blogApps.matchAll(/key: '([^']+)'/g)].map((m) => m[1]);
const linkedAppSlugs = [...blogApps.matchAll(/appSlug: '([^']+)'/g)].map((m) => m[1]);

test("a post's app is a BLOG_APPS key, and every BLOG_APPS appSlug is a real app entry", () => {
  assert.ok(appKeys.length > 0, 'BLOG_APPS not found in src/lib/blog-apps.ts');
  const bad = [];
  for (const locale of locales) {
    for (const file of postFiles(locale)) {
      const app = field(readPost(locale, file), 'app');
      if (app !== undefined && !appKeys.includes(app)) bad.push(`${locale}/${file}: app "${app}" is not in BLOG_APPS`);
    }
  }
  const appsDir = join(root, 'src', 'content', 'apps', 'ko');
  const appSlugs = readdirSync(appsDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => field(readFileSync(join(appsDir, f), 'utf8'), 'slug'));
  for (const slug of linkedAppSlugs) {
    if (!appSlugs.includes(slug)) bad.push(`BLOG_APPS appSlug "${slug}" has no src/content/apps/ko entry`);
  }
  assert.deepEqual(bad, []);
});
