interface AvatarFigureProps {
  level: number;
  size?: "sm" | "md" | "lg" | "xl";
  selected?: boolean;
  className?: string;
}

// Level progression: grey → blue → purple → gold
const LEVEL_THEMES = [
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

const sizes = {
  sm: { outer: 48, inner: 36, face: 0.55 },
  md: { outer: 72, inner: 56, face: 0.6 },
  lg: { outer: 120, inner: 96, face: 0.65 },
  xl: { outer: 180, inner: 148, face: 0.65 },
};

export function AvatarFigure({ level, size = "md", selected = false, className = "" }: AvatarFigureProps) {
  const theme = LEVEL_THEMES[level - 1] || LEVEL_THEMES[0];
  const s = sizes[size];
  const cx = s.outer / 2;
  const cy = s.outer / 2;
  const r = s.inner / 2;
  const faceScale = s.face;

  // Goggle/face dimensions relative to center
  const eyeW = r * faceScale * 0.35;
  const eyeH = r * faceScale * 0.22;
  const eyeY = cy - r * 0.08;
  const eyeGap = r * faceScale * 0.12;
  const bridgeW = eyeGap;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={s.outer} height={s.outer} viewBox={`0 0 ${s.outer} ${s.outer}`}>
        {/* Glow ring for selected/high level */}
        {(selected || theme.glow !== "none") && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 3}
            fill="none"
            stroke={selected ? theme.ring : theme.ring}
            strokeWidth={selected ? 2 : 1}
            opacity={selected ? 0.9 : 0.4}
            filter={theme.glow !== "none" ? "url(#avatarGlow)" : undefined}
          />
        )}

        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill={theme.bg} />

        {/* Inner gradient overlay */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="url(#innerGrad)"
          opacity={0.3}
        />

        {/* Reflection/shine at bottom */}
        <ellipse
          cx={cx}
          cy={cy + r * 0.55}
          rx={r * 0.35}
          ry={r * 0.08}
          fill={theme.figure}
          opacity={0.25}
        />

        {/* Head silhouette */}
        <circle
          cx={cx}
          cy={cy - r * 0.05}
          r={r * faceScale * 0.45}
          fill={theme.figure}
          opacity={0.85}
        />

        {/* Body/shoulders */}
        <ellipse
          cx={cx}
          cy={cy + r * 0.45}
          rx={r * faceScale * 0.55}
          ry={r * faceScale * 0.3}
          fill={theme.figure}
          opacity={0.7}
        />

        {/* Goggle band */}
        <rect
          x={cx - eyeW - eyeGap / 2}
          y={eyeY - eyeH / 2}
          width={eyeW * 2 + eyeGap}
          height={eyeH}
          rx={eyeH / 2}
          fill={theme.bg}
          opacity={0.9}
        />

        {/* Left goggle lens */}
        <ellipse
          cx={cx - eyeGap / 2 - eyeW / 2}
          cy={eyeY}
          rx={eyeW / 2 + 1}
          ry={eyeH / 2 + 1}
          fill={theme.figure}
          opacity={0.6}
        />

        {/* Right goggle lens */}
        <ellipse
          cx={cx + eyeGap / 2 + eyeW / 2}
          cy={eyeY}
          rx={eyeW / 2 + 1}
          ry={eyeH / 2 + 1}
          fill={theme.figure}
          opacity={0.6}
        />

        {/* Goggle shine */}
        <ellipse
          cx={cx - eyeGap / 2 - eyeW / 2 - 1}
          cy={eyeY - 1}
          rx={eyeW / 5}
          ry={eyeH / 4}
          fill="#ffffff"
          opacity={0.15}
        />
        <ellipse
          cx={cx + eyeGap / 2 + eyeW / 2 - 1}
          cy={eyeY - 1}
          rx={eyeW / 5}
          ry={eyeH / 4}
          fill="#ffffff"
          opacity={0.15}
        />

        {/* Defs */}
        <defs>
          <radialGradient id="innerGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={theme.figure} stopOpacity={0.15} />
            <stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </radialGradient>
          {theme.glow !== "none" && (
            <filter id="avatarGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>
      </svg>
    </div>
  );
}

export function getAvatarTheme(level: number) {
  return LEVEL_THEMES[level - 1] || LEVEL_THEMES[0];
}

export { LEVEL_THEMES };
