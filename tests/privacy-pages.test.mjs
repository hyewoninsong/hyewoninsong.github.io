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
//   - a policy has the same section / list structure in both languages — a
//     disclosure added to one language only (e.g. the SuperTimetable in-app
//     purchase bullet of 2026-09-28) would leave the other store locale stale
//   - the SuperTimetable policy discloses the Remove Ads purchase under Firebase
//     Analytics and says Apple / Google Play handle payment (docs/specs/website.md §4.2)
//   - the SuperTimetable iOS policy and app page say data stays on the device
//     and do not mention iCloud — the backup was removed from the app
//     (docs/decisions/2026-10-13-timetable-icloud-backup-removed.md)
//   - the SuperTimetable policy discloses the Google AdMob banner on both
//     platforms — IDFA/ATT (with the Google explainer screen) on iOS, AAID on
//     Android, a processor row, a consent / opt-out path — its App Store table
//     mirrors the published ASC label (8 types, 4 tracked), and the shared
//     policy's ad exception names the whole app
//     (docs/decisions/2026-10-23-timetable-ios-admob-privacy.md)
//   - the SuperFont policy discloses the AdMob banner, IDFA/ATT, UMP consent
//     and the Remove Ads purchase, and its App Store table mirrors the privacy
//     manifest (6 types, 4 tracked)
//     (docs/decisions/2026-10-25-superfont-ios-admob-privacy.md)
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

test('a policy has the same section and list structure in both languages', () => {
  const count = (source, tag) => (source.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length;
  const uneven = [];
  for (const file of policyPages('ko')) {
    if (!existsSync(join(pagesDir('en'), file))) continue;
    const ko = readPage('ko', file);
    const en = readPage('en', file);
    for (const tag of ['h2', 'h3', 'li']) {
      if (count(ko, tag) !== count(en, tag)) uneven.push(`${file}: <${tag}> ko=${count(ko, tag)} en=${count(en, tag)}`);
    }
  }
  assert.deepEqual(uneven, []);
});

test('the SuperTimetable policy discloses the Remove Ads purchase, with Apple and Google Play handling payment', () => {
  // The premium purchase stopped selling on 2026-10-06; Remove Ads is the one
  // purchase on both platforms (docs/decisions/2026-10-23-timetable-ios-admob-privacy.md).
  const wording = {
    ko: [/광고 제거 구매/, /Apple\(iOS\)/, /Google Play\(Android\)/],
    en: [/Remove ads purchase/, /handled by Apple \(iOS\) and Google Play \(Android\)/],
  };
  const stale = { ko: /앱 내 구매 여부|프리미엄 구매/, en: /In-app purchase status|premium purchase/i };
  const missing = [];
  for (const locale of locales) {
    const source = readPage(locale, 'apps/timetable/privacy.astro');
    const analytics = source.slice(source.indexOf('Firebase Analytics'), source.indexOf('Firebase Crashlytics'));
    assert.ok(analytics.length > 0, `${locale}: Firebase Analytics section not found`);
    for (const pattern of wording[locale]) {
      if (!pattern.test(analytics)) missing.push(`${locale}/apps/timetable/privacy.astro: ${pattern}`);
    }
    if (stale[locale].test(analytics)) missing.push(`${locale}/apps/timetable/privacy.astro: still describes the premium purchase`);
  }
  assert.deepEqual(missing, []);
});

test('the SuperTimetable iOS policy and app page do not mention iCloud and say data stays on the device', () => {
  // iCloud Backup was removed from the app on 2026-10-13
  // (docs/decisions/2026-10-13-timetable-icloud-backup-removed.md).
  const required = { ko: /기기 안에만 저장/, en: /stored only on your device/ };
  const problems = [];
  for (const locale of locales) {
    const policy = readPage(locale, 'apps/timetable/privacy.astro');
    const appPage = readFileSync(join(root, 'src', 'content', 'apps', locale, 'timetable.md'), 'utf8');
    if (!required[locale].test(policy)) problems.push(`${locale}/apps/timetable/privacy.astro: missing ${required[locale]}`);
    if (!/stay on the device|기기 안에만/.test(appPage)) problems.push(`content/apps/${locale}/timetable.md: no device-only sentence`);
    if (/icloud/i.test(policy)) problems.push(`${locale}/apps/timetable/privacy.astro: mentions iCloud`);
    if (/icloud/i.test(appPage)) problems.push(`content/apps/${locale}/timetable.md: mentions iCloud`);
  }
  assert.deepEqual(problems, []);
});

test('the SuperTimetable policy discloses AdMob and ATT on iOS as well as Android', () => {
  // The iOS app gained an AdMob banner and an ATT prompt (policy effective 2026-10-30),
  // superseding the iOS-ad-free line of 2026-10-16
  // (docs/decisions/2026-10-23-timetable-ios-admob-privacy.md,
  //  docs/decisions/2026-10-23-timetable-ios-idfa-explainer.md).
  const wording = {
    ko: [/<h3>Google AdMob \(Google LLC\)<\/h3>/, /<td>Google LLC \(AdMob\)<\/td>/, /IDFA/, /AAID/, /앱 추적 투명성\(ATT\) 권한을 한 번 묻습니다/, /Google 안내 화면/, /광고 개인정보 설정/],
    en: [/<h3>Google AdMob \(Google LLC\)<\/h3>/, /<td>Google LLC \(AdMob\)<\/td>/, /IDFA/, /AAID/, /App Tracking Transparency/, /short Google screen explains/, /Ad privacy/],
  };
  const stale = {
    ko: /Android 앱만|iOS 앱에는 광고가 없|ATT\) 권한을 요청하지 않습니다/,
    en: /Android app only|iOS app (has|contains) no (ads|advertising)|does not request App Tracking Transparency/,
  };
  const problems = [];
  for (const locale of locales) {
    const source = readPage(locale, 'apps/timetable/privacy.astro');
    for (const pattern of wording[locale]) {
      if (!pattern.test(source)) problems.push(`${locale}/apps/timetable/privacy.astro: missing ${pattern}`);
    }
    const found = source.match(stale[locale]);
    if (found) problems.push(`${locale}/apps/timetable/privacy.astro: stale "${found[0]}"`);
  }
  assert.deepEqual(problems, []);
});

test('the SuperTimetable App Store privacy table mirrors the published ASC label', () => {
  // Eight data types published 2026-10-23; four are used for tracking.
  const rows = { ko: /<tbody>[\s\S]*?<\/tbody>/g, en: /<tbody>[\s\S]*?<\/tbody>/g };
  const tracked = { ko: /<td>함<\/td><\/tr>/g, en: /<td>Yes<\/td><\/tr>/g };
  const problems = [];
  for (const locale of locales) {
    const source = readPage(locale, 'apps/timetable/privacy.astro');
    const table = [...source.matchAll(rows[locale])].map((m) => m[0]).find((body) => /IDFV|기기 ID|Device ID/.test(body));
    if (!table) { problems.push(`${locale}: App Store privacy table not found`); continue; }
    const count = (table.match(/<tr>/g) ?? []).length;
    const trackedCount = (table.match(tracked[locale]) ?? []).length;
    if (count !== 8) problems.push(`${locale}: ${count} rows, expected 8`);
    if (trackedCount !== 4) problems.push(`${locale}: ${trackedCount} tracking rows, expected 4`);
  }
  assert.deepEqual(problems, []);
});

test('the shared privacy page names the SuperTimetable app, not only its Android app, as the ad exception', () => {
  const problems = [];
  for (const locale of locales) {
    const source = readPage(locale, 'privacy.astro');
    if (/SuperTimetable Android 앱의 광고|ads in the SuperTimetable Android app/.test(source)) {
      problems.push(`${locale}/privacy.astro: exception still limited to the Android app`);
    }
    if (!/SuperTimetable 앱의 광고|ads in the SuperTimetable app/.test(source)) {
      problems.push(`${locale}/privacy.astro: SuperTimetable ad exception missing`);
    }
  }
  assert.deepEqual(problems, []);
});

test('the SuperFont policy discloses AdMob, ATT and the Remove Ads purchase', () => {
  // Policy effective 2026-10-25 (docs/decisions/2026-10-25-superfont-ios-admob-privacy.md).
  const wording = {
    ko: [/<h3>Google AdMob \(Google LLC\)<\/h3>/, /<td>Google LLC \(AdMob\)<\/td>/, /IDFA/, /IDFV/, /앱 추적 투명성\(ATT\) 권한을 한 번 묻습니다/, /UMP/, /광고 제거 화면 → 광고 개인정보 설정/, /광고 제거 구매/, /Apple이 처리/],
    en: [/<h3>Google AdMob \(Google LLC\)<\/h3>/, /<td>Google LLC \(AdMob\)<\/td>/, /IDFA/, /IDFV/, /App Tracking Transparency/, /UMP/, /Remove Ads screen → Ad privacy/, /Remove Ads/, /Apple/],
  };
  const problems = [];
  for (const locale of locales) {
    const source = readPage(locale, 'apps/superfont/privacy.astro');
    for (const pattern of wording[locale]) {
      if (!pattern.test(source)) problems.push(`${locale}/apps/superfont/privacy.astro: missing ${pattern}`);
    }
  }
  assert.deepEqual(problems, []);
});

test('the SuperFont App Store privacy table mirrors the privacy manifest', () => {
  // Six collected types in PrivacyInfo.xcprivacy; four are used for tracking.
  const tracked = { ko: /<td>함<\/td><\/tr>/g, en: /<td>Yes<\/td><\/tr>/g };
  const problems = [];
  for (const locale of locales) {
    const source = readPage(locale, 'apps/superfont/privacy.astro');
    const table = [...source.matchAll(/<tbody>[\s\S]*?<\/tbody>/g)].map((m) => m[0]).find((body) => /기기 ID|Device ID/.test(body));
    if (!table) { problems.push(`${locale}: App Store privacy table not found`); continue; }
    const count = (table.match(/<tr>/g) ?? []).length;
    const trackedCount = (table.match(tracked[locale]) ?? []).length;
    if (count !== 6) problems.push(`${locale}: ${count} rows, expected 6`);
    if (trackedCount !== 4) problems.push(`${locale}: ${trackedCount} tracking rows, expected 4`);
  }
  assert.deepEqual(problems, []);
});

// SuperFont now reads the IDFA for ads (2026-10-25), but the shared policy still
// names only SuperTimetable as the exception to "no ad identifiers". Drop the
// `todo` once src/pages/{ko,en}/privacy.astro names SuperFont too.
test('the shared privacy page names SuperFont as an ad exception', { todo: 'shared policy lists only SuperTimetable' }, () => {
  const problems = [];
  for (const locale of locales) {
    const source = readPage(locale, 'privacy.astro');
    if (!/SuperFont/.test(source)) problems.push(`${locale}/privacy.astro: SuperFont ad exception missing`);
  }
  assert.deepEqual(problems, []);
});

test('the SuperMusicNote Android policy discloses AdMob and the Remove Ads purchase', () => {
  // Policy effective 2026-10-26 (docs/decisions/2026-10-26-musicnote-android-admob-privacy.md).
  // "No advertising ID" must stay scoped to Firebase Analytics; the ad SDK reads the AAID.
  const wording = {
    ko: [/<strong>Google AdMob<\/strong>\(Google LLC\)/, /AAID/, /앱 세트 ID/, /설정 → 광고 개인정보 설정/, /광고 제거<\/strong> 결제는 Google Play 가 처리/, /Firebase Analytics 는 광고 ID 를 수집하지 않아/],
    en: [/<strong>Google AdMob<\/strong> \(Google LLC\)/, /AAID/, /app set ID/, /Settings → Ad privacy settings/, /Remove Ads<\/strong> payments are processed by Google Play/, /Firebase Analytics does not collect the advertising ID/],
  };
  const stale = { ko: /광고를 표시하거나 결제를 처리하지 않/, en: /does not display advertising or process payments/ };
  const problems = [];
  for (const locale of locales) {
    const source = readPage(locale, 'apps/musicnote/android/privacy.astro');
    for (const pattern of wording[locale]) {
      if (!pattern.test(source)) problems.push(`${locale}/apps/musicnote/android/privacy.astro: missing ${pattern}`);
    }
    if (stale[locale].test(source)) problems.push(`${locale}/apps/musicnote/android/privacy.astro: still says the app has no ads`);
  }
  assert.deepEqual(problems, []);
});

// SuperMusicNote Android reads the AAID for ads (2026-10-26), but the shared policy
// still names only SuperTimetable as the exception to "no ad identifiers". Drop the
// `todo` once src/pages/{ko,en}/privacy.astro names SuperMusicNote in that sentence.
test('the shared privacy page names SuperMusicNote as an ad exception', { todo: 'shared policy lists only SuperTimetable' }, () => {
  const problems = [];
  for (const locale of locales) {
    const source = readPage(locale, 'privacy.astro');
    const sentence = source.split('\n').find((line) => /SuperTimetable 앱의 광고|ads in the SuperTimetable app/.test(line)) ?? '';
    if (!/SuperMusicNote/.test(sentence)) problems.push(`${locale}/privacy.astro: SuperMusicNote ad exception missing`);
  }
  assert.deepEqual(problems, []);
});
