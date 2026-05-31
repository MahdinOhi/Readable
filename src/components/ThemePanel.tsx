import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type ThemeName =
  | "light"
  | "dark"
  | "sepia"
  | "midnight"
  | "forest"
  | "ocean"
  | "rose"
  | "slate"
  | "solarized"
  | "custom";

export interface CustomColors {
  background: string;
  foreground: string;
}

interface PresetTheme {
  name: ThemeName;
  label: string;
  bg: string;
  fg: string;
  accent: string;
  description: string;
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    name: "light",
    label: "Light",
    bg: "#ffffff",
    fg: "#1a1a2e",
    accent: "#e8e8f0",
    description: "Clean white canvas",
  },
  {
    name: "dark",
    label: "Dark",
    bg: "#0f1117",
    fg: "#e8e8f5",
    accent: "#1e2030",
    description: "Easy on the eyes",
  },
  {
    name: "sepia",
    label: "Sepia",
    bg: "#f5efe0",
    fg: "#3d2b1f",
    accent: "#ede3d0",
    description: "Warm paper tone",
  },
  {
    name: "midnight",
    label: "Midnight",
    bg: "#0d0d1a",
    fg: "#c8c8e8",
    accent: "#14142a",
    description: "Deep indigo night",
  },
  {
    name: "forest",
    label: "Forest",
    bg: "#0f1a12",
    fg: "#c8e8cc",
    accent: "#162018",
    description: "Lush emerald green",
  },
  {
    name: "ocean",
    label: "Ocean",
    bg: "#0a1628",
    fg: "#b8d4f0",
    accent: "#0f1e38",
    description: "Deep sea blue",
  },
  {
    name: "rose",
    label: "Rose",
    bg: "#fdf2f4",
    fg: "#3d1a22",
    accent: "#f9e4e8",
    description: "Soft rose petal",
  },
  {
    name: "slate",
    label: "Slate",
    bg: "#1e2433",
    fg: "#d0d8e8",
    accent: "#252d40",
    description: "Cool blue-grey",
  },
  {
    name: "solarized",
    label: "Solarized",
    bg: "#002b36",
    fg: "#839496",
    accent: "#073642",
    description: "Classic Solarized",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentTheme: ThemeName;
  customColors: CustomColors;
  onThemeChange: (theme: ThemeName) => void;
  onCustomColorsChange: (colors: CustomColors) => void;
}

export function ThemePanel({
  open,
  onOpenChange,
  currentTheme,
  customColors,
  onThemeChange,
  onCustomColorsChange,
}: Props) {
  const [localBg, setLocalBg] = useState(customColors.background);
  const [localFg, setLocalFg] = useState(customColors.foreground);

  function applyCustom() {
    onCustomColorsChange({ background: localBg, foreground: localFg });
    onThemeChange("custom");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto theme-panel">
        <SheetHeader className="theme-panel-header">
          <div className="theme-panel-title-row">
            <Palette className="theme-panel-icon" />
            <SheetTitle className="theme-panel-title">Appearance</SheetTitle>
          </div>
          <p className="theme-panel-subtitle">
            Choose a preset or craft your own custom theme.
          </p>
        </SheetHeader>

        {/* Preset Themes Grid */}
        <section className="theme-section">
          <h3 className="theme-section-heading">Preset Themes</h3>
          <div className="theme-grid">
            {PRESET_THEMES.map((t) => (
              <button
                key={t.name}
                className={`theme-swatch-btn ${currentTheme === t.name ? "theme-swatch-btn--active" : ""}`}
                onClick={() => onThemeChange(t.name)}
                aria-label={`Switch to ${t.label} theme`}
                title={t.description}
              >
                <div
                  className="theme-swatch-preview"
                  style={{ background: t.bg, borderColor: t.accent }}
                >
                  <span
                    className="theme-swatch-lines"
                    style={{ color: t.fg }}
                  >
                    <span style={{ background: t.fg, opacity: 0.85 }} />
                    <span style={{ background: t.fg, opacity: 0.5, width: "70%" }} />
                    <span style={{ background: t.fg, opacity: 0.35, width: "85%" }} />
                  </span>
                  {currentTheme === t.name && (
                    <span className="theme-swatch-check">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="theme-swatch-label">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Custom Theme Builder */}
        <section className="theme-section">
          <h3 className="theme-section-heading">Custom Colors</h3>
          <p className="theme-section-desc">
            Pick any background and text color to build your own theme.
          </p>
          <div className="custom-color-grid">
            <div className="custom-color-row">
              <label className="custom-color-label" htmlFor="bg-picker">
                Background
              </label>
              <div className="custom-color-input-wrap">
                <div
                  className="custom-color-swatch"
                  style={{ background: localBg }}
                />
                <input
                  id="bg-picker"
                  type="color"
                  value={localBg}
                  onChange={(e) => setLocalBg(e.target.value)}
                  className="custom-color-picker"
                />
                <input
                  type="text"
                  value={localBg}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setLocalBg(v);
                  }}
                  className="custom-color-hex"
                  maxLength={7}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="custom-color-row">
              <label className="custom-color-label" htmlFor="fg-picker">
                Text
              </label>
              <div className="custom-color-input-wrap">
                <div
                  className="custom-color-swatch"
                  style={{ background: localFg }}
                />
                <input
                  id="fg-picker"
                  type="color"
                  value={localFg}
                  onChange={(e) => setLocalFg(e.target.value)}
                  className="custom-color-picker"
                />
                <input
                  type="text"
                  value={localFg}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setLocalFg(v);
                  }}
                  className="custom-color-hex"
                  maxLength={7}
                  placeholder="#1a1a2e"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="custom-preview"
            style={{ background: localBg, color: localFg }}
          >
            <p className="custom-preview-title">The quick brown fox</p>
            <p className="custom-preview-body" style={{ opacity: 0.7 }}>
              jumps over the lazy dog — preview your theme here.
            </p>
          </div>

          <Button
            className="custom-apply-btn"
            onClick={applyCustom}
            id="apply-custom-theme-btn"
          >
            <Palette size={14} />
            Apply Custom Theme
          </Button>
        </section>
      </SheetContent>
    </Sheet>
  );
}
