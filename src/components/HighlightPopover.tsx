import { HIGHLIGHT_COLORS } from "@/lib/highlights";

interface Props {
  x: number;
  y: number;
  onPick: (color: string) => void;
}

export function HighlightPopover({ x, y, onPick }: Props) {
  return (
    <div
      className="fixed z-50 flex gap-1 rounded-full border border-border bg-card px-2 py-1.5 shadow-lg"
      style={{ left: x, top: y, transform: "translate(-50%, -120%)" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c.value}
          aria-label={c.name}
          title={c.name}
          onClick={() => onPick(c.value)}
          className="h-5 w-5 rounded-full border border-black/10 transition-transform hover:scale-110"
          style={{ backgroundColor: c.bg }}
        />
      ))}
    </div>
  );
}
