export interface AvatarTheme {
  bg: string;
  figure: string;
  ring: string;
  glow: string;
  name: string;
}

export const LEVEL_THEMES: AvatarTheme[] = [
  { bg: "#1a1a1e", figure: "#4a4a52", ring: "#333338", glow: "none", name: "Shadow Form" },
  { bg: "#1a1a1e", figure: "#5a5a62", ring: "#3a3a40", glow: "none", name: "Dim Echo" },
  { bg: "#1a1c22", figure: "#4466aa", ring: "#334488", glow: "none", name: "Steel Pulse" },
  { bg: "#1a1c24", figure: "#5577bb", ring: "#3355aa", glow: "none", name: "Deep Current" },
  { bg: "#1c1a24", figure: "#7766cc", ring: "#5544aa", glow: "none", name: "Violet Drift" },
  { bg: "#1a1c26", figure: "#4488dd", ring: "#2266cc", glow: "#2266cc40", name: "Neon Nebula" },
  { bg: "#1e1a18", figure: "#8B7355", ring: "#6B5335", glow: "none", name: "Bronze Ember" },
  { bg: "#1e1c18", figure: "#C4A76C", ring: "#9B8545", glow: "#C4A76C30", name: "Gold Whisper" },
  { bg: "#1e1c16", figure: "#D4B77C", ring: "#B8941A", glow: "#D4B77C40", name: "Aureate Mind" },
  { bg: "#1e1c14", figure: "#F1C42D", ring: "#D4A81A", glow: "#F1C42D50", name: "Pure Radiance" },
];

export function getAvatarTheme(level: number): AvatarTheme {
  return LEVEL_THEMES[level - 1] || LEVEL_THEMES[0];
}
