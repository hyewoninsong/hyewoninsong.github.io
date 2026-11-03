// Guards the app status / store link frontmatter in src/content/apps/{en,ko}/*.md
// against the drift described in docs/references/app-status-drift-pitfall.md:
//   - en and ko copies of an app carry the same platforms, store URLs and release date
//   - a Google Play link exists exactly when platforms.android is "released"
//   - an App Store link exists exactly when an Apple platform is "released"
//   - store URLs use the canonical, country-less shapes from docs/specs/website.md
//   - every page that renders appStoreUrl also renders playStoreUrl
//
// Run with: npm test   (node --test "tests/**/*.test.mjs")

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appsDir = join(root, 'src', 'content', 'apps');
const locales = ['en', 'ko'];

/** Minimal frontmatter reader for the flat keys and the `platforms:` block we care about. */
function readApp(locale, file) {
  const source = readFileSync(join(appsDir, locale, file), 'utf8');
  const fm = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(fm, `${locale}/${file}: frontmatter missing`);
  const lines = fm[1].split('\n');
  const strip = (v) => v.replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '');
  const data = { platforms: {} };
  let inPlatforms = false;
  for (const line of lines) {
    if (/^platforms:\s*$/.test(line)) { inPlatforms = true; continue; }
    const nested = line.match(/^\s+(\w+):\s*(.+)$/);
    if (inPlatforms && nested) { data.platforms[nested[1]] = strip(nested[2]); continue; }
    inPlatforms = false;
    const top = line.match(/^(\w+):\s*(.*)$/);
    if (top) data[top[1]] = strip(top[2]);
  }
  return data;
}

function appFiles(locale) {
  return readdirSync(join(appsDir, locale)).filter((f) => f.endsWith('.md')).sort();
}

const apps = Object.fromEntries(
  locales.map((l) => [l, Object.fromEntries(appFiles(l).map((f) => [f, readApp(l, f)]))]),
);

test('en and ko have the same app files', () => {
  assert.deepEqual(appFiles('en'), appFiles('ko'));
});

for (const file of appFiles('en')) {
  test(`${file}: en/ko agree on platforms, store links and release date`, () => {
    const en = apps.en[file];
    const ko = apps.ko[file];
    assert.deepEqual(en.platforms, ko.platforms, 'platforms differ');
    for (const key of ['appStoreUrl', 'playStoreUrl', 'releaseDate']) {
      assert.equal(en[key], ko[key], `${key} differs`);
    }
  });

  for (const locale of locales) {
    test(`${locale}/${file}: store links match release status`, () => {
      const app = apps[locale][file];
      const p = app.platforms;
      const androidReleased = p.android === 'released';
      const appleReleased = ['iphone', 'ipad', 'mac'].some((k) => p[k] === 'released');

      assert.equal(Boolean(app.playStoreUrl), androidReleased,
        androidReleased ? 'android is released but playStoreUrl is missing'
                        : 'playStoreUrl is set but android is not released');
      assert.equal(Boolean(app.appStoreUrl), appleReleased,
        appleReleased ? 'an Apple platform is released but appStoreUrl is missing'
                      : 'appStoreUrl is set but no Apple platform is released');

      if (app.playStoreUrl) {
        assert.match(app.playStoreUrl,
          /^https:\/\/play\.google\.com\/store\/apps\/details\?id=[a-z][\w.]*$/i,
          'playStoreUrl must be the details?id=<package> form with no extra params');
      }
      if (app.appStoreUrl) {
        assert.match(app.appStoreUrl, /^https:\/\/apps\.apple\.com\/app\/id\d+$/,
          'appStoreUrl must be the country-less apps.apple.com/app/id<n> form');
      }
      if (androidReleased || appleReleased) {
        assert.match(app.releaseDate ?? '', /^\d{4}-\d{2}-\d{2}$/,
          'a released app needs a releaseDate');
      }
    });
  }
}

test('every page that links to the App Store also links to Google Play', () => {
  const pages = [
    join(root, 'src', 'components', 'AppPage.astro'),
    ...locales.map((l) => join(root, 'src', 'pages', l, 'apps', '[slug].astro')),
  ];
  for (const page of pages) {
    const source = readFileSync(page, 'utf8');
    if (!source.includes('appStoreUrl')) continue;
    assert.ok(source.includes('playStoreUrl'), `${page} renders appStoreUrl but not playStoreUrl`);
    assert.ok(source.includes('Google Play'), `${page} has no "Google Play" link label`);
  }
});

test('content schema declares playStoreUrl', () => {
  const config = readFileSync(join(root, 'src', 'content.config.ts'), 'utf8');
  assert.match(config, /playStoreUrl:\s*z\.string\(\)\.optional\(\)/);
});
