import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Download,
  Library,
  Loader2,
  Palette,
  Type,
  Check,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Reader } from "@/components/Reader";
import { SavedDrawer } from "@/components/SavedDrawer";
import { ThemePanel, type ThemeName, type CustomColors, PRESET_THEMES } from "@/components/ThemePanel";
import { LibraryDashboard } from "@/components/LibraryDashboard";
import { ArticleDialog } from "@/components/ArticleDialog";
import { AuthDialog } from "@/components/AuthDialog";

import { supabase } from "@/lib/supabase";
import { syncUpArticle, syncDeleteArticle, syncDownAll } from "@/lib/sync";
import { extractArticle } from "@/lib/extractor";
import { db, getSetting, setSetting, type Article } from "@/lib/db";

export const Route = createFileRoute("/")(({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Readable — Clean reading view for any article" },
      {
        name: "description",
        content:
          "Paste a URL and read any article distraction-free. Highlight, save offline, and export to PDF.",
      },
      { property: "og:title", content: "Readable" },
      {
        property: "og:description",
        content:
          "Distraction-free reader with highlights, offline storage, and PDF export.",
      },
    ],
  }),
  component: Index,
} as any));

// All class names that can appear on <html>
const ALL_THEME_CLASSES = [
  "dark",
  "sepia",
  "midnight",
  "forest",
  "ocean",
  "rose",
  "slate",
  "solarized",
  "custom",
];

function hexToOklch(hex: string): string {
  // We convert hex to rgb then just pass through as a fallback;
  // for custom theme we set CSS variables directly as hex values
  return hex;
}

function applyTheme(theme: ThemeName, custom?: CustomColors) {
  const root = document.documentElement;
  // Remove all known theme classes
  root.classList.remove(...ALL_THEME_CLASSES);
  if (theme !== "light") {
    root.classList.add(theme);
  }
  // For custom theme, set the CSS variables
  if (theme === "custom" && custom) {
    root.style.setProperty("--custom-bg", custom.background);
    root.style.setProperty("--custom-fg", custom.foreground);
  } else {
    root.style.removeProperty("--custom-bg");
    root.style.removeProperty("--custom-fg");
  }
}

function Index() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [user, setUser] = useState<any>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Subscribe to Supabase auth session state
  useEffect(() => {
    if (!supabase) return;

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Sync down remote library
        syncDownAll().then(() => setRefreshKey((k) => k + 1));
      }
    });

    // Listen for state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "SIGNED_IN" && session?.user) {
          syncDownAll().then(() => setRefreshKey((k) => k + 1));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [theme, setTheme] = useState<ThemeName>("light");
  const [customColors, setCustomColors] = useState<CustomColors>({
    background: "#ffffff",
    foreground: "#1a1a2e",
  });
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");

  // Load settings on mount
  useEffect(() => {
    (async () => {
      const t = await getSetting<ThemeName>("theme", "light");
      const cc = await getSetting<CustomColors>("customColors", {
        background: "#ffffff",
        foreground: "#1a1a2e",
      });
      const fs = await getSetting<number>("fontSize", 18);
      const lh = await getSetting<number>("lineHeight", 1.7);
      const ff = await getSetting<"serif" | "sans">("fontFamily", "serif");
      setTheme(t);
      setCustomColors(cc);
      setFontSize(fs);
      setLineHeight(lh);
      setFontFamily(ff);
      applyTheme(t, cc);
    })();
  }, []);

  useEffect(() => {
    applyTheme(theme, customColors);
    setSetting("theme", theme);
  }, [theme, customColors]);

  useEffect(() => { setSetting("fontSize", fontSize); }, [fontSize]);
  useEffect(() => { setSetting("lineHeight", lineHeight); }, [lineHeight]);
  useEffect(() => { setSetting("fontFamily", fontFamily); }, [fontFamily]);

  function handleThemeChange(t: ThemeName) {
    setTheme(t);
  }

  function handleCustomColors(c: CustomColors) {
    setCustomColors(c);
    setSetting("customColors", c);
  }

  async function handleFetch(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    let target = trimmed;
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    try {
      new URL(target);
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }
    setLoading(true);
    try {
      const a = await extractArticle(target);
      await syncUpArticle(a);
      setArticle(a);
      setRefreshKey((k) => k + 1);
      toast.success("Article ready");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load article"
      );
    } finally {
      setLoading(false);
    }
  }

  function exportPDF() {
    if (!article) return;
    const el = document.getElementById("reader-article");
    if (!el) return;
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      toast.error("Pop-up blocked. Allow pop-ups to export PDF.");
      return;
    }
    const title = article.title.replace(/[<>&"]/g, "");
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,"Iowan Old Style",Palatino,serif;color:#111;background:#fff;max-width:720px;margin:32px auto;padding:0 24px;font-size:${fontSize}px;line-height:${lineHeight};}
  h1{font-size:2em;line-height:1.2;margin:0 0 .5em}
  .meta{color:#666;font-size:.85em;margin-bottom:1.5em;border-bottom:1px solid #ddd;padding-bottom:1em}
  img{max-width:100%;height:auto}
  a{color:#0645ad;text-decoration:underline}
  pre,code{background:#f4f4f4;padding:2px 4px;border-radius:3px;font-family:ui-monospace,Menlo,monospace}
  pre{padding:12px;overflow:auto}
  blockquote{border-left:3px solid #ccc;margin:1em 0;padding:.2em 1em;color:#555}
  mark{padding:0 2px;border-radius:2px}
  @media print{body{margin:0;max-width:none}a{color:#000}}
</style></head><body>
<h1>${title}</h1>
<div class="meta">${[article.byline, article.publishedTime ? new Date(article.publishedTime).toLocaleDateString() : "", article.siteName].filter(Boolean).join(" · ")}</div>
${el.querySelector(".reader-content")?.innerHTML ?? ""}
<script>window.addEventListener('load',()=>{setTimeout(()=>{window.focus();window.print();},300)});<\/script>
</body></html>`);
    win.document.close();
  }

  // Current theme label for aria
  const currentThemeLabel =
    PRESET_THEMES.find((t) => t.name === theme)?.label ?? "Custom";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      {/* Top bar — two-row on mobile, single row on md+ */}
      <header className="app-header print:hidden">
        {/* ── Row 1 (all screens): Logo | spacer | Actions ── */}
        <div className="app-header-row1">
          {/* Logo */}
          <button
            onClick={() => setArticle(null)}
            className="app-logo cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            title="Go to Library"
          >
            <BookOpen className="app-logo-icon" />
            <span className="app-logo-text font-bold">Readable</span>
          </button>

          {/* URL form — hidden on mobile, shown inline on md+ */}
          <form onSubmit={handleFetch} className="app-url-form app-url-form--desktop">
            <Input
              id="url-input-desktop"
              type="text"
              placeholder="Paste an article URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading} id="read-btn-desktop" className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Read"}
            </Button>
          </form>

          {/* Action icons */}
          <div className="app-header-actions">
            {/* Typography */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="action-btn" aria-label="Typography settings" id="typography-btn">
                  <Type size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Font family</DropdownMenuLabel>
                <DropdownMenuItem id="font-serif-item" onClick={() => setFontFamily("serif")}>
                  <span className="flex-1">Serif</span>
                  <Check size={13} className={`typo-check ${fontFamily === "serif" ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
                <DropdownMenuItem id="font-sans-item" onClick={() => setFontFamily("sans")}>
                  <span className="flex-1">Sans-serif</span>
                  <Check size={13} className={`typo-check ${fontFamily === "sans" ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Font size</DropdownMenuLabel>
                <DropdownMenuItem id="font-small-item" onClick={() => setFontSize(15)}>
                  <span className="flex-1">Small</span>
                  <Check size={13} className={`typo-check ${fontSize === 15 ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
                <DropdownMenuItem id="font-medium-item" onClick={() => setFontSize(18)}>
                  <span className="flex-1">Medium</span>
                  <Check size={13} className={`typo-check ${fontSize === 18 ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
                <DropdownMenuItem id="font-large-item" onClick={() => setFontSize(21)}>
                  <span className="flex-1">Large</span>
                  <Check size={13} className={`typo-check ${fontSize === 21 ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
                <DropdownMenuItem id="font-xl-item" onClick={() => setFontSize(24)}>
                  <span className="flex-1">X-Large</span>
                  <Check size={13} className={`typo-check ${fontSize === 24 ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Line spacing</DropdownMenuLabel>
                <DropdownMenuItem id="line-compact-item" onClick={() => setLineHeight(1.5)}>
                  <span className="flex-1">Compact</span>
                  <Check size={13} className={`typo-check ${lineHeight === 1.5 ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
                <DropdownMenuItem id="line-normal-item" onClick={() => setLineHeight(1.7)}>
                  <span className="flex-1">Normal</span>
                  <Check size={13} className={`typo-check ${lineHeight === 1.7 ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
                <DropdownMenuItem id="line-relaxed-item" onClick={() => setLineHeight(2)}>
                  <span className="flex-1">Relaxed</span>
                  <Check size={13} className={`typo-check ${lineHeight === 2 ? "typo-check--visible" : ""}`} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme */}
            <button
              className="action-btn"
              aria-label={`Theme: ${currentThemeLabel}`}
              id="theme-btn"
              onClick={() => setThemePanelOpen(true)}
            >
              <Palette size={16} />
            </button>

            {/* Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="action-btn text-primary" aria-label="User profile" id="user-profile-btn">
                    <User size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground truncate">
                    {user.email || "Authenticated"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    id="sync-now-item"
                    onClick={async () => {
                      toast.promise(syncDownAll().then(() => setRefreshKey((k) => k + 1)), {
                        loading: "Syncing…",
                        success: "Library synchronized!",
                        error: "Failed to sync library",
                      });
                    }}
                  >
                    Sync Now
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    id="logout-item"
                    onClick={async () => {
                      if (supabase) {
                        await supabase.auth.signOut();
                        setUser(null);
                        toast.success("Logged out successfully");
                        window.location.reload();
                      }
                    }}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut size={13} className="mr-2" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                className="action-btn"
                aria-label="Log In"
                id="login-btn"
                onClick={() => setAuthDialogOpen(true)}
              >
                <LogIn size={16} />
              </button>
            )}

            {/* Saved */}
            <button
              className="action-btn"
              aria-label="Saved articles"
              id="saved-btn"
              onClick={() => setDrawerOpen(true)}
            >
              <Library size={16} />
            </button>

            {/* Export PDF */}
            <button
              className="action-btn"
              aria-label="Export PDF"
              id="export-pdf-btn"
              onClick={exportPDF}
              disabled={!article}
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* ── Row 2 (mobile only): Full-width URL form ── */}
        <div className="app-header-row2">
          <form onSubmit={handleFetch} className="app-url-form">
            <Input
              id="url-input"
              type="text"
              placeholder="Paste an article URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
            <Button type="submit" disabled={loading} id="read-btn" className="shrink-0 h-9 px-4 text-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Read"}
            </Button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main>
        {article ? (
          <Reader
            key={article.id}
            article={article}
            fontSize={fontSize}
            lineHeight={lineHeight}
            fontFamily={fontFamily}
            onEdit={(a) => {
              setEditingArticle(a);
              setDialogOpen(true);
            }}
            onDelete={async (id) => {
              if (confirm("Are you sure you want to delete this article and its highlights?")) {
                try {
                  // Delete from cloud first; if it fails, an error is surfaced and local is not deleted
                  await syncDeleteArticle(id);
                  await db.articles.delete(id);
                  await db.highlights.where("articleId").equals(id).delete();
                  setArticle(null);
                  setRefreshKey((k) => k + 1);
                  toast.success("Article deleted");
                } catch (e) {
                  // syncDeleteArticle already toasts the cloud error; only toast generic error if local ops fail
                  if (!(e instanceof Error) || !e.message.includes("cloud")) {
                    toast.error("Failed to delete article");
                  }
                }
              }
            }}
          />
        ) : (
          <LibraryDashboard
            onSelectArticle={(a) => setArticle(a)}
            refreshTrigger={refreshKey}
          />
        )}
      </main>

      {/* Saved drawer */}
      <SavedDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpen={(a) => setArticle(a)}
        refreshKey={refreshKey}
      />

      {/* Theme panel */}
      <ThemePanel
        open={themePanelOpen}
        onOpenChange={setThemePanelOpen}
        currentTheme={theme}
        customColors={customColors}
        onThemeChange={handleThemeChange}
        onCustomColorsChange={handleCustomColors}
      />

      {/* CRUD dialog */}
      <ArticleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editingArticle}
        onSave={async (saved) => {
          await syncUpArticle(saved);
          setRefreshKey((k) => k + 1);
          if (article && article.id === saved.id) {
            setArticle(saved); // Update the article currently shown in the reader
          }
        }}
      />

      {/* Auth dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthSuccess={() => {
          setRefreshKey((k) => k + 1);
        }}
      />


    </div>
  );
}

function EmptyState({ onPick }: { onPick: (u: string) => void }) {
  const [recent, setRecent] = useState<Article[]>([]);
  useEffect(() => {
    db.articles
      .orderBy("timestamp")
      .reverse()
      .limit(6)
      .toArray()
      .then(setRecent);
  }, []);

  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrap">
        <BookOpen className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1>Read anything, distraction-free.</h1>
      <p className="empty-state-desc">
        Paste any article URL above. Readable strips away ads, navs, and
        clutter so you can focus on what matters — then highlight, save
        offline, or export to PDF.
      </p>

      {recent.length > 0 && (
        <div style={{ width: "100%", textAlign: "left" }}>
          <p className="empty-recent-heading">Recent</p>
          <ul className="empty-recent-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recent.map((a) => (
              <li key={a.id}>
                <button
                  className="empty-recent-item"
                  onClick={() => onPick(a.url)}
                >
                  <div className="empty-recent-title">{a.title}</div>
                  <div className="empty-recent-url">
                    {a.siteName || new URL(a.url).hostname}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
