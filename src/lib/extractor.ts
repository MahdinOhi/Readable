import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";
import { db, hashUrl, type Article } from "./db";

const PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

async function fetchHTML(url: string): Promise<string> {
  let lastErr: unknown;
  for (const p of PROXIES) {
    try {
      const res = await fetch(p(url));
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const text = await res.text();
      if (text && text.length > 200) return text;
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `Failed to fetch URL. ${lastErr instanceof Error ? lastErr.message : ""}`
  );
}

export async function extractArticle(url: string): Promise<Article> {
  const id = hashUrl(url);
  const cached = await db.articles.get(id);
  if (cached) return cached;

  const html = await fetchHTML(url);
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Fix relative URLs
  const base = doc.createElement("base");
  base.href = url;
  doc.head.prepend(base);

  const reader = new Readability(doc, { keepClasses: false });
  const parsed = reader.parse();
  if (!parsed || !parsed.content) {
    throw new Error("Could not extract readable content from this page.");
  }

  const clean = DOMPurify.sanitize(parsed.content, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "src",
      "loading",
      "referrerpolicy",
    ],
  });

  // Lazy load images
  const wrapper = document.createElement("div");
  wrapper.innerHTML = clean;
  wrapper.querySelectorAll("img").forEach((img) => {
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
  });
  wrapper.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });

  const article: Article = {
    id,
    url,
    title: parsed.title || url,
    byline: parsed.byline || undefined,
    publishedTime: parsed.publishedTime || undefined,
    excerpt: parsed.excerpt || undefined,
    siteName: parsed.siteName || undefined,
    contentHTML: wrapper.innerHTML,
    timestamp: Date.now(),
  };

  await db.articles.put(article);
  return article;
}
