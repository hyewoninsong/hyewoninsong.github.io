// Verifies the blog content under src/content/blog/{ko,en}/ against the rules
// the site relies on but `astro build` does not check:
//
//   - file names follow YYYY-MM-DD-<slug>.md (the slug is the URL)
//   - every image a post references exists under public/ — a missing file
//     builds fine and ships as a broken image
//   - a post that exists in both languages carries the same `date` and `app`,
//     so both locales sort it and group it the same way
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
