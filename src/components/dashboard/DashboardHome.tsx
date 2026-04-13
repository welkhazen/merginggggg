import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { GlareCard } from "@/components/ui/glare-card";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import {
  Trophy,
  Flame,
  MessageCircle,
  Target,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import type { DashboardTab } from "./DashboardNav";

interface DashboardHomeProps {
  username: string;
  avatarLevel: number;
  polls: Poll[];
  votedPolls: Set<string>;
  onNavigate: (tab: DashboardTab) => void;
}

const activityFeed = [
  {
    quote: "Just hit LVL 5 in Late Night Talks. The conversations here feel different.",
    name: "ghost_mind",
    title: "LVL 5 · Late Night Talks",
  },
  {
    quote: "The poll about burnout really made me reflect. 184 people feel the same way.",
    name: "silent_echo",
    title: "LVL 3 · Mental Wellness",
  },
  {
    quote: "Marketplace just dropped new avatar themes. The obsidian pack is incredible.",
    name: "neon_void",
    title: "LVL 8 · Self-Improvement",
  },
  {
    quote: "7 day streak and counting. This is the most honest I've been online.",
    name: "raw_signal",
    title: "LVL 6 · Late Night Talks",
  },
  {
    quote: "Finally found people who understand without having to explain everything.",
    name: "quiet_flame",
    title: "LVL 4 · Mental Wellness",
  },
];

const dailyActivities = [
  {
    icon: Target,
    title: "Daily Poll",
    desc: "Answer today's anonymous question",
    action: "Answer",
    tab: "polls" as DashboardTab,
  },
  {
    icon: MessageCircle,
    title: "Community Check-in",
    desc: "Say something real in your community",
    action: "Enter",
    tab: "communities" as DashboardTab,
  },
  {
    icon: Zap,
    title: "Level Up Challenge",
    desc: "Complete 3 interactions to earn XP",
    action: "Start",
    tab: "polls" as DashboardTab,
  },
];

export function DashboardHome({
  username,
  avatarLevel,
  polls,
  votedPolls,
  onNavigate,
}: DashboardHomeProps) {
  const pollsAnswered = votedPolls.size;
  const progressPct = Math.min(Math.round((pollsAnswered / polls.length) * 100), 100);

  return (
    <div className="space-y-10">
      {/* Welcome Hero */}
      <div>
        <p className="text-[10px] font-display tracking-[0.3em] uppercase text-raw-gold/50 mb-3">
          Welcome back
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-display text-3xl tracking-wide text-raw-text sm:text-4xl">
            Stay
          </h1>
          <ContainerTextFlip
            words={["anonymous", "connected", "growing", "raW"]}
            interval={2800}
            className="!text-2xl sm:!text-3xl"
          />
        </div>
        <p className="mt-3 text-sm text-raw-silver/45 max-w-md">
          Your identity is yours. Build it through honest participation.
        </p>
      </div>

      {/* Journey Progress + Streak */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Progress card */}
        <div className="sm:col-span-2 rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6">
          <h3 className="font-display text-sm tracking-wide text-raw-text">Your Journey So Far</h3>
          <p className="mt-2 text-xs text-raw-silver/40">
            You've answered {pollsAnswered} of {polls.length} polls.
          </p>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-raw-silver/40">Engagement Progress</span>
              <span className="text-raw-gold font-medium">{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-raw-border/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-raw-gold/60 to-raw-gold transition-all duration-700"
                style={{ width: `${Math.max(progressPct, 5)}%` }}
              />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-raw-gold/50" />
              <span className="text-xs text-raw-silver/50">{pollsAnswered} polls answered</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5 text-raw-gold/50" />
              <span className="text-xs text-raw-silver/50">3 communities joined</span>
            </div>
          </div>
        </div>

        {/* Streak card */}
        <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6 flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-raw-gold/10 flex items-center justify-center mb-3">
            <Trophy className="h-6 w-6 text-raw-gold/70" />
          </div>
          <p className="text-3xl font-bold text-raw-text">7</p>
          <p className="text-[9px] font-display tracking-[0.2em] uppercase text-raw-silver/35 mt-1">
            Consecutive Days
          </p>
          <p className="text-[11px] text-raw-silver/30 mt-3 italic">
            The flame of consistency burns bright.
          </p>
        </div>
      </div>

      {/* Explore Communities */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg tracking-wide text-raw-text">Explore Communities</h2>
          <button
            onClick={() => onNavigate("communities")}
            className="flex items-center gap-1 text-xs text-raw-gold/60 hover:text-raw-gold transition-colors"
          >
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GlareCard>
            <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6 h-full">
              <div className="h-32 rounded-xl bg-gradient-to-br from-raw-gold/10 to-raw-surface mb-4 flex items-center justify-center">
                <span className="font-display text-3xl text-raw-gold/20">LNT</span>
              </div>
              <div className="mb-3 inline-block rounded-full border border-raw-gold/20 bg-raw-gold/5 px-2.5 py-0.5">
                <span className="text-[9px] font-medium tracking-wider text-raw-gold/70 uppercase">Active</span>
              </div>
              <h3 className="font-display text-sm tracking-wide text-raw-text">Late Night Talks</h3>
              <p className="mt-2 text-xs text-raw-silver/40 leading-relaxed">
                Honest conversation when the world gets quiet.
              </p>
            </div>
          </GlareCard>
          <GlareCard>
            <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6 h-full">
              <div className="h-32 rounded-xl bg-gradient-to-br from-raw-gold/[0.06] to-raw-surface mb-4 flex items-center justify-center">
                <span className="font-display text-3xl text-raw-gold/20">SIC</span>
              </div>
              <div className="mb-3 inline-block rounded-full border border-raw-gold/20 bg-raw-gold/5 px-2.5 py-0.5">
                <span className="text-[9px] font-medium tracking-wider text-raw-gold/70 uppercase">Active</span>
              </div>
              <h3 className="font-display text-sm tracking-wide text-raw-text">Self-Improvement</h3>
              <p className="mt-2 text-xs text-raw-silver/40 leading-relaxed">
                Discipline, accountability, and momentum.
              </p>
            </div>
          </GlareCard>
          <GlareCard>
            <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-6 h-full">
              <div className="h-32 rounded-xl bg-gradient-to-br from-raw-gold/[0.04] to-raw-surface mb-4 flex items-center justify-center">
                <span className="font-display text-3xl text-raw-gold/20">MW</span>
              </div>
              <div className="mb-3 inline-block rounded-full border border-raw-border/40 bg-raw-surface px-2.5 py-0.5">
                <span className="text-[9px] font-medium tracking-wider text-raw-silver/40 uppercase">Early Access</span>
              </div>
              <h3 className="font-display text-sm tracking-wide text-raw-text">Mental Wellness</h3>
              <p className="mt-2 text-xs text-raw-silver/40 leading-relaxed">
                Safe space for grounded reflection and support.
              </p>
            </div>
          </GlareCard>
        </div>
      </div>

      {/* Daily Activities */}
      <div>
        <h2 className="font-display text-lg tracking-wide text-raw-text mb-5">Daily Activities</h2>
        <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/30 divide-y divide-raw-border/20">
          {dailyActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.title} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-raw-gold/[0.06] flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-raw-gold/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-raw-text">{activity.title}</p>
                    <p className="text-xs text-raw-silver/35">{activity.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(activity.tab)}
                  className="rounded-full border border-raw-gold/25 px-4 py-1.5 text-[11px] font-medium text-raw-gold/70 hover:bg-raw-gold/5 hover:border-raw-gold/40 transition-all"
                >
                  {activity.action}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Activity Feed */}
      <div>
        <h2 className="font-display text-lg tracking-wide text-raw-text mb-5">Community Pulse</h2>
        <InfiniteMovingCards items={activityFeed} direction="left" speed="slow" />
      </div>
    </div>
  );
}
