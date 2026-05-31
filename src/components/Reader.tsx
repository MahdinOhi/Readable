import { useEffect, useRef, useState } from "react";
import type { Article } from "@/lib/db";
import {
  applyHighlight,
  loadHighlights,
  saveHighlight,
} from "@/lib/highlights";
import { HighlightPopover } from "./HighlightPopover";
import { Edit2, Trash2 } from "lucide-react";

interface Props {
  article: Article;
  fontSize: number;
  lineHeight: number;
  fontFamily: "serif" | "sans";
  onEdit?: (article: Article) => void;
  onDelete?: (id: string) => void;
}

export function Reader({ article, fontSize, lineHeight, fontFamily, onEdit, onDelete }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<
    { x: number; y: number; range: Range } | null
  >(null);

  // Render content + restore highlights
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = article.contentHTML;
    loadHighlights(article.id).then((hs) => {
      if (!contentRef.current) return;
      hs.forEach((h) => applyHighlight(h, contentRef.current!));
    });
  }, [article.id, article.contentHTML]);

  // Selection handler
  useEffect(() => {
    function onUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPopover(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!contentRef.current?.contains(range.commonAncestorContainer)) {
        setPopover(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPopover(null);
        return;
      }
      setPopover({
        x: rect.left + rect.width / 2,
        y: rect.top,
        range: range.cloneRange(),
      });
    }
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
    };
  }, []);

  async function pickColor(color: string) {
    if (!popover || !contentRef.current) return;
    const h = await saveHighlight(
      article.id,
      popover.range,
      color,
      contentRef.current
    );
    if (h) applyHighlight(h, contentRef.current);
    window.getSelection()?.removeAllRanges();
    setPopover(null);
  }

  return (
    <article
      id="reader-article"
      className="mx-auto max-w-2xl px-6 py-12"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight,
        fontFamily:
          fontFamily === "serif"
            ? 'Georgia, "Iowan Old Style", "Palatino Linotype", serif'
            : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <header className="mb-8 border-b border-border pb-6 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl flex-1">
            {article.title}
          </h1>
          <div className="flex items-center gap-1.5 flex-shrink-0 print:hidden mt-1">
            {onEdit && (
              <button
                onClick={() => onEdit(article)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/40"
                title="Edit article"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(article.id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border border-border/40"
                title="Delete article"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {article.byline && <span>{article.byline}</span>}
          {article.byline && article.publishedTime && <span> · </span>}
          {article.publishedTime && (
            <span>{new Date(article.publishedTime).toLocaleDateString()}</span>
          )}
          {article.siteName && (
            <span> · {article.siteName}</span>
          )}
        </div>
      </header>
      <div
        ref={contentRef}
        className="reader-content text-foreground"
      />
      {popover && (
        <HighlightPopover x={popover.x} y={popover.y} onPick={pickColor} />
      )}
    </article>
  );
}
