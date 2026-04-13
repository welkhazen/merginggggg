import { useMemo, useState } from "react";
import { Sparkles, Lock, Zap, Crown, CheckCircle2, ArrowRight } from "lucide-react";
import { computeRawInsights } from "@/features/insights/insights-engine";
import { RAW_INSIGHTS_UI_CONFIG } from "@/features/insights/insights.config";
import type { ComputedInsight } from "@/features/insights/types";
import type { Poll } from "@/store/useRawStore";

interface RawInsightsPanelProps {
  polls: Poll[];
  votedPolls: Set<string>;
  votedOptions: Record<string, string>;
  avatarLevel: number;
  purchasedInsightIds: Set<string>;
  onPurchaseInsight: (insightId: string) => void;
}

function StatusPill({ insight }: { insight: ComputedInsight }) {
  if (insight.status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </span>
    );
  }

  if (insight.status === "locked-level") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-raw-border/40 bg-raw-black/60 px-2 py-0.5 text-[10px] text-raw-silver/50">
        <Lock className="h-3 w-3" /> Unlock at level {insight.unlockLevel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
      <Crown className="h-3 w-3" /> Premium ${insight.priceUsd}
    </span>
  );
}

export function RawInsightsPanel(props: RawInsightsPanelProps) {
  const [activeInsightId, setActiveInsightId] = useState<string | null>(null);

  const insights = useMemo(
    () =>
      computeRawInsights({
        polls: props.polls,
        votedPolls: props.votedPolls,
        votedOptions: props.votedOptions,
        avatarLevel: props.avatarLevel,
        purchasedInsightIds: props.purchasedInsightIds,
      }),
    [props.polls, props.votedPolls, props.votedOptions, props.avatarLevel, props.purchasedInsightIds]
  );

  const activeInsight = insights.find((item) => item.id === activeInsightId) ?? insights[0];
  const unlockedCount = insights.filter((item) => item.status === "ready").length;
  const nextUnlock = insights.find((item) => item.status === "locked-level");

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-raw-gold/60">
              <Sparkles className="h-3.5 w-3.5" /> {RAW_INSIGHTS_UI_CONFIG.sectionLabel}
            </p>
            <h2 className="mt-2 font-display text-xl text-raw-text">{RAW_INSIGHTS_UI_CONFIG.title}</h2>
            <p className="mt-1 text-xs text-raw-silver/50">{RAW_INSIGHTS_UI_CONFIG.subtitle}</p>
          </div>
          <div className="rounded-xl border border-raw-border/40 bg-raw-black/40 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.22em] text-raw-silver/45">{RAW_INSIGHTS_UI_CONFIG.coverageLabel}</p>
            <p className="mt-1 text-sm text-raw-text">{unlockedCount}/{insights.length} unlocked</p>
          </div>
        </div>

        {nextUnlock && (
          <div className="mt-4 rounded-xl border border-raw-border/35 bg-raw-black/35 px-4 py-3 text-xs text-raw-silver/60">
            Next unlock: <span className="text-raw-text">{nextUnlock.name}</span> at level {nextUnlock.unlockLevel}.
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-3">
          {insights.map((insight) => {
            const selected = insight.id === activeInsight.id;
            return (
              <button
                key={insight.id}
                onClick={() => setActiveInsightId(insight.id)}
                className={`w-full rounded-xl border bg-gradient-to-br p-4 text-left transition-all ${
                  selected
                    ? `${insight.theme.cardGlow} ${insight.theme.softSurface} border-raw-gold/40`
                    : "border-raw-border/40 from-raw-surface/25 via-transparent to-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-raw-silver/50">{insight.badge}</p>
                    <p className="mt-1 font-display text-base text-raw-text">{insight.name}</p>
                    <p className="mt-1 text-xs text-raw-silver/45">{insight.description}</p>
                  </div>
                  <StatusPill insight={insight} />
                </div>
              </button>
            );
          })}
        </div>

        <div className={`rounded-2xl border bg-gradient-to-br p-5 ${activeInsight.theme.cardGlow} ${activeInsight.theme.accentBorder}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`text-[10px] uppercase tracking-[0.22em] ${activeInsight.theme.accentText}`}>{activeInsight.badge}</p>
              <h3 className="mt-1 font-display text-lg text-raw-text">{activeInsight.name}</h3>
              <p className="mt-1 text-xs text-raw-silver/50">{activeInsight.premiumTagline}</p>
            </div>
            <StatusPill insight={activeInsight} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-raw-border/35 bg-raw-black/35 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-raw-silver/45">{RAW_INSIGHTS_UI_CONFIG.scoreLabel}</p>
              <p className="mt-1 text-xl font-semibold text-raw-text">{activeInsight.score}/100</p>
            </div>
            <div className="rounded-xl border border-raw-border/35 bg-raw-black/35 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-raw-silver/45">{RAW_INSIGHTS_UI_CONFIG.confidenceLabel}</p>
              <p className="mt-1 text-xl font-semibold text-raw-text">{activeInsight.confidence}%</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-raw-border/35 bg-raw-black/35 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-raw-silver/45">{RAW_INSIGHTS_UI_CONFIG.reportLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-raw-silver/80">
              {activeInsight.status === "ready" ? activeInsight.narrative : RAW_INSIGHTS_UI_CONFIG.lockedReportPreview}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeInsight.status === "locked-level" ? (
              <button
                disabled
                className="inline-flex items-center gap-2 rounded-lg border border-raw-border/30 bg-raw-black/40 px-3 py-2 text-xs text-raw-silver/40"
              >
                <Lock className="h-3.5 w-3.5" /> Reach level {activeInsight.unlockLevel}
              </button>
            ) : activeInsight.status === "locked-premium" ? (
              <button
                onClick={() => props.onPurchaseInsight(activeInsight.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/20"
              >
                <Crown className="h-3.5 w-3.5" /> {RAW_INSIGHTS_UI_CONFIG.purchaseButtonLabel} · ${activeInsight.priceUsd}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                <Zap className="h-3.5 w-3.5" /> {RAW_INSIGHTS_UI_CONFIG.activeButtonLabel}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] text-raw-silver/45">
              See how your identity signal evolves <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
