import { useEffect, useState } from "react";
import { db, type Article } from "@/lib/db";
import {
  Grid,
  List,
  Search,
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Calendar,
  ExternalLink,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArticleDialog } from "./ArticleDialog";

interface Props {
  onSelectArticle: (article: Article) => void;
  refreshTrigger: number;
}

export function LibraryDashboard({ onSelectArticle, refreshTrigger }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  // Load articles from Dexie
  useEffect(() => {
    db.articles
      .orderBy("timestamp")
      .reverse()
      .toArray()
      .then((items) => {
        setArticles(items);
      });
  }, [refreshTrigger, localRefresh]);

  // Load saved view preference
  useEffect(() => {
    const saved = localStorage.getItem("library-view-mode");
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  function toggleViewMode(mode: "grid" | "list") {
    setViewMode(mode);
    localStorage.setItem("library-view-mode", mode);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this article and its highlights?")) {
      try {
        await db.articles.delete(id);
        await db.highlights.where("articleId").equals(id).delete();
        setLocalRefresh((k) => k + 1);
        toast.success("Article deleted");
      } catch (err) {
        toast.error("Failed to delete article");
        console.error(err);
      }
    }
  }

  function handleEdit(article: Article, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingArticle(article);
    setDialogOpen(true);
  }

  const filtered = articles.filter((a) => {
    const query = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(query) ||
      a.byline?.toLowerCase().includes(query) ||
      a.siteName?.toLowerCase().includes(query) ||
      a.excerpt?.toLowerCase().includes(query) ||
      a.url?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-10 lg:py-12">
      {/* Top dashboard action bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 pb-5 border-b border-border sm:mb-8 sm:pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">Your Library</h1>
          <p className="text-xs text-muted-foreground mt-0.5 sm:text-sm sm:mt-1">
            {articles.length} article{articles.length !== 1 && "s"} saved distraction-free
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Create custom article */}
          <Button
            onClick={() => {
              setEditingArticle(null);
              setDialogOpen(true);
            }}
            className="flex items-center gap-1.5 h-9 text-sm px-3"
            id="create-custom-article-btn"
          >
            <Plus size={15} />
            <span className="hidden xs:inline sm:inline">Create Custom</span>
            <span className="xs:hidden sm:hidden">New</span>
          </Button>

          {/* Toggle view buttons */}
          <div className="flex items-center border border-border rounded-md p-0.5 bg-muted">
            <button
              onClick={() => toggleViewMode("grid")}
              className={`p-1.5 rounded-sm transition-colors ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => toggleViewMode("list")}
              className={`p-1.5 rounded-sm transition-colors ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List view"
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {articles.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search saved articles by title, author, site or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      {/* Main dashboard content */}
      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-muted/30 border border-dashed border-border rounded-lg">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Your Library is empty</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
            Paste any article URL in the top bar to save it instantly, or write your own custom entry.
          </p>
          <Button
            onClick={() => {
              setEditingArticle(null);
              setDialogOpen(true);
            }}
            variant="outline"
            className="flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Create Custom Article</span>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No articles match your search criteria.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((a) => (
            <Card
              key={a.id}
              onClick={() => onSelectArticle(a)}
              className="flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer border border-border group overflow-hidden"
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="bg-muted px-2 py-0.5 rounded-full font-medium truncate max-w-[150px]">
                    {a.siteName || (a.url.startsWith("http") ? new URL(a.url).hostname : "Custom")}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Calendar size={11} />
                    {new Date(a.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <CardTitle className="text-base font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {a.title}
                </CardTitle>
                {a.byline && (
                  <CardDescription className="flex items-center gap-1 text-xs mt-1 truncate">
                    <User size={12} className="flex-shrink-0" />
                    <span>{a.byline}</span>
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="p-5 pt-0 pb-4 text-xs text-muted-foreground line-clamp-3">
                {a.excerpt || "No summary preview available."}
              </CardContent>

              <CardFooter className="p-5 pt-0 border-t border-border/50 flex items-center justify-between bg-muted/10">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[150px]">
                  {a.url.startsWith("http") && <ExternalLink size={10} />}
                  {a.url}
                </span>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleEdit(a, e)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit article"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(a.id, e)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete article"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="divide-y divide-border">
            {filtered.map((a) => (
              <div
                key={a.id}
                onClick={() => onSelectArticle(a)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-muted/40 cursor-pointer transition-colors group gap-2 sm:gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                      {a.siteName || (a.url.startsWith("http") ? new URL(a.url).hostname : "Custom")}
                    </span>
                    {a.byline && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <User size={10} />
                        {a.byline}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      · {new Date(a.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                    {a.title}
                  </h4>
                  {a.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {a.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => handleEdit(a, e)}
                    className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/40"
                    title="Edit article"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(a.id, e)}
                    className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-border/40"
                    title="Delete article"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRUD dialog */}
      <ArticleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editingArticle}
        onSave={() => {
          setLocalRefresh((k) => k + 1);
        }}
      />
    </div>
  );
}
