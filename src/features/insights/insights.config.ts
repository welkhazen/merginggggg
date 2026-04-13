import type { RawInsightDefinition, RawInsightsUiConfig } from "./types";

export const RAW_INSIGHTS_UI_CONFIG: RawInsightsUiConfig = {
  sectionLabel: "raW Insights",
  title: "Premium Identity Signals",
  subtitle: "Dynamic, non-clinical reflection reports powered by your poll behavior.",
  coverageLabel: "Insight Coverage",
  scoreLabel: "Signal Score",
  confidenceLabel: "Confidence",
  reportLabel: "Current Report",
  lockedReportPreview:
    "This report is hidden until unlocked. Continue voting to raise confidence and reveal stronger identity signals.",
  purchaseButtonLabel: "Unlock Insight",
  activeButtonLabel: "Insight Active",
};

export const RAW_INSIGHTS_CONFIG: RawInsightDefinition[] = [
  {
    id: "signal-discipline",
    order: 1,
    name: "Signal Discipline",
    description: "How consistently your responses align with deliberate, conviction-driven choices.",
    badge: "Core Pattern",
    premiumTagline: "Tracks your consistency signature over time.",
    isFree: true,
    unlockLevel: 1,
    priceUsd: 0,
    confidenceFloor: 40,
    scoring: {
      baseline: 45,
      completionWeight: 0.45,
      maxCompletionBonus: 22,
      signalMap: [
        { pollId: "poll-1", optionId: "p1-yes", value: 12 },
        { pollId: "poll-2", optionId: "p2-no", value: 8 },
        { pollId: "poll-3", optionId: "p3-yes", value: 10 },
      ],
    },
    reportTemplate: {
      low: "Your signal is exploratory right now. You're still testing different sides before locking into a personal operating stance.",
      medium: "Your signal shows balanced discipline. You can hold nuance while still leaning into a stable identity pattern.",
      high: "Your signal is highly disciplined. You express strong directional conviction across multiple behavioral prompts.",
    },
    theme: {
      cardGlow: "from-amber-500/15 via-transparent to-transparent",
      accentText: "text-amber-300",
      accentBorder: "border-amber-400/40",
      softSurface: "bg-amber-500/8",
    },
  },
  {
    id: "growth-friction-index",
    order: 2,
    name: "Growth Friction Index",
    description: "Measures your tendency to choose stretch and discomfort versus immediate comfort.",
    badge: "Momentum",
    premiumTagline: "Reveals how you negotiate challenge and expansion.",
    unlockLevel: 2,
    priceUsd: 6,
    confidenceFloor: 45,
    scoring: {
      baseline: 38,
      completionWeight: 0.52,
      maxCompletionBonus: 28,
      signalMap: [
        { pollId: "poll-3", optionId: "p3-yes", value: 24 },
        { pollId: "poll-1", optionId: "p1-yes", value: 9 },
        { pollId: "poll-2", optionId: "p2-yes", value: -8 },
      ],
    },
    reportTemplate: {
      low: "Your growth signal is in protection mode. You're prioritizing stability and conserving energy before major expansion.",
      medium: "Your growth signal is adaptive. You can absorb challenge, but you also pace yourself with intentional boundaries.",
      high: "Your growth signal is high velocity. You repeatedly choose discomfort when it serves future identity upgrades.",
    },
    theme: {
      cardGlow: "from-emerald-500/15 via-transparent to-transparent",
      accentText: "text-emerald-300",
      accentBorder: "border-emerald-400/40",
      softSurface: "bg-emerald-500/8",
    },
  },
  {
    id: "collective-impact-lens",
    order: 3,
    name: "Collective Impact Lens",
    description: "Maps whether your choices prioritize individual agency or broader social impact framing.",
    badge: "Community Signal",
    premiumTagline: "Highlights how your perspective affects shared systems.",
    unlockLevel: 3,
    priceUsd: 8,
    confidenceFloor: 50,
    scoring: {
      baseline: 42,
      completionWeight: 0.4,
      maxCompletionBonus: 24,
      signalMap: [
        { pollId: "poll-2", optionId: "p2-yes", value: 18 },
        { pollId: "poll-2", optionId: "p2-no", value: -10 },
        { pollId: "poll-1", optionId: "p1-no", value: 8 },
      ],
    },
    reportTemplate: {
      low: "Your lens is currently self-directed. You optimize around personal clarity before collective positioning.",
      medium: "Your lens is blended. You weigh personal autonomy while still accounting for wider social consequences.",
      high: "Your lens is strongly collective. Your response pattern repeatedly centers ecosystem-level outcomes.",
    },
    theme: {
      cardGlow: "from-sky-500/15 via-transparent to-transparent",
      accentText: "text-sky-300",
      accentBorder: "border-sky-400/40",
      softSurface: "bg-sky-500/8",
    },
  },
];
