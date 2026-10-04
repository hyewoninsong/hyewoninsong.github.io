import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

/**
 * `public/` 자산 경로에 내용 해시를 붙인다. (`/apps/superfont/icon.png` → `…/icon.png?v=1a2b3c4d`)
 *
 * 앱 페이지의 자산은 같은 이름 그대로 새 파일로 갈아끼운다 (`import.png` 는 계속 `import.png` 다).
 * 그런데 GitHub Pages 는 `public/` 을 `cache-control: max-age=14400` 으로 내보내기 때문에, 교체
 * 직전에 페이지를 연 사람은 그 뒤 네 시간 동안 옛 이미지를 본다 — 2026-09-20 에 잘린 스샷을 온전한
 * 것으로 바꾸고도 "아직 잘려 보인다" 는 말을 들었고, 확인해 보니 CDN 은 새 파일을 주고 있었다.
 * 쿼리에 해시를 달면 교체와 동시에 URL 이 바뀐다.
 *
 * 스샷뿐 아니라 앱 아이콘처럼 이름이 고정된 자산은 전부 이 함수를 거친다.
 */
// import.meta.url 은 번들된 청크를 가리킬 수 있어 소스 기준 상대경로가 빗나간다.
// astro dev/build 는 프로젝트 루트에서 돌기 때문에 cwd 가 확실하다.
const publicDir = `${process.cwd()}/public/`;
const hashes = new Map<string, string>();

export function withHash(path: string): string {
  if (!hashes.has(path)) {
    const file = publicDir + path.slice(1);
    hashes.set(
      path,
      existsSync(file) ? createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 8) : ''
    );
  }
  const h = hashes.get(path);
  return h ? `${path}?v=${h}` : path;
}
