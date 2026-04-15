import { CheckCircle2, Flame, Lock, Trophy } from "lucide-react";

interface DashboardChallengesProps {
  avatarLevel: number;
  pollsAnswered: number;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
}

const challengeDefinitions = [
  {
    id: "truth-seeker",
    title: "Truth Seeker",
    description: "Answer 3 polls today",
    target: 3,
  },
  {
    id: "pulse-rider",
    title: "Pulse Rider",
    description: "Answer 10 polls total",
    target: 10,
  },
  {
    id: "signal-builder",
    title: "Signal Builder",
    description: "Reach avatar level 5",
    target: 5,
  },
];

export function DashboardChallenges({
  avatarLevel,
  pollsAnswered,
  dailyAnsweredCount,
  dailyPollLimit,
}: DashboardChallengesProps) {
  const progressMap: Record<string, number> = {
    "truth-seeker": dailyAnsweredCount,
    "pulse-rider": pollsAnswered,
    "signal-builder": avatarLevel,
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl tracking-wide text-raw-text">Challenges</h1>
        <p className="text-sm text-raw-silver/45">
          Complete short daily missions to grow faster and unlock identity rewards.
        </p>
      </header>

      <section className="rounded-2xl border border-raw-border/35 bg-raw-black/35 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-raw-gold/65">Today</p>
            <p className="mt-1 text-sm text-raw-silver/70">
              {dailyAnsweredCount}/{dailyPollLimit} daily polls answered
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-raw-gold/30 bg-raw-gold/[0.08] px-3 py-1.5 text-xs text-raw-gold/80">
            <Flame className="h-3.5 w-3.5" /> 7 day streak
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {challengeDefinitions.map((challenge) => {
          const current = progressMap[challenge.id] ?? 0;
          const done = current >= challenge.target;
          const pct = Math.min(100, Math.round((current / challenge.target) * 100));

          return (
            <article
              key={challenge.id}
              className="rounded-2xl border border-raw-border/35 bg-gradient-to-br from-raw-surface/35 to-raw-black/40 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-raw-silver/45">Challenge</p>
                  <h2 className="mt-1 font-display text-lg text-raw-text">{challenge.title}</h2>
                  <p className="mt-2 text-xs text-raw-silver/55">{challenge.description}</p>
                </div>
                <div className="rounded-full border border-raw-border/40 bg-raw-black/35 p-2">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <Lock className="h-4 w-4 text-raw-silver/40" />
                  )}
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-raw-border/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-raw-gold/65 to-raw-gold transition-all"
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-raw-silver/50">
                {Math.min(current, challenge.target)}/{challenge.target} complete
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-raw-border/35 px-3 py-1 text-[11px] text-raw-silver/55">
                <Trophy className="h-3.5 w-3.5 text-raw-gold/60" />
                Reward: +{challenge.target * 10} XP
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
