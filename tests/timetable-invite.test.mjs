import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inviteURL, copy, languageFor} from '../public/invite/timetable/invite.mjs';
test('requester survives Unicode and URL punctuation', () => {
 const name = '민지 & 준호#?+%';
 const invite = inviteURL('#from='+encodeURIComponent(name));
 assert.equal(invite.name,name);
 assert.equal(new URL(invite.url).searchParams.get('from'),name);
 assert.equal(new URL(invite.url).protocol,'supertimetable:');
});
test('reject invalid, duplicate and oversized input',()=>{
 for(const hash of ['', '#to=evil', '#from=x&from=y', '#from=x&url=https://evil.test', '#from=a%0Ab','#from='+ 'x'.repeat(3000)]) assert.equal(inviteURL(hash),null);
});
test('untrusted markup remains plain data with fixed destination',()=>{
 const invite=inviteURL('#from='+encodeURIComponent('<img src=x onerror=1>'));
 assert.equal(new URL(invite.url).host,'feature');
 assert.equal(new URL(invite.url).pathname,'/free-time-request');
 assert.equal(inviteURL('#from='+'가'.repeat(30)).name.length,20);
});
test('all eight locales and regional fallbacks',()=>{
 assert.equal(Object.keys(copy).length,8);
 for(const strings of Object.values(copy)) assert.equal(strings.length,6);
 assert.equal(languageFor('zh-TW'),'zh-Hant');assert.equal(languageFor('pt-PT'),'pt-BR');assert.equal(languageFor('ko-KR'),'ko');assert.equal(languageFor('de-DE'),'en');
});
