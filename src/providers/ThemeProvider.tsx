import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light";

export type AccentPresetId =
  | "gold"
  | "coral"
  | "rose"
  | "crimson"
  | "violet"
  | "indigo"
  | "ocean"
  | "cyan"
  | "emerald"
  | "lime";

interface AccentPreset {
  id: AccentPresetId;
  label: string;
  rgb: string;
  shadowRgb: string;
  hsl: string;
}

interface ThemeContextValue {
  mode: ThemeMode;
  accent: AccentPresetId;
  accentPresets: AccentPreset[];
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentPresetId) => void;
}

const THEME_MODE_STORAGE_KEY = "raw.theme.mode.v1";
const THEME_ACCENT_STORAGE_KEY = "raw.theme.accent.v1";

const ACCENT_PRESETS: AccentPreset[] = [
  { id: "gold", label: "Gold", rgb: "241 196 45", shadowRgb: "182 126 14", hsl: "47 88% 56%" },
  { id: "coral", label: "Coral", rgb: "255 125 92", shadowRgb: "213 88 54", hsl: "11 100% 68%" },
  { id: "rose", label: "Rose", rgb: "244 114 182", shadowRgb: "190 61 128", hsl: "330 82% 70%" },
  { id: "crimson", label: "Crimson", rgb: "248 113 113", shadowRgb: "191 54 54", hsl: "0 90% 71%" },
  { id: "violet", label: "Violet", rgb: "167 139 250", shadowRgb: "114 82 204", hsl: "255 92% 76%" },
  { id: "indigo", label: "Indigo", rgb: "129 140 248", shadowRgb: "78 92 212", hsl: "235 89% 74%" },
  { id: "ocean", label: "Ocean", rgb: "56 189 248", shadowRgb: "18 123 186", hsl: "198 93% 60%" },
  { id: "cyan", label: "Cyan", rgb: "45 212 191", shadowRgb: "14 148 136", hsl: "172 67% 50%" },
  { id: "emerald", label: "Emerald", rgb: "52 211 153", shadowRgb: "5 150 105", hsl: "158 64% 52%" },
  { id: "lime", label: "Lime", rgb: "163 230 53", shadowRgb: "101 163 13", hsl: "83 78% 55%" },
];

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return storedMode === "light" ? "light" : "dark";
}

function getStoredAccent(): AccentPresetId {
  if (typeof window === "undefined") {
    return "gold";
  }

  const storedAccent = window.localStorage.getItem(THEME_ACCENT_STORAGE_KEY) as AccentPresetId | null;
  return ACCENT_PRESETS.some((preset) => preset.id === storedAccent) ? storedAccent! : "gold";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [accent, setAccent] = useState<AccentPresetId>(() => getStoredAccent());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    const selectedAccent = ACCENT_PRESETS.find((preset) => preset.id === accent) ?? ACCENT_PRESETS[0];

    root.classList.toggle("theme-light", mode === "light");
    root.dataset.themeMode = mode;
    root.dataset.themeAccent = accent;
    root.style.setProperty("--raw-accent", selectedAccent.rgb);
    root.style.setProperty("--raw-accent-shadow", selectedAccent.shadowRgb);
    root.style.setProperty("--primary", selectedAccent.hsl);
    root.style.setProperty("--accent", selectedAccent.hsl);
    root.style.setProperty("--ring", selectedAccent.hsl);
    root.style.setProperty("--sidebar-primary", selectedAccent.hsl);
    root.style.setProperty("--sidebar-ring", selectedAccent.hsl);

    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    window.localStorage.setItem(THEME_ACCENT_STORAGE_KEY, accent);
  }, [accent, mode]);

  const value = useMemo(
    () => ({ mode, accent, accentPresets: ACCENT_PRESETS, setMode, setAccent }),
    [accent, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}