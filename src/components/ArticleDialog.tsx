import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db, hashUrl, type Article } from "@/lib/db";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  article?: Article | null; // If provided, we are editing. Otherwise, creating.
  onSave: (article: Article) => void;
}

export function ArticleDialog({ open, onOpenChange, article, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [byline, setByline] = useState("");
  const [siteName, setSiteName] = useState("");
  const [url, setUrl] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  // Sync state with article when editing
  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setByline(article.byline || "");
      setSiteName(article.siteName || "");
      setUrl(article.url || "");
      setExcerpt(article.excerpt || "");
      
      // Try to clean up HTML content to plain text for easier editing
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = article.contentHTML;
      // If it contains paragraphs, join them with double newlines
      const paragraphs = tempDiv.querySelectorAll("p");
      if (paragraphs.length > 0) {
        const textContent = Array.from(paragraphs)
          .map((p) => p.innerText.trim())
          .filter(Boolean)
          .join("\n\n");
        setContent(textContent);
      } else {
        setContent(tempDiv.innerText || "");
      }
    } else {
      setTitle("");
      setByline("");
      setSiteName("");
      setUrl("");
      setExcerpt("");
      setContent("");
    }
  }, [article, open]);

  // Convert plain text with newlines to clean HTML paragraphs
  function formatContentToHTML(text: string): string {
    if (text.includes("<p>") || text.includes("</div>") || text.includes("<br>")) {
      return text; // Already looks like HTML
    }
    return text
      .split(/\n\s*\n/)
      .filter((para) => para.trim().length > 0)
      .map((para) => `<p>${para.replace(/\n/g, "<br />")}</p>`)
      .join("\n");
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Article Title is required.");
      return;
    }
    if (!content.trim()) {
      toast.error("Article Content is required.");
      return;
    }

    const finalUrl = url.trim() || `local://${Date.now()}`;
    const id = article?.id || hashUrl(finalUrl) + `_${Date.now().toString(36)}`;
    const finalContentHTML = formatContentToHTML(content);

    const savedArticle: Article = {
      id,
      url: finalUrl,
      title: title.trim(),
      byline: byline.trim() || undefined,
      siteName: siteName.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
      contentHTML: finalContentHTML,
      publishedTime: article?.publishedTime || new Date().toISOString(),
      timestamp: article?.timestamp || Date.now(),
    };

    try {
      await db.articles.put(savedArticle);
      onSave(savedArticle);
      toast.success(article ? "Article updated successfully" : "Custom article created");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to save article");
      console.error(e);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>{article ? "Edit Article" : "Create Custom Article"}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="article-title" className="text-xs font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="article-title"
              placeholder="The future of reading interfaces..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="article-author" className="text-xs font-semibold">Author / Byline</Label>
              <Input
                id="article-author"
                placeholder="Jane Doe"
                value={byline}
                onChange={(e) => setByline(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="article-site" className="text-xs font-semibold">Publisher / Site Name</Label>
              <Input
                id="article-site"
                placeholder="Medium"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-url" className="text-xs font-semibold">Source URL (Optional)</Label>
            <Input
              id="article-url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-excerpt" className="text-xs font-semibold">Excerpt / Brief Summary</Label>
            <Input
              id="article-excerpt"
              placeholder="A short description of the article..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="article-content" className="text-xs font-semibold">
              Content <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="article-content"
              placeholder="Paste article paragraphs here. Double line breaks will become beautiful paragraphs in the reader."
              className="min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
