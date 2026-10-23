// Verifies public/app-ads.txt, the IAB authorized-sellers file AdMob crawls at
// the developer website listed in the store (hyewoninsong.com/app-ads.txt).
// `astro build` copies it as-is, so nothing else catches a malformed line:
//
//   - the file exists at the site root
//   - every record is `<domain>, <pub-…>, DIRECT|RESELLER[, <cert id>]`
//   - the Google AdMob record names a pub- ID and Google's certification ID
//
// Run with: node --test "tests/**/*.test.mjs"

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'public', 'app-ads.txt');

/** Non-empty, non-comment lines split into trimmed fields. */
function records() {
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((field) => field.trim()));
}

test('app-ads.txt exists at the site root', () => {
  assert.ok(existsSync(file), 'public/app-ads.txt is missing');
});

test('every app-ads.txt record has a domain, account ID and relationship', () => {
  const bad = records().filter(
    ([domain, account, relation, ...rest]) =>
      !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain ?? '') ||
      !account ||
      !/^(DIRECT|RESELLER)$/.test(relation ?? '') ||
      rest.length > 1,
  );
  assert.deepEqual(bad, []);
});

test('app-ads.txt authorizes the Google AdMob publisher account', () => {
  const google = records().filter(([domain]) => domain === 'google.com');
  assert.equal(google.length, 1, 'expected exactly one google.com record');
  const [, account, relation, certId] = google[0];
  assert.match(account, /^pub-\d{16}$/);
  assert.equal(relation, 'DIRECT');
  assert.equal(certId, 'f08c47fec0942fa0');
});
