import Dexie, { type Table } from "dexie";

export interface Article {
  id: string;
  url: string;
  title: string;
  byline?: string;
  publishedTime?: string;
  contentHTML: string;
  excerpt?: string;
  siteName?: string;
  timestamp: number;
}

export interface Highlight {
  id: string;
  articleId: string;
  color: string;
  text: string;
  // serialized range info
  startXPath: string;
  startOffset: number;
  endXPath: string;
  endOffset: number;
  createdAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
}

class ReadableDB extends Dexie {
  articles!: Table<Article, string>;
  highlights!: Table<Highlight, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("readable-db");
    this.version(1).stores({
      articles: "id, url, timestamp",
      highlights: "id, articleId, createdAt",
      settings: "key",
    });
  }
}

export const db = new ReadableDB();

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return (row?.value as T) ?? fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}

export function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (h << 5) - h + url.charCodeAt(i);
    h |= 0;
  }
  return "a_" + Math.abs(h).toString(36);
}
