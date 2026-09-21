import { getCollection } from 'astro:content';
import { withHash } from './asset-hash';
import type { Lang } from '../i18n/utils';

/**
 * 글이 **어느 앱을 만들다 나왔는지**. 블로그 frontmatter 의 `app` 값이 이 표의 `key` 다.
 *
 * 글은 앱 저장소의 devlog 세션이 쓰기 때문에 키는 그 앱 저장소가 쓰는 슬러그이고
 * (`daily-planner`, `notequiz`, …), 사이트 apps 컬렉션의 `slug`(`planner`) 와 다를 수 있다.
 * 아직 소개 페이지가 없는 앱도 글은 나온다 — 그래서 앱 목록이 아니라 이 표가 앱별 글의 기준이다.
 * 앱별 목록·카드 뱃지·앱 페이지의 "개발 기록" 이 전부 여기를 거친다.
 *
 * 새 앱의 첫 글이 올라올 때 한 줄 추가한다. 표에 없는 키도 목록에서 빠지지는 않는다 —
 * 키가 그대로 이름으로 나온다.
 */
export interface BlogAppMeta {
  /** frontmatter `app` 값 */
  key: string;
  /** 화면에 나오는 이름. 제품명이라 ko/en 이 같다 */
  name: string;
  /** apps 컬렉션의 slug — 있으면 앱 소개 페이지로 잇는다 */
  appSlug?: string;
}

export const BLOG_APPS: BlogAppMeta[] = [
  { key: 'timetable', name: 'SuperTimetable', appSlug: 'timetable' },
  { key: 'superfont', name: 'SuperFont', appSlug: 'superfont' },
  { key: 'daily-planner', name: 'SuperPlanner', appSlug: 'planner' },
  { key: 'musicnote', name: 'SuperMusicNote', appSlug: 'musicnote' },
  { key: 'superpdf', name: 'SuperPDF', appSlug: 'pdf' },
  { key: 'notequiz', name: 'SuperNoteQuiz' },
  { key: 'supermath', name: 'SuperMathQuiz' },
  { key: 'supertimers', name: 'SuperTimers' },
];

const BY_KEY = new Map(BLOG_APPS.map((app) => [app.key, app]));
const BY_APP_SLUG = new Map(BLOG_APPS.filter((app) => app.appSlug).map((app) => [app.appSlug!, app]));

export const isBlogAppKey = (key: string): boolean => BY_KEY.has(key);

/** apps 컬렉션의 앱 하나가 블로그에서 쓰는 키. 표에 없으면 그 앱 글은 없다. */
export const blogAppForAppSlug = (appSlug: string): BlogAppMeta | undefined => BY_APP_SLUG.get(appSlug);

/**
 * 글의 앱 키. `app` 이 정답이고, 없으면 **앱 슬러그를 첫 태그로 쓰던 옛 글**을 위해 태그에서 찾는다 —
 * 옛 글을 고치지 않아도 앱별 목록에 같이 잡힌다.
 */
export function appKeyOf(data: { app?: string; tags?: string[] }): string | undefined {
  if (data.app) return data.app;
  return (data.tags ?? []).find(isBlogAppKey);
}

/** 태그 줄에서 앱 키는 뺀다 — 앱은 태그가 아니라 앱 줄에서 고른다. */
export const tagsWithoutApp = (data: { app?: string; tags?: string[] }): string[] => {
  const key = appKeyOf(data);
  return (data.tags ?? []).filter((tag) => tag !== key);
};

type AppPost = { data: { app?: string; tags?: string[]; date: Date } };

/** 앱별 글 묶음. 글이 많은 앱부터, 같으면 이름 순. 앱이 없는 글(소식 등)은 빠진다. */
export function groupPostsByApp<T extends AppPost>(posts: T[]): { key: string; posts: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const post of posts) {
    const key = appKeyOf(post.data);
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(post);
    else groups.set(key, [post]);
  }
  return [...groups.entries()]
    .map(([key, list]) => ({
      key,
      posts: [...list].sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
    }))
    .sort((a, b) => b.posts.length - a.posts.length || blogApp(a.key).name.localeCompare(blogApp(b.key).name));
}

const blogApp = (key: string): BlogAppMeta => BY_KEY.get(key) ?? { key, name: key };

export interface ResolvedBlogApp extends BlogAppMeta {
  /** 앱별 글 목록 주소 */
  href: string;
  /** apps 컬렉션에 아이콘이 있을 때만 */
  icon: string | null;
  /** 앱 소개 페이지 — 아직 없는 앱은 null */
  appHref: string | null;
}

/**
 * 앱 키를 화면에 올릴 수 있는 형태로 바꿔 주는 함수를 만든다. apps 컬렉션을 한 번만 읽으려고
 * 페이지마다 `const resolve = await blogAppResolver(lang)` 로 받아 쓴다.
 */
export async function blogAppResolver(lang: Lang): Promise<(key: string) => ResolvedBlogApp> {
  const apps = await getCollection('apps');
  const icons = new Map(
    apps
      .filter((app) => app.id.startsWith(`${lang}/`))
      .map((app) => [app.data.slug, app.data.icon ? withHash(app.data.icon) : null])
  );
  return (key: string) => {
    const meta = blogApp(key);
    return {
      ...meta,
      href: `/${lang}/blog/app/${meta.key}`,
      icon: (meta.appSlug && icons.get(meta.appSlug)) || null,
      appHref: meta.appSlug && icons.has(meta.appSlug) ? `/${lang}/apps/${meta.appSlug}` : null,
    };
  };
}
