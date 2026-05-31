import { supabase, isSupabaseConfigured } from "./supabase";
import { db, type Article, type Highlight } from "./db";
import { toast } from "sonner";

// Pull all articles and highlights from Supabase and sync them to local Dexie DB
export async function syncDownAll() {
  if (!isSupabaseConfigured() || !supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;

  try {
    // 1. Sync Articles
    const { data: remoteArticles, error: artError } = await supabase
      .from("articles")
      .select("*")
      .eq("user_id", userId);

    if (artError) throw artError;

    // Prune locally deleted articles (not present in Supabase for this user)
    const remoteArticleIds = new Set((remoteArticles || []).map((ra) => ra.id));
    const localArticles = await db.articles.toArray();
    for (const la of localArticles) {
      if (!remoteArticleIds.has(la.id)) {
        await db.articles.delete(la.id);
      }
    }

    if (remoteArticles && remoteArticles.length > 0) {
      const formattedArticles: Article[] = remoteArticles.map((ra) => ({
        id: ra.id,
        url: ra.url,
        title: ra.title,
        byline: ra.byline || undefined,
        siteName: ra.site_name || undefined,
        excerpt: ra.excerpt || undefined,
        contentHTML: ra.content_html,
        timestamp: Number(ra.timestamp),
      }));

      // Put into local Dexie
      await db.articles.bulkPut(formattedArticles);
    }

    // 2. Sync Highlights
    const { data: remoteHighlights, error: hlError } = await supabase
      .from("highlights")
      .select("*")
      .eq("user_id", userId);

    if (hlError) throw hlError;

    // Prune locally deleted highlights (not present in Supabase for this user)
    const remoteHighlightIds = new Set((remoteHighlights || []).map((rh) => rh.id));
    const localHighlights = await db.highlights.toArray();
    for (const lh of localHighlights) {
      if (!remoteHighlightIds.has(lh.id)) {
        await db.highlights.delete(lh.id);
      }
    }

    if (remoteHighlights && remoteHighlights.length > 0) {
      const formattedHighlights: Highlight[] = remoteHighlights.map((rh) => ({
        id: rh.id,
        articleId: rh.article_id,
        color: rh.color,
        text: rh.text,
        startXPath: rh.start_xpath,
        startOffset: rh.start_offset,
        endXPath: rh.end_xpath,
        endOffset: rh.end_offset,
        createdAt: new Date(rh.created_at).getTime(),
      }));

      // Put into local Dexie
      await db.highlights.bulkPut(formattedHighlights);
    }
  } catch (err) {
    handleSyncError(err, "Sync down");
  }
}

function handleSyncError(err: any, context: string) {
  console.error(`${context} failed:`, err);
  if (err && (err.code === "42P01" || (err.message && err.message.includes("relation")))) {
    toast.error(
      "⚠️ database tables (articles/highlights) are missing! Please paste the SQL schema from 'supabase_schema.sql' into your Supabase SQL Editor.",
      { duration: 8000 }
    );
  } else if (err) {
    toast.error(`Cloud sync failed: ${err.message || "Unknown error"}`);
  }
}

// Push local article to Supabase
export async function syncUpArticle(article: Article) {
  if (!isSupabaseConfigured() || !supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;

  try {
    const { error } = await supabase.from("articles").upsert({
      id: article.id,
      user_id: userId,
      url: article.url,
      title: article.title,
      byline: article.byline || null,
      site_name: article.siteName || null,
      excerpt: article.excerpt || null,
      content_html: article.contentHTML,
      timestamp: article.timestamp,
    });

    if (error) throw error;
  } catch (err) {
    handleSyncError(err, "Sync up article");
  }
}

// Delete article from Supabase
export async function syncDeleteArticle(id: string) {
  if (!isSupabaseConfigured() || !supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;

  try {
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    // Delete cascading highlights from Supabase
    await supabase
      .from("highlights")
      .delete()
      .eq("article_id", id)
      .eq("user_id", userId);
  } catch (err) {
    console.error("Sync delete article failed:", err);
  }
}

// Push highlight to Supabase
export async function syncUpHighlight(highlight: Highlight) {
  if (!isSupabaseConfigured() || !supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;

  try {
    const { error } = await supabase.from("highlights").upsert({
      id: highlight.id,
      user_id: userId,
      article_id: highlight.articleId,
      color: highlight.color,
      text: highlight.text,
      start_xpath: highlight.startXPath,
      start_offset: highlight.startOffset,
      end_xpath: highlight.endXPath,
      end_offset: highlight.endOffset,
      created_at: new Date(highlight.createdAt).toISOString(),
    });

    if (error) throw error;
  } catch (err) {
    console.error("Sync up highlight failed:", err);
  }
}

// Delete highlight from Supabase
export async function syncDeleteHighlight(id: string) {
  if (!isSupabaseConfigured() || !supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;

  try {
    const { error } = await supabase
      .from("highlights")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  } catch (err) {
    console.error("Sync delete highlight failed:", err);
  }
}
