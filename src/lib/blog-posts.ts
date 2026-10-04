/**
 * 블로그 글 목록의 공통 규칙 — 순서와 날짜 표기.
 *
 * 글은 여러 앱 저장소의 devlog 세션이 하루에 여러 편 올린다. 그래서 목록의 기준은 날짜가 아니라
 * **쓴 시각**이고, 빌드가 어디서 돌든 화면의 날짜는 한국 날짜여야 한다.
 */

/** 글의 `date` 는 한국 시각이다. 빌드 머신이 UTC(GitHub Actions)여도 같은 날짜를 찍게 고정한다. */
export const SITE_TIME_ZONE = 'Asia/Seoul';

/** 카드·글머리의 날짜 표기(YYYY-MM-DD). 시각은 순서에만 쓰고 화면에는 내지 않는다. */
export const formatPostDate = (date: Date): string =>
  date.toLocaleDateString('en-CA', { timeZone: SITE_TIME_ZONE });

type DatedPost = { id: string; data: { date: Date } };

/**
 * 목록의 기본 순서 — **최신이 위**.
 *
 * 같은 날 글이 여럿이면 시각까지 비교한다. 시각 없이 날짜만 적힌 글(`date: 2026-09-21`)은
 * 서로 값이 같아 비교가 0 이 되고, 그러면 컬렉션을 읽은 순서(= 파일 이름 오름차순)가 그대로 남아
 * **가장 오래된 글이 맨 위**로 온다. 그 자리를 파일 이름 내림차순으로 막는다 —
 * 파일 이름이 `YYYY-MM-DD-` 로 시작하므로 적어도 날짜 역순은 지켜진다.
 */
export const byNewest = (a: DatedPost, b: DatedPost): number =>
  b.data.date.getTime() - a.data.date.getTime() || b.id.localeCompare(a.id);
