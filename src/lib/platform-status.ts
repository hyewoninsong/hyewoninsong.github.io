/**
 * 앱이 각 플랫폼에서 어디까지 왔는지. 카드·상세 상단·앱 소개 페이지의 뱃지가
 * 모두 이 파일 하나를 거친다 — 상태를 추가할 때 고칠 곳도 여기와 i18n JSON 둘뿐이다.
 */
import type { Lang } from '../i18n/utils';

export type PlatformStatus = 'released' | 'in-review' | 'in-development';

const BADGE_CLASS: Record<PlatformStatus, string> = {
  released: 'border-green-200 bg-green-50 text-green-700',
  'in-review': 'border-amber-200 bg-amber-50 text-amber-700',
  'in-development': 'border-border bg-muted text-muted-foreground',
};

const LABEL_KEY: Record<PlatformStatus, string> = {
  released: 'status.released',
  'in-review': 'status.review',
  'in-development': 'status.dev',
};

export const statusBadgeClass = (status: PlatformStatus): string => BADGE_CLASS[status];

/** i18n 키 — 호출한 쪽이 자기 `t()` 로 번역한다. */
export const statusLabelKey = (status: PlatformStatus): string => LABEL_KEY[status];

const DATE_LOCALE: Record<Lang, string> = { ko: 'ko-KR', en: 'en-US' };

/**
 * "2026년 9월 22일 출시" / "Released September 22, 2026".
 * 어순은 `status.releasedOn` 의 `{date}` 자리로 정해진다 — 언어별 분기를 코드에 두지 않는다.
 * frontmatter 의 `2026-09-22` 는 UTC 자정으로 파싱되므로 UTC 로 그대로 찍어야 하루 밀리지 않는다.
 */
export const releaseLine = (date: Date, lang: Lang, t: (key: string) => string): string =>
  t('status.releasedOn').replace(
    '{date}',
    new Intl.DateTimeFormat(DATE_LOCALE[lang], {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    }).format(date),
  );
