import { useEffect, useState } from "react";
import { db, type Article } from "@/lib/db";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpen: (a: Article) => void;
  refreshKey: number;
}

export function SavedDrawer({ open, onOpenChange, onOpen, refreshKey }: Props) {
  const [items, setItems] = useState<Article[]>([]);

  useEffect(() => {
    if (!open) return;
    db.articles
      .orderBy("timestamp")
      .reverse()
      .toArray()
      .then(setItems);
  }, [open, refreshKey]);

  async function remove(id: string) {
    await db.articles.delete(id);
    await db.highlights.where("articleId").equals(id).delete();
    setItems((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Saved articles</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved articles yet.</p>
          )}
          {items.map((a) => (
            <div
              key={a.id}
              className="group flex items-start gap-2 rounded-md border border-border p-3 hover:bg-accent"
            >
              <button
                className="flex-1 text-left"
                onClick={() => {
                  onOpen(a);
                  onOpenChange(false);
                }}
              >
                <div className="font-medium leading-snug">{a.title}</div>
                <div className="mt-1 text-xs text-muted-foreground truncate">
                  {a.siteName || new URL(a.url).hostname}
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(a.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
