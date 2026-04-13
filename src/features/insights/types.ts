import type { Poll } from "@/store/useRawStore";

export interface InsightColorTheme {
  cardGlow: string;
  accentText: string;
  accentBorder: string;
  softSurface: string;
}

export interface InsightNarrativeTemplate {
  low: string;
  medium: string;
  high: string;
}

export interface InsightSignalContribution {
  pollId: string;
  optionId: string;
  value: number;
}

export interface InsightScoringRule {
  baseline: number;
  completionWeight: number;
  maxCompletionBonus: number;
  signalMap: InsightSignalContribution[];
}

export interface RawInsightDefinition {
  id: string;
  order: number;
  name: string;
  description: string;
  badge: string;
  premiumTagline: string;
  isFree?: boolean;
  unlockLevel: number;
  priceUsd: number;
  confidenceFloor: number;
  scoring: InsightScoringRule;
  reportTemplate: InsightNarrativeTemplate;
  theme: InsightColorTheme;
}

export interface RawInsightsUiConfig {
  sectionLabel: string;
  title: string;
  subtitle: string;
  coverageLabel: string;
  scoreLabel: string;
  confidenceLabel: string;
  reportLabel: string;
  lockedReportPreview: string;
  purchaseButtonLabel: string;
  activeButtonLabel: string;
}

export interface InsightComputationContext {
  polls: Poll[];
  votedPolls: Set<string>;
  votedOptions: Record<string, string>;
  avatarLevel: number;
  purchasedInsightIds: Set<string>;
}

export interface ComputedInsight {
  id: string;
  name: string;
  description: string;
  badge: string;
  premiumTagline: string;
  unlockLevel: number;
  priceUsd: number;
  score: number;
  confidence: number;
  narrative: string;
  status: "locked-level" | "locked-premium" | "ready";
  theme: InsightColorTheme;
}
