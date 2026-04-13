import { RAW_INSIGHTS_CONFIG } from "./insights.config";
import type {
  ComputedInsight,
  InsightComputationContext,
  InsightScoringRule,
  RawInsightDefinition,
} from "./types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

function resolvePollCoverage(rule: InsightScoringRule, answeredPollIds: Set<string>) {
  const scopedPolls = new Set(rule.signalMap.map((signal) => signal.pollId));
  if (scopedPolls.size === 0) return 0;

  let covered = 0;
  scopedPolls.forEach((pollId) => {
    if (answeredPollIds.has(pollId)) {
      covered += 1;
    }
  });

  return covered / scopedPolls.size;
}

function scoreFromVotes(rule: InsightScoringRule, context: InsightComputationContext) {
  const availablePollIds = new Set(context.polls.map((poll) => poll.id));
  const answeredPollIds = new Set(
    [...context.votedPolls].filter((pollId) => availablePollIds.has(pollId))
  );
  const completionRatio = resolvePollCoverage(rule, answeredPollIds);

  const signalValue = rule.signalMap.reduce((sum, signal) => {
    const selectedOption = context.votedOptions[signal.pollId];
    if (!selectedOption) return sum;
    return selectedOption === signal.optionId ? sum + signal.value : sum;
  }, 0);

  const completionBonus = completionRatio * rule.maxCompletionBonus * rule.completionWeight;
  const score = clamp(rule.baseline + signalValue + completionBonus);
  const confidence = clamp(completionRatio * 100);

  return { score, confidence };
}

function getNarrative(reportTemplate: RawInsightDefinition["reportTemplate"], score: number) {
  if (score < 35) return reportTemplate.low;
  if (score < 70) return reportTemplate.medium;
  return reportTemplate.high;
}

export function computeRawInsights(context: InsightComputationContext): ComputedInsight[] {
  return [...RAW_INSIGHTS_CONFIG]
    .sort((a, b) => a.order - b.order)
    .map((definition) => {
      const computed = scoreFromVotes(definition.scoring, context);
      const confidence = Math.max(computed.confidence, definition.confidenceFloor);

      const levelLocked = context.avatarLevel < definition.unlockLevel;
      const premiumLocked =
        !definition.isFree && !levelLocked && !context.purchasedInsightIds.has(definition.id);

      const status: ComputedInsight["status"] = levelLocked
        ? "locked-level"
        : premiumLocked
          ? "locked-premium"
          : "ready";

      return {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        badge: definition.badge,
        premiumTagline: definition.premiumTagline,
        unlockLevel: definition.unlockLevel,
        priceUsd: definition.priceUsd,
        score: computed.score,
        confidence,
        narrative: getNarrative(definition.reportTemplate, computed.score),
        status,
        theme: definition.theme,
      };
    });
}
