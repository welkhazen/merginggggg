import { GlareCard } from "@/components/ui/glare-card";
import { Brain, Heart, Eye, Ghost, Lock, Sparkles } from "lucide-react";

interface InsightItem {
  id: string;
  title: string;
  description: string;
  icon: typeof Brain;
  requiredPolls: number;
  requiredLevel: number;
}

const insightItems: InsightItem[] = [
  {
    id: "myers-briggs",
    title: "Myers-Briggs",
    description: "Discover your personality type across 4 key dimensions of how you see the world.",
    icon: Brain,
    requiredPolls: 3,
    requiredLevel: 1,
  },
  {
    id: "big-five",
    title: "Big Five Profile",
    description: "Measure your openness, conscientiousness, extraversion, agreeableness, and emotional range.",
    icon: Heart,
    requiredPolls: 4,
    requiredLevel: 1,
  },
  {
    id: "emotional-intelligence",
    title: "Emotional Intelligence",
    description: "Understand how you process emotions, empathy, and interpersonal cues under pressure.",
    icon: Eye,
    requiredPolls: 6,
    requiredLevel: 2,
  },
  {
    id: "shadow-self",
    title: "Shadow Self",
    description: "Reveal hidden patterns, blind spots, and traits that surface in difficult moments.",
    icon: Ghost,
    requiredPolls: 8,
    requiredLevel: 3,
  },
  {
    id: "decision-fingerprint",
    title: "Decision Fingerprint",
    description: "Map your decision style: instinctive, strategic, reflective, or adaptive.",
    icon: Sparkles,
    requiredPolls: 10,
    requiredLevel: 4,
  },
  {
    id: "identity-arc",
    title: "Identity Arc",
    description: "Track how your personality signal changes over time as your answers evolve.",
    icon: Brain,
    requiredPolls: 12,
    requiredLevel: 5,
  },
];

export function DashboardMarketplace({
  avatarLevel,
  pollsAnswered,
}: {
  avatarLevel: number;
  pollsAnswered: number;
}) {
  const unlockedCount = insightItems.filter(
    (item) => pollsAnswered >= item.requiredPolls && avatarLevel >= item.requiredLevel
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-raw-text">Personality Insights</h1>
        <p className="mt-2 text-sm text-raw-silver/40">
          Your answers unlock deeper identity reports. Keep participating to reveal your full profile.
        </p>
      </div>

      <div className="rounded-2xl border border-raw-border/40 bg-gradient-to-r from-raw-surface/50 to-raw-black/40 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-raw-silver/40">Poll Coverage</p>
          <p className="text-2xl font-bold text-raw-gold mt-0.5">
            {pollsAnswered}
            <span className="ml-1 text-sm font-normal text-raw-gold/60">polls answered</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-raw-silver/40">Unlocked Reports</p>
          <p className="text-2xl font-bold text-raw-text mt-0.5">{unlockedCount}/{insightItems.length}</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {insightItems.map((item) => {
          const Icon = item.icon;
          const isUnlocked = pollsAnswered >= item.requiredPolls && avatarLevel >= item.requiredLevel;
          return (
            <GlareCard key={item.id}>
              <div
                className={`rounded-2xl border p-6 h-full relative overflow-hidden ${
                  isUnlocked ? "border-raw-border/45 bg-raw-surface/35" : "border-raw-border/25 bg-raw-black/45"
                }`}
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.11) 1px, transparent 1px), linear-gradient(160deg, rgba(255,255,255,0.02), rgba(0,0,0,0.15))",
                  backgroundSize: "10px 10px, auto",
                }}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 rounded-2xl bg-raw-black/45 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="rounded-full border border-raw-border/60 bg-raw-surface/70 px-4 py-2 text-center">
                      <p className="text-[11px] font-medium text-raw-silver/80">Locked</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-raw-surface/80 border border-raw-border/40 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-raw-silver/75" />
                  </div>
                  <div className={`rounded-full border px-3 py-1 ${
                    isUnlocked
                      ? "border-emerald-400/30 bg-emerald-500/10"
                      : "border-raw-border/50 bg-raw-surface/50"
                  }`}>
                    <span className={`text-[9px] font-medium ${isUnlocked ? "text-emerald-300" : "text-raw-silver/60"}`}>
                      {isUnlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-sm tracking-wide text-raw-text">{item.title}</h3>
                <p className="mt-2 text-xs text-raw-silver/45 leading-relaxed">{item.description}</p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-raw-silver/55">{pollsAnswered} polls answered</span>
                  {isUnlocked ? (
                    <button className="rounded-full border border-raw-gold/25 bg-raw-gold/[0.08] px-4 py-1.5 text-[11px] font-medium text-raw-gold/80">
                      View Report
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-[11px] text-raw-silver/45">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Lvl {item.requiredLevel} · {item.requiredPolls} polls</span>
                    </div>
                  )}
                </div>
              </div>
            </GlareCard>
          );
        })}
      </div>

      <div className="rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-8 text-center">
        <p className="font-display text-sm tracking-wide text-raw-silver/30">More insight models coming soon</p>
        <p className="mt-2 text-xs text-raw-silver/25">Attachment style, conflict pattern, leadership signal, and social energy index.</p>
      </div>
    </div>
  );
}
