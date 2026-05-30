import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Download, Library, Loader2, Moon, Sun, Type } from "lucide-react";
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
import { extractArticle } from "@/lib/extractor";
import { db, getSetting, setSetting, type Article } from "@/lib/db";

export const Route = createFileRoute("/")({
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
});

type Theme = "light" | "dark" | "sepia";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "sepia");
  if (theme === "dark") root.classList.add("dark");
  if (theme === "sepia") root.classList.add("sepia");
}

function Index() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [theme, setTheme] = useState<Theme>("light");
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");

  // Load settings on mount
  useEffect(() => {
    (async () => {
      const t = await getSetting<Theme>("theme", "light");
      const fs = await getSetting<number>("fontSize", 18);
      const lh = await getSetting<number>("lineHeight", 1.7);
      const ff = await getSetting<"serif" | "sans">("fontFamily", "serif");
      setTheme(t);
      setFontSize(fs);
      setLineHeight(lh);
      setFontFamily(ff);
      applyTheme(t);
    })();
  }, []);

  useEffect(() => {
    applyTheme(theme);
    setSetting("theme", theme);
  }, [theme]);

  useEffect(() => {
    setSetting("fontSize", fontSize);
  }, [fontSize]);
  useEffect(() => {
    setSetting("lineHeight", lineHeight);
  }, [lineHeight]);
  useEffect(() => {
    setSetting("fontFamily", fontFamily);
  }, [fontFamily]);

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

  async function exportPDF() {
    if (!article) return;
    const el = document.getElementById("reader-article");
    if (!el) return;
    const html2pdf = (await import("html2pdf.js")).default;
    toast.message("Preparing PDF…");
    await html2pdf()
      .set({
        margin: [12, 12, 12, 12],
        filename: `${article.title.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      } as Parameters<ReturnType<typeof html2pdf>["set"]>[0])
      .from(el)
      .save();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <div className="flex items-center gap-2 pr-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            <span className="hidden sm:inline">Readable</span>
          </div>
          <form onSubmit={handleFetch} className="flex flex-1 gap-2">
            <Input
              type="text"
              placeholder="Paste an article URL…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Read"
              )}
            </Button>
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Typography">
                <Type className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Font</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFontFamily("serif")}>
                Serif {fontFamily === "serif" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFontFamily("sans")}>
                Sans-serif {fontFamily === "sans" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Font size</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFontSize(16)}>
                Small {fontSize === 16 && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFontSize(18)}>
                Medium {fontSize === 18 && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFontSize(21)}>
                Large {fontSize === 21 && "✓"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Line spacing</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setLineHeight(1.5)}>
                Compact {lineHeight === 1.5 && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLineHeight(1.7)}>
                Normal {lineHeight === 1.7 && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLineHeight(2)}>
                Relaxed {lineHeight === 2 && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Theme">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light {theme === "light" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark {theme === "dark" && "✓"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("sepia")}>
                Sepia {theme === "sepia" && "✓"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Saved"
            onClick={() => setDrawerOpen(true)}
          >
            <Library className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Export PDF"
            onClick={exportPDF}
            disabled={!article}
          >
            <Download className="h-4 w-4" />
          </Button>
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
          />
        ) : (
          <EmptyState onPick={(u) => { setUrl(u); }} />
        )}
      </main>

      <SavedDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpen={(a) => setArticle(a)}
        refreshKey={refreshKey}
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
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Read anything, distraction-free.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Paste any article URL above. Readable strips away ads, navs, and clutter so
        you can focus on what matters — then highlight, save offline, or export to PDF.
      </p>
      {recent.length > 0 && (
        <div className="mt-12 text-left">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Recent
          </h2>
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {recent.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => onPick(a.url)}
                  className="block w-full px-4 py-3 text-left hover:bg-accent"
                >
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.url}
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
