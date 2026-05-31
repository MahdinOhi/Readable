import { HIGHLIGHT_COLORS } from "@/lib/highlights";

interface Props {
  x: number;
  y: number;
  onPick: (color: string) => void;
}

export function HighlightPopover({ x, y, onPick }: Props) {
  // Clamp x so the popover never overflows the viewport
  const safeX = Math.max(80, Math.min(x, window.innerWidth - 80));

  return (
    <div
      className="fixed z-50 flex gap-1.5 rounded-full border border-border bg-card px-2.5 py-2 shadow-xl"
      style={{ left: safeX, top: y, transform: "translate(-50%, -120%)" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c.value}
          aria-label={c.name}
          title={c.name}
          onClick={() => onPick(c.value)}
          className="h-6 w-6 rounded-full border border-black/15 transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: c.bg }}
        />
      ))}
    </div>
  );
}
